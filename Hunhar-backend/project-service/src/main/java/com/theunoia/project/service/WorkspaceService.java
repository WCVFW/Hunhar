package com.theunoia.project.service;

import com.theunoia.common.event.EventPublisher;
import com.theunoia.common.exception.ApiException;
import com.theunoia.common.security.AuthUser;
import com.theunoia.project.config.ProjectProperties;
import com.theunoia.project.domain.Deliverable;
import com.theunoia.project.domain.Milestone;
import com.theunoia.project.domain.Project;
import com.theunoia.project.domain.ProjectUpdate;
import com.theunoia.project.domain.TeamMember;
import com.theunoia.project.dto.ProjectDtos.MilestoneRequest;
import com.theunoia.project.dto.ProjectDtos.MilestoneResponse;
import com.theunoia.project.dto.ProjectDtos.ProgressUpdateRequest;
import com.theunoia.project.dto.ProjectDtos.SubmitWorkRequest;
import com.theunoia.project.dto.ProjectDtos.TeamInviteRequest;
import com.theunoia.project.repository.ProjectRepositories.DeliverableRepository;
import com.theunoia.project.repository.ProjectRepositories.MilestoneRepository;
import com.theunoia.project.repository.ProjectRepositories.ProjectUpdateRepository;
import com.theunoia.project.repository.ProjectRepositories.TeamMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Project workspace: milestones, deliverables, progress tracking, team collaboration, completion. */
@Service
@RequiredArgsConstructor
public class WorkspaceService {

    private final MilestoneRepository milestones;
    private final DeliverableRepository deliverables;
    private final ProjectUpdateRepository updates;
    private final TeamMemberRepository team;
    private final ProjectAccess access;
    private final ProjectService projectService;
    private final EventPublisher events;
    private final ProjectProperties props;

