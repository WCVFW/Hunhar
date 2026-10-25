package com.theunoia.project.service;

import com.theunoia.common.dto.PagedResponse;
import com.theunoia.common.exception.BadRequestException;
import com.theunoia.common.exception.ForbiddenException;
import com.theunoia.common.internal.InternalClient;
import com.theunoia.common.internal.NotificationPublisher;
import com.theunoia.common.security.AuthUser;
import com.theunoia.project.domain.*;
import com.theunoia.project.dto.CreateProjectDto;
import com.theunoia.project.repository.BidRepository;
import com.theunoia.project.repository.ProjectRepository;
import com.theunoia.project.repository.TeamCollaboratorRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final BidRepository bidRepository;
    private final TeamCollaboratorRepository collaboratorRepository;
    private final ProjectAccessService access;
    private final ProjectViewEnricher enricher;
    private final NotificationPublisher notifications;
    private final InternalClient internalClient;

    public record SearchFilters(
            List<String> categories,
            List<String> excludeCategories,
            String search,
            BigDecimal minBudget,
            BigDecimal maxBudget,
            Integer maxDays,
            String sort
    ) {}

    @Transactional
    public Project createProject(UUID clientId, CreateProjectDto dto) {
        String skillsStr = dto.getSkills() != null ? String.join(",", dto.getSkills()) : "";
        String attachmentsStr = dto.getAttachmentUrls() != null ? String.join(",", dto.getAttachmentUrls()) : "";

        Project project = Project.builder()
                .clientId(clientId)
                .title(dto.getTitle())
                .description(dto.getDescription())
                .category(dto.getCategory())
                .budget(dto.getBudget())
                .timelineDays(dto.getTimelineDays())
                .skills(skillsStr)
                .attachmentUrls(attachmentsStr)
                .status(ProjectStatus.OPEN)
                .progressPercentage(0)
                .bidCount(0)
                .build();

        return projectRepository.save(project);
    }

    /**
     * Open projects are visible to every logged-in user. Once a project is awarded, only its
     * participants (and freelancers who bid on it) can still open it.
     */
    @Transactional(readOnly = true)
    public Project getProjectById(UUID id, AuthUser viewer) {
        Project project = access.load(id);
        if (project.getStatus() != ProjectStatus.OPEN && viewer != null
                && !access.isParticipant(project, viewer)
                && bidRepository.findByProjectIdAndFreelancerId(id, viewer.id()).isEmpty()) {
            throw new ForbiddenException("This project is no longer open");
        }
        enricher.project(project, viewer == null ? null : viewer.id());
        if (viewer != null && access.isCollaborator(project, viewer.id())) {
            project.setMyRole("COLLABORATOR");
        }
        return project;
    }

    @Transactional(readOnly = true)
    public PagedResponse<Project> searchProjects(SearchFilters f, int page, int size, UUID viewerId) {
        Sort sort = switch (f.sort() == null ? "" : f.sort()) {
            case "budget_desc" -> Sort.by("budget").descending();
            case "budget_asc" -> Sort.by("budget").ascending();
            case "deadline_asc" -> Sort.by("timelineDays").ascending();
            default -> Sort.by("createdAt").descending();
        };
        Page<Project> result = projectRepository.findAll(openProjects(f),
                PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50), sort));

        List<Project> content = new ArrayList<>(result.getContent());
        enricher.projects(content, viewerId);

        return PagedResponse.<Project>builder()
                .content(content)
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .last(result.isLast())
                .build();
    }

    private Specification<Project> openProjects(SearchFilters f) {
        return (root, query, cb) -> {
            List<Predicate> preds = new ArrayList<>();
            preds.add(cb.equal(root.get("status"), ProjectStatus.OPEN));
            if (f.categories() != null && !f.categories().isEmpty()) {
                preds.add(cb.lower(root.get("category")).in(lower(f.categories())));
            }
            if (f.excludeCategories() != null && !f.excludeCategories().isEmpty()) {
                preds.add(cb.not(cb.lower(root.get("category")).in(lower(f.excludeCategories()))));
            }
            if (f.search() != null && !f.search().isBlank()) {
                String like = "%" + f.search().trim().toLowerCase() + "%";
                preds.add(cb.or(
                        cb.like(cb.lower(root.get("title")), like),
                        cb.like(cb.lower(root.get("description")), like),
                        cb.like(cb.lower(root.get("skills")), like)));
            }
            if (f.minBudget() != null) preds.add(cb.greaterThanOrEqualTo(root.get("budget"), f.minBudget()));
            if (f.maxBudget() != null) preds.add(cb.lessThanOrEqualTo(root.get("budget"), f.maxBudget()));
            if (f.maxDays() != null) preds.add(cb.lessThanOrEqualTo(root.get("timelineDays"), f.maxDays()));
            return cb.and(preds.toArray(new Predicate[0]));
        };
    }

    private static List<String> lower(List<String> values) {
        return values.stream().map(v -> v.trim().toLowerCase()).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Project> getClientProjects(UUID clientId) {
        return enricher.projects(projectRepository.findByClientId(clientId), clientId);
    }

    /** Projects the freelancer is delivering: awarded to them, or joined as an accepted team member. */
    @Transactional(readOnly = true)
    public List<Project> getFreelancerProjects(UUID freelancerId) {
        List<Project> owned = projectRepository.findByAwardedFreelancerId(freelancerId);
        Set<UUID> collabIds = collaboratorRepository.findByCollaboratorFreelancerIdAndStatus(freelancerId, "ACCEPTED")
                .stream().map(TeamCollaborator::getProjectId).collect(Collectors.toSet());
        List<Project> collab = projectRepository.findAllById(collabIds);
        collab.forEach(p -> p.setMyRole("COLLABORATOR"));

        List<Project> all = new ArrayList<>(owned);
        collab.stream().filter(p -> !freelancerId.equals(p.getAwardedFreelancerId())).forEach(all::add);
        all.sort(Comparator.comparing(Project::getUpdatedAt, Comparator.nullsLast(Comparator.reverseOrder())));
        return enricher.projects(all, freelancerId);
    }

    /** Client marks the work as complete: closes the project and credits the freelancer's stats. */
    @Transactional
    public Project completeProject(UUID projectId, AuthUser user) {
        Project project = access.requireClient(projectId, user);
        if (project.getStatus() != ProjectStatus.ACTIVE) {
            throw new BadRequestException("Only active projects can be marked complete");
        }
        project.setStatus(ProjectStatus.COMPLETED);
        project.setProgressPercentage(100);
        project.setEndDate(Instant.now());
        projectRepository.save(project);

        BigDecimal earned = bidRepository.findByProjectIdAndFreelancerId(projectId, project.getAwardedFreelancerId())
                .map(Bid::getProposedCost).orElse(project.getBudget());
        try {
            internalClient.post(internalClient.identity() + "/internal/freelancers/" + project.getAwardedFreelancerId() + "/completed-project",
                    Map.of("revenue", earned), new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            log.warn("Could not update freelancer stats for project {}: {}", projectId, e.getMessage());
        }
        notifications.notify(project.getAwardedFreelancerId(), "PROJECT_COMPLETED",
                "Project completed 🎉",
                "The client marked \"" + project.getTitle() + "\" as complete.",
                "/freelancer/projects/" + projectId);
        return enricher.project(project, user.id());
    }

    @Transactional
    public Project updateProjectStatus(UUID projectId, ProjectStatus status) {
        Project project = access.load(projectId);
        project.setStatus(status);
        return projectRepository.save(project);
    }
}
