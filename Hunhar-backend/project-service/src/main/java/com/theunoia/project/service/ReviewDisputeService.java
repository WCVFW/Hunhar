package com.theunoia.project.service;

import com.theunoia.common.event.EventPublisher;
import com.theunoia.common.exception.ApiException;
import com.theunoia.common.security.AuthUser;
import com.theunoia.common.web.PageResponse;
import com.theunoia.common.web.Pagination;
import com.theunoia.project.domain.Dispute;
import com.theunoia.project.domain.Milestone;
import com.theunoia.project.domain.Project;
import com.theunoia.project.domain.Review;
import com.theunoia.project.dto.ProjectDtos.DisputeRequest;
import com.theunoia.project.dto.ProjectDtos.DisputeResolution;
import com.theunoia.project.dto.ProjectDtos.ReviewRequest;
import com.theunoia.project.repository.ProjectRepositories.DisputeRepository;
import com.theunoia.project.repository.ProjectRepositories.MilestoneRepository;
import com.theunoia.project.repository.ProjectRepositories.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReviewDisputeService {

    private final ReviewRepository reviews;
    private final DisputeRepository disputes;
    private final MilestoneRepository milestones;
    private final ProjectAccess access;
    private final EventPublisher events;

    // ------------------------------------------------------------------ reviews (two-way)

    @Transactional
    public Review review(AuthUser user, UUID projectId, ReviewRequest req) {
        Project p = access.load(projectId);
        ProjectAccess.requireStatus(p, Project.Status.COMPLETED);
        UUID reviewee;
        String role;
        if (p.isOwnedBy(user.id())) {
            reviewee = p.getFreelancerId();
            role = "CLIENT";
        } else if (p.isAssignedTo(user.id())) {
            reviewee = p.getClientId();
            role = "FREELANCER";
        } else {
            throw ApiException.forbidden("Only the client and the hired freelancer can review this project");
        }
        if (reviews.existsByProjectIdAndReviewerId(projectId, user.id())) throw ApiException.conflict("You already reviewed this project");
        Review r = new Review();
        r.setProjectId(projectId);
        r.setReviewerId(user.id());
        r.setRevieweeId(reviewee);
        r.setReviewerRole(role);
        r.setRating((short) req.rating());
        r.setComment(req.comment());
        reviews.save(r);
        events.publish("review.created", Map.of("reviewId", r.getId(), "projectId", projectId, "reviewerId", user.id(),
                "revieweeId", reviewee, "revieweeRole", role.equals("CLIENT") ? "FREELANCER" : "CLIENT",
                "rating", req.rating()));
        return r;
    }

    @Transactional(readOnly = true)
    public PageResponse<Review> reviewsFor(UUID userId, int page, int size) {
        return PageResponse.of(reviews.findByRevieweeId(userId, Pagination.newestFirst(page, size)), r -> r);
    }

    @Transactional(readOnly = true)
    public List<Review> reviewsForProject(UUID projectId) {
        return reviews.findByProjectId(projectId);
    }

    // ------------------------------------------------------------------ disputes

    @Transactional
    public Dispute raise(AuthUser user, UUID projectId, DisputeRequest req) {
        Project p = access.loadForUpdate(projectId);
        if (!p.isOwnedBy(user.id()) && !p.isAssignedTo(user.id())) {
            throw ApiException.forbidden("Only the client or hired freelancer can raise a dispute");
        }
        ProjectAccess.requireStatus(p, Project.Status.IN_PROGRESS);
        if (disputes.existsByProjectIdAndStatusNot(projectId, Dispute.Status.RESOLVED)) {
            throw ApiException.conflict("A dispute is already open for this project");
        }
        if (req.milestoneId() != null) {
            Milestone m = milestones.findById(req.milestoneId()).filter(x -> x.getProjectId().equals(projectId))
                    .orElseThrow(() -> ApiException.notFound("Milestone"));
            if (Milestone.SETTLED.contains(m.getStatus())) throw ApiException.unprocessable("MILESTONE_SETTLED", "Milestone already settled");
        }
        Dispute d = new Dispute();
        d.setProjectId(projectId);
        d.setMilestoneId(req.milestoneId());
        d.setRaisedBy(user.id());
        d.setReason(req.reason());
        d.setDescription(req.description());
        disputes.save(d);
        p.setStatus(Project.Status.DISPUTED);
        events.publish("dispute.raised", Map.of("disputeId", d.getId(), "projectId", projectId, "projectTitle", p.getTitle(),
                "raisedBy", user.id(), "clientId", p.getClientId(), "freelancerId", p.getFreelancerId(), "reason", req.reason()));
        return d;
    }

    @Transactional(readOnly = true)
    public List<Dispute> forProject(AuthUser user, UUID projectId) {
        access.requireParticipant(projectId, user);
        return disputes.findByProjectIdOrderByCreatedAtDesc(projectId);
    }

    @Transactional(readOnly = true)
    public PageResponse<Dispute> adminList(Dispute.Status status, int page, int size) {
        var pageable = Pagination.newestFirst(page, size);
        return PageResponse.of(status == null ? disputes.findAll(pageable) : disputes.findByStatus(status, pageable), d -> d);
    }

    @Transactional
    public Dispute markUnderReview(UUID disputeId) {
        Dispute d = disputes.findById(disputeId).orElseThrow(() -> ApiException.notFound("Dispute"));
        if (d.getStatus() == Dispute.Status.OPEN) d.setStatus(Dispute.Status.UNDER_REVIEW);
        return d;
    }

    /**
     * Admin resolution. Money movements for the disputed milestone are executed by
     * payment-service when it consumes dispute.resolved (refund / release / split).
     */
    @Transactional
    public Dispute resolve(AuthUser admin, UUID disputeId, DisputeResolution req) {
        Dispute d = disputes.findById(disputeId).orElseThrow(() -> ApiException.notFound("Dispute"));
        if (d.getStatus() == Dispute.Status.RESOLVED) throw ApiException.conflict("Dispute already resolved");
        if (req.resolution() == Dispute.Resolution.SPLIT && req.freelancerSharePercent() == null) {
            throw ApiException.badRequest("freelancerSharePercent is required for SPLIT");
        }
        Project p = access.loadForUpdate(d.getProjectId());
        d.setStatus(Dispute.Status.RESOLVED);
        d.setResolution(req.resolution());
        d.setFreelancerSharePercent(req.freelancerSharePercent());
        d.setResolutionNote(req.note());
        d.setResolvedBy(admin.id());
        d.setResolvedAt(Instant.now());

        Project.Status after = req.projectStatusAfter() == null ? Project.Status.IN_PROGRESS : req.projectStatusAfter();
        p.setStatus(after);
        if (after == Project.Status.CANCELLED) p.setCancelledAt(Instant.now());
        if (after == Project.Status.COMPLETED) p.setCompletedAt(Instant.now());

        if (d.getMilestoneId() != null && req.resolution() == Dispute.Resolution.RELEASE_TO_FREELANCER) {
            milestones.findById(d.getMilestoneId()).ifPresent(m -> {
                m.setStatus(Milestone.Status.APPROVED);
                m.setApprovedAt(Instant.now());
            });
        }

        Map<String, Object> data = new HashMap<>();
        data.put("disputeId", d.getId());
        data.put("projectId", p.getId());
        data.put("projectTitle", p.getTitle());
        data.put("clientId", p.getClientId());
        data.put("freelancerId", p.getFreelancerId());
        data.put("resolution", req.resolution().name());
        data.put("projectStatus", after.name());
        if (d.getMilestoneId() != null) data.put("milestoneId", d.getMilestoneId());
        if (req.freelancerSharePercent() != null) data.put("freelancerSharePercent", req.freelancerSharePercent());
        events.publish("dispute.resolved", data);
        if (after == Project.Status.CANCELLED && p.getFreelancerId() != null) {
            events.publish("project.cancelled", Map.of("projectId", p.getId(), "clientId", p.getClientId(),
                    "freelancerId", p.getFreelancerId(), "previousStatus", "DISPUTED", "title", p.getTitle()));
        }
        return d;
    }
}