    @Transactional(readOnly = true)
    public Map<String, Object> workspace(AuthUser user, UUID projectId) {
        Project p = access.requireParticipant(projectId, user);
        List<Milestone> ms = milestones.findByProjectIdOrderByPositionAsc(projectId);
        BigDecimal total = ms.stream().filter(m -> m.getStatus() != Milestone.Status.CANCELLED)
                .map(Milestone::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal paid = ms.stream().filter(m -> m.getStatus() == Milestone.Status.PAID ||
                        (p.getPaymentMode() == Project.PaymentMode.DIRECT && m.getStatus() == Milestone.Status.APPROVED))
                .map(Milestone::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        long done = ms.stream().filter(m -> Milestone.SETTLED.contains(m.getStatus()) && m.getStatus() != Milestone.Status.CANCELLED).count();
        long active = ms.stream().filter(m -> m.getStatus() != Milestone.Status.CANCELLED).count();

        Map<String, Object> w = new LinkedHashMap<>();
        w.put("project", projectService.view(p, user));
        w.put("milestones", ms.stream().map(MilestoneResponse::of).toList());
        w.put("progress", Map.of("milestonesCompleted", done, "milestonesTotal", active,
                "percent", active == 0 ? 0 : Math.round(100.0 * done / active), "contractValue", total, "paidOut", paid));
        w.put("deliverables", deliverables.findByProjectIdOrderByCreatedAtDesc(projectId));
        w.put("updates", updates.findTop50ByProjectIdOrderByCreatedAtDesc(projectId));
        w.put("team", team.findByProjectId(projectId));
        return w;
    }

    // ------------------------------------------------------------------ milestones (client)

    @Transactional
    public MilestoneResponse addMilestone(AuthUser client, UUID projectId, MilestoneRequest req) {
        Project p = access.requireOwner(projectId, client);
        ProjectAccess.requireStatus(p, Project.Status.IN_PROGRESS);
        Milestone m = new Milestone();
        m.setProjectId(projectId);
        apply(m, req);
        m.setPosition(milestones.countByProjectId(projectId) + 1);
        milestones.save(m);
        events.publish("milestone.created", BidService.milestoneEvent(p, m));
        return MilestoneResponse.of(m);
    }

    @Transactional
    public MilestoneResponse updateMilestone(AuthUser client, UUID milestoneId, MilestoneRequest req) {
        Milestone m = load(milestoneId);
        access.requireOwner(m.getProjectId(), client);
        requireMilestone(m, Milestone.Status.PENDING);
        apply(m, req);
        return MilestoneResponse.of(m);
    }

    @Transactional
    public void cancelMilestone(AuthUser client, UUID milestoneId) {
        Milestone m = load(milestoneId);
        access.requireOwner(m.getProjectId(), client);
        requireMilestone(m, Milestone.Status.PENDING);
        m.setStatus(Milestone.Status.CANCELLED);
    }

    // ------------------------------------------------------------------ delivery (freelancer / team)

    @Transactional
    public MilestoneResponse submitWork(AuthUser worker, UUID milestoneId, SubmitWorkRequest req) {
        Milestone m = load(milestoneId);
        Project p = access.requireWorker(m.getProjectId(), worker);
        ProjectAccess.requireStatus(p, Project.Status.IN_PROGRESS);
        if (p.getPaymentMode() == Project.PaymentMode.PLATFORM) {
            requireMilestone(m, Milestone.Status.FUNDED, Milestone.Status.REVISION_REQUESTED);
        } else {
            requireMilestone(m, Milestone.Status.PENDING, Milestone.Status.REVISION_REQUESTED);
        }
        Deliverable d = new Deliverable();
        d.setMilestoneId(milestoneId);
        d.setProjectId(p.getId());
        d.setSubmittedBy(worker.id());
        d.setNote(req.note());
        if (req.attachments() != null) {
            d.setAttachments(req.attachments().stream().map(a -> Map.<String, Object>of("fileId", a.fileId().toString(),
                    "fileName", a.fileName(), "url", a.url())).toList());
        }
        deliverables.save(d);
        m.setStatus(Milestone.Status.SUBMITTED);
        m.setSubmittedAt(Instant.now());
        events.publish("milestone.submitted", BidService.milestoneEvent(p, m));
        return MilestoneResponse.of(m);
    }

    /** Client approval. For PLATFORM payments this triggers the escrow release in payment-service. */
    @Transactional
    public MilestoneResponse approve(AuthUser client, UUID milestoneId, String note) {
        Milestone m = load(milestoneId);
        Project p = access.requireOwner(m.getProjectId(), client);
        requireMilestone(m, Milestone.Status.SUBMITTED);
        m.setStatus(Milestone.Status.APPROVED);
        m.setApprovedAt(Instant.now());
        deliverables.findFirstByMilestoneIdOrderByCreatedAtDesc(milestoneId).ifPresent(d -> {
            d.setStatus(Deliverable.Status.APPROVED);
            d.setReviewNote(note);
            d.setReviewedAt(Instant.now());
        });
        events.publish("milestone.approved", BidService.milestoneEvent(p, m));
        return MilestoneResponse.of(m);
    }

    @Transactional
    public MilestoneResponse requestRevision(AuthUser client, UUID milestoneId, String note) {
        Milestone m = load(milestoneId);
        Project p = access.requireOwner(m.getProjectId(), client);
        requireMilestone(m, Milestone.Status.SUBMITTED);
        m.setStatus(Milestone.Status.REVISION_REQUESTED);
        deliverables.findFirstByMilestoneIdOrderByCreatedAtDesc(milestoneId).ifPresent(d -> {
            d.setStatus(Deliverable.Status.REVISION_REQUESTED);
            d.setReviewNote(note);
            d.setReviewedAt(Instant.now());
        });
        Map<String, Object> data = BidService.milestoneEvent(p, m);
        data.put("note", note == null ? "" : note);
        events.publish("milestone.revision_requested", data);
        return MilestoneResponse.of(m);
    }

    @Transactional
    public ProjectUpdate postUpdate(AuthUser user, UUID projectId, ProgressUpdateRequest req) {
        Project p = access.requireParticipant(projectId, user);
        ProjectAccess.requireStatus(p, Project.Status.IN_PROGRESS, Project.Status.DISPUTED);
        ProjectUpdate u = new ProjectUpdate();
        u.setProjectId(projectId);
        u.setAuthorId(user.id());
        u.setMessage(req.message());
        u.setProgressPercent(req.progressPercent());
        return updates.save(u);
    }

    /** Client closes the project once every milestone is settled. */
    @Transactional
    public Map<String, Object> complete(AuthUser client, UUID projectId) {
        Project p = access.requireOwner(projectId, client);
        ProjectAccess.requireStatus(p, Project.Status.IN_PROGRESS);
        List<Milestone> ms = milestones.findByProjectIdOrderByPositionAsc(projectId);
        if (ms.stream().anyMatch(m -> !Milestone.SETTLED.contains(m.getStatus()))) {
            throw ApiException.unprocessable("MILESTONES_OPEN", "All milestones must be approved (or cancelled) before completion");
        }
        BigDecimal total = ms.stream().filter(m -> m.getStatus() == Milestone.Status.APPROVED || m.getStatus() == Milestone.Status.PAID)
                .map(Milestone::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        p.setStatus(Project.Status.COMPLETED);
        p.setCompletedAt(Instant.now());
        Map<String, Object> data = new HashMap<>();
        data.put("projectId", projectId);
        data.put("projectTitle", p.getTitle());
        data.put("clientId", p.getClientId());
        data.put("freelancerId", p.getFreelancerId());
        data.put("totalAmount", total);
        data.put("paymentMode", p.getPaymentMode().name());
        events.publish("project.completed", data);
        return Map.of("projectId", projectId, "status", p.getStatus().name(), "totalAmount", total);
    }

    // ------------------------------------------------------------------ collaboration

    @Transactional
    public TeamMember invite(AuthUser owner, UUID projectId, TeamInviteRequest req) {
        Project p = access.load(projectId);
        if (!p.isAssignedTo(owner.id())) throw ApiException.forbidden("Only the awarded freelancer can build a team");
        ProjectAccess.requireStatus(p, Project.Status.IN_PROGRESS);
        if (req.memberId().equals(owner.id()) || p.isOwnedBy(req.memberId())) throw ApiException.badRequest("Invalid team member");
        long size = team.findByProjectId(projectId).stream()
                .filter(t -> t.getStatus() == TeamMember.Status.INVITED || t.getStatus() == TeamMember.Status.ACCEPTED).count();
        if (size >= props.getMaxTeamSize()) throw ApiException.unprocessable("TEAM_FULL", "Team size limit reached");
        TeamMember t = team.findByProjectIdAndMemberId(projectId, req.memberId()).orElseGet(TeamMember::new);
        if (t.getStatus() == TeamMember.Status.ACCEPTED) throw ApiException.conflict("Already a team member");
        t.setProjectId(projectId);
        t.setOwnerId(owner.id());
        t.setMemberId(req.memberId());
        t.setRole(req.role() == null || req.role().isBlank() ? "COLLABORATOR" : req.role());
        t.setStatus(TeamMember.Status.INVITED);
        t.setRespondedAt(null);
        team.save(t);
        events.publish("team.invited", Map.of("projectId", projectId, "projectTitle", p.getTitle(), "ownerId", owner.id(),
                "memberId", req.memberId(), "invitationId", t.getId()));
        return t;
    }

    @Transactional
    public TeamMember respond(AuthUser member, UUID invitationId, boolean accept) {
        TeamMember t = team.findById(invitationId).orElseThrow(() -> ApiException.notFound("Invitation"));
        if (!t.getMemberId().equals(member.id())) throw ApiException.forbidden("Not your invitation");
        if (t.getStatus() != TeamMember.Status.INVITED) throw ApiException.unprocessable("INVALID_STATE", "Invitation already answered");
        t.setStatus(accept ? TeamMember.Status.ACCEPTED : TeamMember.Status.DECLINED);
        t.setRespondedAt(Instant.now());
        if (accept) {
            events.publish("team.member_joined", Map.of("projectId", t.getProjectId(), "memberId", t.getMemberId(),
                    "ownerId", t.getOwnerId()));
        }
        return t;
    }

    @Transactional
    public void removeMember(AuthUser owner, UUID projectId, UUID invitationId) {
        Project p = access.load(projectId);
        if (!p.isAssignedTo(owner.id()) && !owner.isAdmin()) throw ApiException.forbidden("Only the team owner can remove members");
        TeamMember t = team.findById(invitationId).filter(x -> x.getProjectId().equals(projectId))
                .orElseThrow(() -> ApiException.notFound("Team member"));
        t.setStatus(TeamMember.Status.REMOVED);
        events.publish("team.member_removed", Map.of("projectId", projectId, "memberId", t.getMemberId()));
    }

    @Transactional(readOnly = true)
    public List<TeamMember> myInvitations(AuthUser member) {
        return team.findByMemberIdAndStatus(member.id(), TeamMember.Status.INVITED);
    }

    // ------------------------------------------------------------------ payment callbacks (events)

    @Transactional
    public void markFunded(UUID milestoneId) {
        milestones.findById(milestoneId).ifPresent(m -> {
            if (m.getStatus() == Milestone.Status.PENDING) {
                m.setStatus(Milestone.Status.FUNDED);
                m.setFundedAt(Instant.now());
            }
        });
    }

    @Transactional
    public void markPaid(UUID milestoneId) {
        milestones.findById(milestoneId).ifPresent(m -> {
            m.setStatus(Milestone.Status.PAID);
            m.setPaidAt(Instant.now());
        });
    }

    @Transactional
    public void markRefunded(UUID milestoneId) {
        milestones.findById(milestoneId).ifPresent(m -> m.setStatus(Milestone.Status.REFUNDED));
    }

    // ------------------------------------------------------------------ helpers

    Milestone load(UUID milestoneId) {
        return milestones.findById(milestoneId).orElseThrow(() -> ApiException.notFound("Milestone"));
    }

    private static void requireMilestone(Milestone m, Milestone.Status... allowed) {
        for (Milestone.Status s : allowed) {
            if (m.getStatus() == s) return;
        }
        throw ApiException.unprocessable("INVALID_MILESTONE_STATE", "Action not allowed while milestone is " + m.getStatus());
    }

    private static void apply(Milestone m, MilestoneRequest req) {
        m.setTitle(req.title());
        m.setDescription(req.description());
        m.setAmount(req.amount());
        m.setDueDate(req.dueDate());
    }
}
