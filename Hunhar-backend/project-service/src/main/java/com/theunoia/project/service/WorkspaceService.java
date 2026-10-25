package com.theunoia.project.service;

import com.theunoia.common.exception.BadRequestException;
import com.theunoia.common.exception.ForbiddenException;
import com.theunoia.common.exception.ResourceNotFoundException;
import com.theunoia.common.internal.NotificationPublisher;
import com.theunoia.common.security.AuthUser;
import com.theunoia.project.domain.*;
import com.theunoia.project.dto.DeliverableDto;
import com.theunoia.project.dto.MilestoneDto;
import com.theunoia.project.dto.WorkspaceViewDto;
import com.theunoia.project.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkspaceService {

    private final ProjectRepository projectRepository;
    private final MilestoneRepository milestoneRepository;
    private final DeliverableRepository deliverableRepository;
    private final BidRepository bidRepository;
    private final StoredFileRepository storedFileRepository;
    private final TeamCollaboratorRepository collaboratorRepository;
    private final ProjectAccessService access;
    private final ProjectViewEnricher enricher;
    private final NotificationPublisher notifications;

    @Transactional(readOnly = true)
    public WorkspaceViewDto getWorkspace(UUID projectId, AuthUser user) {
        Project project = access.requireParticipant(projectId, user);
        enricher.project(project, user.id());

        String role = access.isClient(project, user.id()) ? "CLIENT"
                : access.isAwardedFreelancer(project, user.id()) ? "OWNER"
                : access.isCollaborator(project, user.id()) ? "COLLABORATOR" : "ADMIN";

        Map<UUID, List<Deliverable>> deliverables = deliverableRepository.findByProjectIdOrderByCreatedAtDesc(projectId)
                .stream().collect(Collectors.groupingBy(Deliverable::getMilestoneId));
        List<WorkspaceViewDto.MilestoneView> milestones = milestoneRepository.findByProjectIdOrderByCreatedAtAsc(projectId)
                .stream()
                .map(m -> WorkspaceViewDto.MilestoneView.builder()
                        .milestone(m)
                        .deliverables(deliverables.getOrDefault(m.getId(), List.of()))
                        .build())
                .collect(Collectors.toList());

        Bid winning = project.getAwardedFreelancerId() == null ? null
                : bidRepository.findByProjectIdAndFreelancerId(projectId, project.getAwardedFreelancerId()).orElse(null);

        return WorkspaceViewDto.builder()
                .project(project)
                .myRole(role)
                .agreedAmount(winning != null ? winning.getProposedCost() : project.getBudget())
                .agreedTimelineDays(winning != null ? winning.getDeliveryTimelineDays() : project.getTimelineDays())
                .milestones(milestones)
                .files(enricher.files(storedFileRepository.findByProjectIdOrderByCreatedAtDesc(projectId)))
                .team(enricher.team(collaboratorRepository.findByProjectId(projectId)))
                .build();
    }

    /** Client or the awarded freelancer can plan milestones while the project is active. */
    @Transactional
    public Milestone addMilestone(UUID projectId, MilestoneDto dto, AuthUser user) {
        Project project = access.requireParticipant(projectId, user);
        if (!access.isClient(project, user.id()) && !access.isAwardedFreelancer(project, user.id())) {
            throw new ForbiddenException("Only the client or the lead freelancer can add milestones");
        }
        if (project.getStatus() != ProjectStatus.ACTIVE) {
            throw new BadRequestException("Milestones can only be added to active projects");
        }

        Milestone milestone = milestoneRepository.save(Milestone.builder()
                .projectId(projectId)
                .title(dto.getTitle().trim())
                .description(dto.getDescription())
                .amount(dto.getAmount())
                .dueDate(dto.getDueDate())
                .status(MilestoneStatus.PENDING)
                .build());

        UUID other = access.isClient(project, user.id()) ? project.getAwardedFreelancerId() : project.getClientId();
        String link = other != null && other.equals(project.getClientId()) ? "/client/projects" : "/freelancer/projects/" + projectId;
        notifications.notify(other, "MILESTONE_ADDED", "New milestone added",
                "\"" + milestone.getTitle() + "\" was added to \"" + project.getTitle() + "\".", link);
        return milestone;
    }

    @Transactional
    public Deliverable submitDeliverable(UUID milestoneId, AuthUser user, DeliverableDto dto) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new ResourceNotFoundException("Milestone not found"));
        Project project = access.requireDeliveryMember(milestone.getProjectId(), user);

        if (project.getStatus() != ProjectStatus.ACTIVE) {
            throw new BadRequestException("Work can only be submitted on active projects");
        }
        if (milestone.getStatus() == MilestoneStatus.APPROVED || milestone.getStatus() == MilestoneStatus.PAID) {
            throw new BadRequestException("This milestone is already approved");
        }

        Deliverable deliverable = deliverableRepository.save(Deliverable.builder()
                .milestoneId(milestoneId)
                .projectId(milestone.getProjectId())
                .freelancerId(user.id())
                .notes(dto.getNotes().trim())
                .fileUrls(dto.getFileUrls() != null ? String.join(",", dto.getFileUrls()) : "")
                .isApproved(false)
                .build());

        milestone.setStatus(MilestoneStatus.SUBMITTED);
        milestoneRepository.save(milestone);

        notifications.notify(project.getClientId(), "DELIVERABLE_SUBMITTED", "Work submitted for review",
                "New work was submitted for \"" + milestone.getTitle() + "\" on \"" + project.getTitle() + "\".",
                "/client/projects");
        return deliverable;
    }

    @Transactional(readOnly = true)
    public List<Milestone> getProjectMilestones(UUID projectId, AuthUser user) {
        access.requireParticipant(projectId, user);
        return milestoneRepository.findByProjectIdOrderByCreatedAtAsc(projectId);
    }

    @Transactional(readOnly = true)
    public List<Deliverable> getDeliverablesForMilestone(UUID milestoneId, AuthUser user) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new ResourceNotFoundException("Milestone not found"));
        access.requireParticipant(milestone.getProjectId(), user);
        return deliverableRepository.findByMilestoneId(milestoneId);
    }

    @Transactional
    public void reviewDeliverable(UUID deliverableId, boolean approve, AuthUser user) {
        Deliverable deliverable = deliverableRepository.findById(deliverableId)
                .orElseThrow(() -> new ResourceNotFoundException("Deliverable not found"));
        Project project = access.requireClient(deliverable.getProjectId(), user);

        deliverable.setApproved(approve);
        deliverableRepository.save(deliverable);

        Milestone milestone = milestoneRepository.findById(deliverable.getMilestoneId()).orElse(null);
        if (milestone != null) {
            milestone.setStatus(approve ? MilestoneStatus.APPROVED : MilestoneStatus.IN_PROGRESS);
            milestoneRepository.save(milestone);
        }

        // Progress follows approved milestones
        List<Milestone> all = milestoneRepository.findByProjectId(project.getId());
        long approved = all.stream().filter(m -> m.getStatus() == MilestoneStatus.APPROVED || m.getStatus() == MilestoneStatus.PAID).count();
        if (!all.isEmpty()) {
            project.setProgressPercentage((int) Math.min(99, Math.round(approved * 100.0 / all.size())));
            projectRepository.save(project);
        }

        notifications.notify(deliverable.getFreelancerId(), approve ? "DELIVERABLE_APPROVED" : "DELIVERABLE_CHANGES",
                approve ? "Work approved ✅" : "Changes requested",
                (approve ? "The client approved your submission" : "The client asked for changes on your submission")
                        + (milestone != null ? " for \"" + milestone.getTitle() + "\"." : "."),
                "/freelancer/projects/" + project.getId());
    }

    /** The lead freelancer reports progress (0-99). Completion is done by the client. */
    @Transactional
    public Project updateProgress(UUID projectId, int progressPercentage, AuthUser user) {
        Project project = access.load(projectId);
        if (!access.isAwardedFreelancer(project, ProjectAccessService.requireUser(user).id())) {
            throw new ForbiddenException("Only the lead freelancer can update progress");
        }
        if (project.getStatus() != ProjectStatus.ACTIVE) {
            throw new BadRequestException("Progress can only be updated on active projects");
        }
        project.setProgressPercentage(Math.min(99, Math.max(0, progressPercentage)));
        return projectRepository.save(project);
    }
}
