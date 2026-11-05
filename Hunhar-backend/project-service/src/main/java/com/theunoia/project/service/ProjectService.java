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
import java.time.YearMonth;
import java.time.ZoneId;
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
    private final com.theunoia.project.repository.MilestoneRepository milestoneRepository;
    private final com.theunoia.project.repository.DisputeRepository disputeRepository;

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
                .status(Boolean.FALSE.equals(dto.getPublish()) ? ProjectStatus.DRAFT : ProjectStatus.OPEN)
                .progressPercentage(0)
                .bidCount(0)
                .build();

        return projectRepository.save(project);
    }

    /** Client edits a draft, or an open project that has not received proposals yet. */
    @Transactional
    public Project updateProject(UUID projectId, AuthUser user, CreateProjectDto dto) {
        Project p = access.requireClient(projectId, user);
        boolean editable = p.getStatus() == ProjectStatus.DRAFT || (p.getStatus() == ProjectStatus.OPEN && p.getBidCount() == 0);
        if (!editable) throw new BadRequestException("Projects can only be edited before freelancers start sending proposals");
        p.setTitle(dto.getTitle().trim());
        p.setDescription(dto.getDescription().trim());
        p.setCategory(dto.getCategory());
        p.setBudget(dto.getBudget());
        p.setTimelineDays(dto.getTimelineDays());
        p.setSkills(dto.getSkills() != null ? String.join(",", dto.getSkills()) : "");
        if (dto.getAttachmentUrls() != null) p.setAttachmentUrls(String.join(",", dto.getAttachmentUrls()));
        if (Boolean.TRUE.equals(dto.getPublish()) && p.getStatus() == ProjectStatus.DRAFT) p.setStatus(ProjectStatus.OPEN);
        return enricher.project(projectRepository.save(p), user.id());
    }

    @Transactional
    public Project publish(UUID projectId, AuthUser user) {
        Project p = access.requireClient(projectId, user);
        if (p.getStatus() != ProjectStatus.DRAFT) throw new BadRequestException("Only drafts can be published");
        p.setStatus(ProjectStatus.OPEN);
        return enricher.project(projectRepository.save(p), user.id());
    }

    /** Client cancels before hiring. Pending proposals are closed and freelancers notified. */
    @Transactional
    public Project cancelByClient(UUID projectId, AuthUser user) {
        Project p = access.requireClient(projectId, user);
        if (p.getStatus() != ProjectStatus.DRAFT && p.getStatus() != ProjectStatus.OPEN) {
            throw new BadRequestException("A project that is in progress cannot be cancelled here. Raise a dispute if something went wrong.");
        }
        closeProject(p, "The client cancelled \"" + p.getTitle() + "\".");
        return enricher.project(p, user.id());
    }

    /** Admin cancels any project that is not finished; funded but unpaid milestones are refunded to the client. */
    @Transactional
    public Project cancelByAdmin(UUID projectId, String reason) {
        Project p = access.load(projectId);
        if (p.getStatus() == ProjectStatus.COMPLETED || p.getStatus() == ProjectStatus.CANCELLED) {
            throw new BadRequestException("This project is already " + p.getStatus().name().toLowerCase());
        }
        String why = reason == null || reason.isBlank() ? "Cancelled by Hunhar support" : reason.trim();
        for (Milestone m : milestoneRepository.findByProjectId(projectId)) {
            if (m.isFunded() && m.getStatus() != MilestoneStatus.PAID) {
                internalClient.postChecked(internalClient.billing() + "/internal/escrow/refund",
                        Map.of("clientId", p.getClientId().toString(), "amount", m.getAmount(),
                                "projectId", projectId.toString(), "milestoneId", m.getId().toString(),
                                "title", "\"" + p.getTitle() + "\" was cancelled"),
                        new ParameterizedTypeReference<Map<String, Object>>() {});
                m.setFunded(false);
                milestoneRepository.save(m);
            }
        }
        closeProject(p, "\"" + p.getTitle() + "\" was cancelled: " + why);
        notifications.notify(p.getClientId(), "PROJECT_CANCELLED", "Project cancelled", "\"" + p.getTitle() + "\" was cancelled: " + why, "/client/projects");
        if (p.getAwardedFreelancerId() != null) {
            notifications.notify(p.getAwardedFreelancerId(), "PROJECT_CANCELLED", "Project cancelled", "\"" + p.getTitle() + "\" was cancelled: " + why, "/freelancer/projects");
        }
        return enricher.project(p, null);
    }

    private void closeProject(Project p, String message) {
        p.setStatus(ProjectStatus.CANCELLED);
        p.setEndDate(Instant.now());
        projectRepository.save(p);
        for (Bid b : bidRepository.findByProjectId(p.getId())) {
            if (b.getStatus() == BidStatus.SUBMITTED || b.getStatus() == BidStatus.SHORTLISTED) {
                b.setStatus(BidStatus.REJECTED);
                bidRepository.save(b);
                notifications.notify(b.getFreelancerId(), "BID_REJECTED", "Project closed", message, "/freelancer/bids");
            }
        }
    }

    @Transactional(readOnly = true)
    public List<Project> adminList(ProjectStatus status, String search) {
        String q = search == null || search.isBlank() ? null : search.trim().toLowerCase();
        List<Project> all = new ArrayList<>(projectRepository.findAll(Sort.by("createdAt").descending()));
        all.removeIf(p -> (status != null && p.getStatus() != status)
                || (q != null && !p.getTitle().toLowerCase().contains(q) && !p.getCategory().toLowerCase().contains(q)));
        return enricher.projects(all.size() > 500 ? new ArrayList<>(all.subList(0, 500)) : all, null);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> stats() {
        ZoneId ist = ZoneId.of("Asia/Kolkata");
        Map<String, Object> s = new LinkedHashMap<>();
        s.put("totalProjects", projectRepository.count());
        for (ProjectStatus st : ProjectStatus.values()) {
            s.put(st.name().toLowerCase() + "Projects", projectRepository.countByStatus(st));
        }
        s.put("openDisputes", disputeRepository.countByStatus("OPEN"));
        YearMonth now = YearMonth.now(ist);
        List<Map<String, Object>> monthly = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            YearMonth ym = now.minusMonths(i);
            Instant from = ym.atDay(1).atStartOfDay(ist).toInstant();
            Instant to = ym.plusMonths(1).atDay(1).atStartOfDay(ist).toInstant();
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("month", ym.getMonth().getDisplayName(java.time.format.TextStyle.SHORT, java.util.Locale.ENGLISH) + " " + ym.getYear());
            m.put("projects", projectRepository.countByCreatedAtBetween(from, to));
            m.put("proposals", bidRepository.countByCreatedAtBetween(from, to));
            monthly.add(m);
        }
        s.put("monthly", monthly);
        return s;
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
        return enricher.projects(projectRepository.findByClientIdOrderByCreatedAtDesc(clientId), clientId);
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
