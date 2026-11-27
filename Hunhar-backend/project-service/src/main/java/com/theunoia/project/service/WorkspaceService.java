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

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
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
    private final com.theunoia.common.internal.InternalClient internalClient;
    private final com.theunoia.common.internal.PlatformSettingsClient settings;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    public record MilestoneTaskItem(
            String id,
            String title,
            String description,
            String status, // "TODO", "IN_PROGRESS", "DONE"
            String createdAt,
            String completedAt
    ) {}

    public record MilestoneTaskRequest(
            String title,
            String description,
            String status
    ) {}

    @Transactional
    public WorkspaceViewDto getWorkspace(UUID projectId, AuthUser user) {
        Project project = access.requireParticipant(projectId, user);
        enricher.project(project, user.id());

        String role = access.isClient(project, user.id()) ? "CLIENT"
                : access.isAwardedFreelancer(project, user.id()) ? "OWNER"
                : access.isCollaborator(project, user.id()) ? "COLLABORATOR" : "ADMIN";

        Bid winning = project.getAwardedFreelancerId() == null ? null
                : bidRepository.findByProjectIdAndFreelancerId(projectId, project.getAwardedFreelancerId()).orElse(null);

        List<Milestone> existingMilestones = milestoneRepository.findByProjectIdOrderByCreatedAtAsc(projectId);
        if (existingMilestones.isEmpty() && project.getStatus() == ProjectStatus.ACTIVE) {
            initDefaultMilestonesForProject(project, winning != null ? winning.getProposedCost() : project.getBudget());
            existingMilestones = milestoneRepository.findByProjectIdOrderByCreatedAtAsc(projectId);
        }

        Map<UUID, List<Deliverable>> deliverables = deliverableRepository.findByProjectIdOrderByCreatedAtDesc(projectId)
                .stream().collect(Collectors.groupingBy(Deliverable::getMilestoneId));
        List<WorkspaceViewDto.MilestoneView> milestones = existingMilestones
                .stream()
                .map(m -> WorkspaceViewDto.MilestoneView.builder()
                        .milestone(m)
                        .deliverables(deliverables.getOrDefault(m.getId(), List.of()))
                        .build())
                .collect(Collectors.toList());

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
                .files(enricher.files(storedFileRepository.findByProjectIdOrderByCreatedAtDesc(projectId)))
                .team(enricher.team(collaboratorRepository.findByProjectId(projectId)))
                .build();
    }

    /**
     * Milestones are agreed through the milestone plan (MilestonePlanService); adding one directly is only for admins
     * (e.g. fixing a project by hand).
     */
    @Transactional
    public Milestone addMilestone(UUID projectId, MilestoneDto dto, AuthUser user) {
        Project project = access.requireParticipant(projectId, user);
        if (!user.hasRole("ADMIN")) {
            throw new BadRequestException("Milestones are agreed through the milestone plan: propose or edit the plan and accept it");
        }
        if (!access.isClient(project, user.id()) && !access.isAwardedFreelancer(project, user.id())) {
            throw new ForbiddenException("Only the client or the lead freelancer can add milestones");
        }
        if (project.getStatus() != ProjectStatus.ACTIVE) {
            throw new BadRequestException("Milestones can only be added to active projects");
        }
        if (dto.getDueDate() != null && dto.getDueDate().isBefore(java.time.Instant.now().minusSeconds(86400))) {
            throw new BadRequestException("Due date cannot be in the past");
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
        String link = other != null && other.equals(project.getClientId()) ? "/client/projects/" + projectId : "/freelancer/projects/" + projectId;
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
        // Milestone-based payment: work starts once the client has put the money in escrow
        if (!milestone.isFunded()) {
            throw new BadRequestException("Wait until the client funds this milestone before submitting work");
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
        milestone.setSubmittedAt(java.time.Instant.now());
        milestoneRepository.save(milestone);

        notifications.notify(project.getClientId(), "DELIVERABLE_SUBMITTED", "Work submitted for review",
                "New work was submitted for \"" + milestone.getTitle() + "\" on \"" + project.getTitle() + "\".",
                "/client/projects/" + project.getId());
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

    /** Client moves the milestone amount from their wallet into escrow, so the freelancer knows the money is there. */
    @Transactional
    public Milestone fundMilestone(UUID milestoneId, AuthUser user) {
        Milestone m = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new ResourceNotFoundException("Milestone not found"));
        Project project = access.requireClient(m.getProjectId(), user);
        if (project.getStatus() != ProjectStatus.ACTIVE) throw new BadRequestException("Only milestones of active projects can be funded");
        if (m.isFunded()) throw new BadRequestException("This milestone is already funded");
        if (m.getStatus() == MilestoneStatus.PAID) throw new BadRequestException("This milestone is already paid");

        internalClient.postChecked(internalClient.billing() + "/internal/escrow/lock",
                Map.of("clientId", project.getClientId().toString(), "amount", m.getAmount(),
                        "projectId", project.getId().toString(), "milestoneId", m.getId().toString()),
                new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {});

        m.setFunded(true);
        m.setFundedAt(java.time.Instant.now());
        if (m.getStatus() == MilestoneStatus.PENDING) m.setStatus(MilestoneStatus.IN_PROGRESS);
        milestoneRepository.save(m);
        notifications.notify(project.getAwardedFreelancerId(), "MILESTONE_FUNDED", "Milestone funded 💰",
                "The client put ₹" + m.getAmount().toPlainString() + " in escrow for \"" + m.getTitle() + "\". You can start working.",
                "/freelancer/projects/" + project.getId());
        return m;
    }

    /** Client pays an approved, funded milestone: escrow -> freelancer wallet (minus platform fee) + invoice. */
    @Transactional
    public Milestone releaseMilestone(UUID milestoneId, AuthUser user) {
        Milestone m = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new ResourceNotFoundException("Milestone not found"));
        Project project = access.requireClient(m.getProjectId(), user);
        if (!m.isFunded()) throw new BadRequestException("Fund this milestone before releasing payment");
        if (m.getStatus() == MilestoneStatus.PAID) throw new BadRequestException("This milestone is already paid");
        if (m.getStatus() != MilestoneStatus.APPROVED) throw new BadRequestException("Approve the submitted work before releasing payment");

        Map<String, Object> res = internalClient.postChecked(internalClient.billing() + "/internal/escrow/release",
                Map.of("clientId", project.getClientId().toString(), "freelancerId", project.getAwardedFreelancerId().toString(),
                        "amount", m.getAmount(), "projectId", project.getId().toString(), "milestoneId", m.getId().toString(),
                        "title", m.getTitle()),
                new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {});

        m.setStatus(MilestoneStatus.PAID);
        m.setPaidAt(java.time.Instant.now());
        if (res != null && res.get("invoiceNumber") != null) m.setInvoiceNumber(String.valueOf(res.get("invoiceNumber")));
        return milestoneRepository.save(m);
    }

    /**
     * If the client does not review submitted work within the admin-set number of days,
     * it is approved automatically (0 disables this). Runs hourly.
     */
    @org.springframework.scheduling.annotation.Scheduled(fixedDelay = 3_600_000, initialDelay = 120_000)
    @Transactional
    public void autoApproveStaleSubmissions() {
        int days = settings.getInt("autoApproveDays", 7);
        if (days <= 0) return;
        java.time.Instant cutoff = java.time.Instant.now().minus(java.time.Duration.ofDays(days));
        for (Milestone m : milestoneRepository.findByStatusAndSubmittedAtBefore(MilestoneStatus.SUBMITTED, cutoff)) {
            m.setStatus(MilestoneStatus.APPROVED);
            milestoneRepository.save(m);
            deliverableRepository.findByMilestoneId(m.getId()).stream()
                    .filter(d -> !d.isApproved())
                    .forEach(d -> {
                        d.setApproved(true);
                        deliverableRepository.save(d);
                    });
            projectRepository.findById(m.getProjectId()).ifPresent(p -> {
                notifications.notify(p.getAwardedFreelancerId(), "DELIVERABLE_APPROVED", "Work auto-approved",
                        "\"" + m.getTitle() + "\" was approved automatically after " + days + " days without client review.",
                        "/freelancer/projects/" + p.getId());
                notifications.notify(p.getClientId(), "DELIVERABLE_APPROVED", "Work auto-approved",
                        "\"" + m.getTitle() + "\" on \"" + p.getTitle() + "\" was approved automatically. Release the payment when ready.",
                        "/client/projects/" + p.getId());
            });
        }
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

    // ------------------------------------------------------------------ milestone tasks / card board

    private List<MilestoneTaskItem> parseTasks(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new com.fasterxml.jackson.core.type.TypeReference<List<MilestoneTaskItem>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    private String writeTasks(List<MilestoneTaskItem> tasks) {
        try {
            return objectMapper.writeValueAsString(tasks);
        } catch (Exception e) {
            return "[]";
        }
    }

    @Transactional
    public List<MilestoneTaskItem> addMilestoneTask(UUID milestoneId, MilestoneTaskRequest req, AuthUser user) {
        Milestone m = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new ResourceNotFoundException("Milestone not found"));
        Project p = access.requireParticipant(m.getProjectId(), user);
        if (!access.isAwardedFreelancer(p, user.id()) && !access.isCollaborator(p, user.id()) && !access.isClient(p, user.id())) {
            throw new ForbiddenException("Only project participants can manage tasks");
        }
        if (m.getStatus() == MilestoneStatus.APPROVED || m.getStatus() == MilestoneStatus.PAID) {
            throw new BadRequestException("This milestone has already been accepted and completed. No further changes can be made.");
        }
        String title = req.title() != null ? req.title().trim() : "";
        if (title.isEmpty()) throw new BadRequestException("Task title is required");

        List<MilestoneTaskItem> list = new ArrayList<>(parseTasks(m.getTasksJson()));
        list.add(new MilestoneTaskItem(
                UUID.randomUUID().toString(),
                title,
                req.description() != null ? req.description().trim() : null,
                req.status() != null && !req.status().isBlank() ? req.status().toUpperCase() : "TODO",
                Instant.now().toString(),
                "DONE".equalsIgnoreCase(req.status()) ? Instant.now().toString() : null
        ));
        m.setTasksJson(writeTasks(list));
        milestoneRepository.save(m);
        return list;
    }

    @Transactional
    public List<MilestoneTaskItem> updateMilestoneTask(UUID milestoneId, String taskId, MilestoneTaskRequest req, AuthUser user) {
        Milestone m = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new ResourceNotFoundException("Milestone not found"));
        Project p = access.requireParticipant(m.getProjectId(), user);
        if (!access.isAwardedFreelancer(p, user.id()) && !access.isCollaborator(p, user.id()) && !access.isClient(p, user.id())) {
            throw new ForbiddenException("Only project participants can manage tasks");
        }
        if (m.getStatus() == MilestoneStatus.APPROVED || m.getStatus() == MilestoneStatus.PAID) {
            throw new BadRequestException("This milestone has already been accepted and completed. No further changes can be made.");
        }
        List<MilestoneTaskItem> list = new ArrayList<>(parseTasks(m.getTasksJson()));
        boolean found = false;
        for (int i = 0; i < list.size(); i++) {
            MilestoneTaskItem it = list.get(i);
            if (it.id().equals(taskId)) {
                String newStatus = req.status() != null && !req.status().isBlank() ? req.status().toUpperCase() : it.status();
                String completedAt = "DONE".equals(newStatus) ? (it.completedAt() != null ? it.completedAt() : Instant.now().toString()) : null;
                list.set(i, new MilestoneTaskItem(
                        it.id(),
                        req.title() != null && !req.title().isBlank() ? req.title().trim() : it.title(),
                        req.description() != null ? req.description().trim() : it.description(),
                        newStatus,
                        it.createdAt(),
                        completedAt
                ));
                found = true;
                break;
            }
        }
        if (!found) throw new ResourceNotFoundException("Task not found");
        m.setTasksJson(writeTasks(list));
        milestoneRepository.save(m);
        return list;
    }

    @Transactional
    public List<MilestoneTaskItem> deleteMilestoneTask(UUID milestoneId, String taskId, AuthUser user) {
        Milestone m = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new ResourceNotFoundException("Milestone not found"));
        Project p = access.requireParticipant(m.getProjectId(), user);
        if (!access.isAwardedFreelancer(p, user.id()) && !access.isCollaborator(p, user.id()) && !access.isClient(p, user.id())) {
            throw new ForbiddenException("Only project participants can manage tasks");
        }
        if (m.getStatus() == MilestoneStatus.APPROVED || m.getStatus() == MilestoneStatus.PAID) {
            throw new BadRequestException("This milestone has already been accepted and completed. No further changes can be made.");
        }
        List<MilestoneTaskItem> list = new ArrayList<>(parseTasks(m.getTasksJson()));
        list.removeIf(t -> t.id().equals(taskId));
        m.setTasksJson(writeTasks(list));
        milestoneRepository.save(m);
        return list;
    }

    // ------------------------------------------------------------------ auto milestone generation

    @Transactional
    public void initDefaultMilestonesForProject(Project p, BigDecimal agreedAmount) {
        if (p.getStatus() != ProjectStatus.ACTIVE) return;
        if (!milestoneRepository.findByProjectId(p.getId()).isEmpty()) return;

        if (agreedAmount == null || agreedAmount.compareTo(BigDecimal.ZERO) <= 0) {
            agreedAmount = p.getBudget() != null ? p.getBudget() : BigDecimal.valueOf(1000);
        }

        List<String> phaseList = new ArrayList<>();
        if (p.getPhases() != null && !p.getPhases().isBlank()) {
            for (String s : p.getPhases().split("\\|\\|")) {
                String trimmed = s.trim();
                if (!trimmed.isEmpty()) phaseList.add(trimmed);
            }
        }
        if (phaseList.isEmpty()) {
            phaseList.addAll(SkillPhasesCatalogue.getPhasesForSkill(p.getSubCategory(), p.getCategory(), p.getTitle()));
        }

        int count = Math.max(1, phaseList.size());
        BigDecimal total = agreedAmount;
        BigDecimal perPhase = total.divide(BigDecimal.valueOf(count), 0, RoundingMode.HALF_UP);
        BigDecimal accumulated = BigDecimal.ZERO;

        for (int i = 0; i < count; i++) {
            BigDecimal amt;
            if (i == count - 1) {
                amt = total.subtract(accumulated);
                if (amt.compareTo(BigDecimal.ZERO) < 0) amt = BigDecimal.ZERO;
            } else {
                amt = perPhase;
                accumulated = accumulated.add(amt);
            }
            milestoneRepository.save(Milestone.builder()
                    .projectId(p.getId())
                    .title(phaseList.get(i))
                    .description("Phase " + (i + 1) + " deliverable checkpoint")
                    .amount(amt)
                    .status(MilestoneStatus.PENDING)
                    .funded(false)
                    .tasksJson("[]")
                    .build());
        }
    }

    private List<String> defaultPhasesForCategory(String category) {
        return SkillPhasesCatalogue.getPhasesForSkill(null, category, null);
    }
}
