package com.theunoia.project.service;

import com.theunoia.common.event.EventPublisher;
import com.theunoia.common.exception.ApiException;
import com.theunoia.common.security.AuthUser;
import com.theunoia.common.web.PageResponse;
import com.theunoia.common.web.Pagination;
import com.theunoia.project.config.ProjectProperties;
import com.theunoia.project.domain.Bid;
import com.theunoia.project.domain.Milestone;
import com.theunoia.project.domain.Project;
import com.theunoia.project.domain.ProjectAttachment;
import com.theunoia.project.dto.ProjectDtos.AttachmentRequest;
import com.theunoia.project.dto.ProjectDtos.ProjectRequest;
import com.theunoia.project.dto.ProjectDtos.ProjectResponse;
import com.theunoia.project.dto.ProjectDtos.ProjectSummary;
import com.theunoia.project.repository.ProjectRepositories.AttachmentRepository;
import com.theunoia.project.repository.ProjectRepositories.BidRepository;
import com.theunoia.project.repository.ProjectRepositories.CategoryRepository;
import com.theunoia.project.repository.ProjectRepositories.MilestoneRepository;
import com.theunoia.project.repository.ProjectRepositories.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projects;
    private final AttachmentRepository attachments;
    private final CategoryRepository categories;
    private final BidRepository bids;
    private final MilestoneRepository milestones;
    private final ProjectAccess access;
    private final ProjectSearchRepository search;
    private final EventPublisher events;
    private final ProjectProperties props;

    @Transactional
    public ProjectResponse create(AuthUser client, ProjectRequest req) {
        validate(req);
        Project p = new Project();
        p.setClientId(client.id());
        apply(p, req);
        p.setCreditCost(creditCostFor(req.budgetMax()));
        projects.save(p);
        if (req.attachments() != null) req.attachments().forEach(a -> addAttachment(p.getId(), client.id(), a));
        if (req.publish()) publish(p);
        return view(p, client);
    }

    @Transactional
    public ProjectResponse update(AuthUser user, UUID projectId, ProjectRequest req) {
        Project p = access.requireOwner(projectId, user);
        ProjectAccess.requireStatus(p, Project.Status.DRAFT, Project.Status.OPEN);
        validate(req);
        if (p.getStatus() == Project.Status.OPEN && p.getBidCount() > 0
                && (req.budgetMax().compareTo(p.getBudgetMax()) != 0 || req.paymentMode() != null && req.paymentMode() != p.getPaymentMode())) {
            throw ApiException.unprocessable("BIDS_EXIST", "Budget and payment mode cannot change after bids were received");
        }
        apply(p, req);
        if (req.publish() && p.getStatus() == Project.Status.DRAFT) publish(p);
        return view(p, user);
    }

    @Transactional
    public ProjectResponse publish(AuthUser user, UUID projectId) {
        Project p = access.requireOwner(projectId, user);
        ProjectAccess.requireStatus(p, Project.Status.DRAFT);
        publish(p);
        return view(p, user);
    }

    private void publish(Project p) {
        p.setStatus(Project.Status.OPEN);
        p.setPublishedAt(Instant.now());
        Map<String, Object> data = new HashMap<>();
        data.put("projectId", p.getId());
        data.put("clientId", p.getClientId());
        data.put("title", p.getTitle());
        data.put("skills", List.copyOf(p.getSkills()));
        data.put("budgetMin", p.getBudgetMin());
        data.put("budgetMax", p.getBudgetMax());
        data.put("paymentMode", p.getPaymentMode().name());
        if (p.getCategoryId() != null) data.put("categoryId", p.getCategoryId());
        events.publish("project.published", data);
    }

    /**
     * Cancelling an open project refunds the credits of every active bidder (asynchronously via
     * credit-service). An in-progress project can only be cancelled when no money is in escrow.
     */
    @Transactional
    public ProjectResponse cancel(AuthUser user, UUID projectId, String reason) {
        Project p = access.requireOwner(projectId, user);
        ProjectAccess.requireStatus(p, Project.Status.DRAFT, Project.Status.OPEN, Project.Status.IN_PROGRESS);
        if (p.getStatus() == Project.Status.IN_PROGRESS) {
            boolean moneyInFlight = milestones.findByProjectIdOrderByPositionAsc(projectId).stream()
                    .anyMatch(m -> EnumSet.of(Milestone.Status.FUNDED, Milestone.Status.SUBMITTED,
                            Milestone.Status.REVISION_REQUESTED).contains(m.getStatus()));
            if (moneyInFlight) {
                throw ApiException.unprocessable("FUNDS_IN_ESCROW", "Funded milestones exist - raise a dispute to cancel this project");
            }
            milestones.findByProjectIdOrderByPositionAsc(projectId).stream()
                    .filter(m -> m.getStatus() == Milestone.Status.PENDING)
                    .forEach(m -> m.setStatus(Milestone.Status.CANCELLED));
        }
        if (p.getStatus() == Project.Status.OPEN) {
            for (Bid b : bids.findByProjectIdAndStatusIn(projectId, EnumSet.of(Bid.Status.SUBMITTED, Bid.Status.SHORTLISTED))) {
                b.setStatus(Bid.Status.REJECTED);
                if (b.getCreditsSpent() > 0) {
                    events.publish("bid.refund_requested", Map.of("bidId", b.getId(), "freelancerId", b.getFreelancerId(),
                            "credits", b.getCreditsSpent(), "projectId", projectId, "reason", "Project cancelled by client"));
                }
            }
        }
        Project.Status previous = p.getStatus();
        p.setStatus(Project.Status.CANCELLED);
        p.setCancelledAt(Instant.now());
        p.setCancelReason(reason);
        Map<String, Object> data = new HashMap<>();
        data.put("projectId", p.getId());
        data.put("clientId", p.getClientId());
        data.put("previousStatus", previous.name());
        data.put("title", p.getTitle());
        if (p.getFreelancerId() != null) data.put("freelancerId", p.getFreelancerId());
        events.publish("project.cancelled", data);
        return view(p, user);
    }

    @Transactional(readOnly = true)
    public ProjectResponse get(UUID projectId, AuthUser viewer) {
        Project p = access.load(projectId);
        boolean visible = p.getStatus() != Project.Status.DRAFT
                || (viewer != null && (p.isOwnedBy(viewer.id()) || viewer.isAdmin()));
        if (!visible) throw ApiException.notFound("Project");
        return view(p, viewer);
    }

    @Transactional(readOnly = true)
    public PageResponse<ProjectSummary> browse(ProjectSearchRepository.Criteria criteria) {
        return search.search(criteria);
    }

    /** Client: own projects (Open / Active / Completed / Cancelled tabs). Freelancer: assigned projects. */
    @Transactional(readOnly = true)
    public PageResponse<ProjectResponse> mine(AuthUser user, Project.Status status, int page, int size) {
        Pageable pageable = Pagination.newestFirst(page, size);
        Page<Project> result;
        if (user.isClient()) {
            result = status == null ? projects.findByClientId(user.id(), pageable)
                    : projects.findByClientIdAndStatusIn(user.id(), List.of(status), pageable);
        } else {
            result = status == null ? projects.findByFreelancerId(user.id(), pageable)
                    : projects.findByFreelancerIdAndStatusIn(user.id(), List.of(status), pageable);
        }
        return PageResponse.of(result, p -> view(p, user));
    }

    @Transactional
    public Map<String, Object> addAttachment(AuthUser user, UUID projectId, AttachmentRequest req) {
        Project p = access.requireOwner(projectId, user);
        ProjectAccess.requireStatus(p, Project.Status.DRAFT, Project.Status.OPEN, Project.Status.IN_PROGRESS);
        return toMap(addAttachment(projectId, user.id(), req));
    }

    private ProjectAttachment addAttachment(UUID projectId, UUID uploader, AttachmentRequest req) {
        ProjectAttachment a = new ProjectAttachment();
        a.setProjectId(projectId);
        a.setFileId(req.fileId());
        a.setFileName(req.fileName());
        a.setUrl(req.url());
        a.setUploadedBy(uploader);
        return attachments.save(a);
    }

    // ------------------------------------------------------------------ dashboards

    @Transactional(readOnly = true)
    public Map<String, Object> freelancerDashboard(UUID freelancerId) {
        Map<String, Object> d = new LinkedHashMap<>();
        d.put("activeProjects", projects.countByFreelancerIdAndStatus(freelancerId, Project.Status.IN_PROGRESS));
        d.put("completedProjects", projects.countByFreelancerIdAndStatus(freelancerId, Project.Status.COMPLETED));
        d.put("pendingBids", bids.countByFreelancerIdAndStatusIn(freelancerId, EnumSet.of(Bid.Status.SUBMITTED, Bid.Status.SHORTLISTED)));
        d.put("shortlistedBids", bids.countByFreelancerIdAndStatusIn(freelancerId, EnumSet.of(Bid.Status.SHORTLISTED)));
        d.put("teamProjects", projects.findTeamProjectIds(freelancerId).size());
        d.put("upcomingDeadlines", milestones.upcomingForFreelancer(freelancerId, LocalDate.now().plusDays(14)).stream()
                .limit(10).map(m -> Map.of("milestoneId", m.getId(), "projectId", m.getProjectId(), "title", m.getTitle(),
                        "dueDate", m.getDueDate(), "status", m.getStatus().name())).toList());
        return d;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> clientDashboard(UUID clientId) {
        Map<String, Object> d = new LinkedHashMap<>();
        for (Project.Status s : Project.Status.values()) {
            d.put(s.name().toLowerCase() + "Projects", projects.countByClientIdAndStatus(clientId, s));
        }
        d.put("openBidsToReview", bids.countOpenBidsForClient(clientId));
        d.put("milestonesAwaitingReview", milestones.awaitingClientReview(clientId).stream().limit(10)
                .map(m -> Map.of("milestoneId", m.getId(), "projectId", m.getProjectId(), "title", m.getTitle(),
                        "amount", m.getAmount())).toList());
        return d;
    }

    // ------------------------------------------------------------------ admin

    @Transactional(readOnly = true)
    public PageResponse<ProjectResponse> adminSearch(Project.Status status, UUID clientId, int page, int size) {
        return PageResponse.of(projects.adminSearch(status, clientId, Pagination.newestFirst(page, size)), p -> view(p, null));
    }

    @Transactional
    public ProjectResponse adminChangeStatus(AuthUser admin, UUID projectId, Project.Status status, String reason) {
        Project p = access.loadForUpdate(projectId);
        Project.Status previous = p.getStatus();
        p.setStatus(status);
        if (status == Project.Status.CANCELLED) {
            p.setCancelledAt(Instant.now());
            p.setCancelReason(reason);
        }
        events.publish("project.status_changed_by_admin", Map.of("projectId", projectId, "adminId", admin.id(),
                "from", previous.name(), "to", status.name(), "reason", reason == null ? "" : reason));
        return view(p, admin);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> platformStats() {
        Map<String, Object> s = new LinkedHashMap<>();
        long total = 0;
        for (Project.Status status : Project.Status.values()) {
            long c = projects.countByStatus(status);
            total += c;
            s.put(status.name().toLowerCase(), c);
        }
        s.put("total", total);
        s.put("totalBids", bids.count());
        return s;
    }

    // ------------------------------------------------------------------ helpers

    ProjectResponse view(Project p, AuthUser viewer) {
        List<Map<String, Object>> files = attachments.findByProjectIdOrderByCreatedAtAsc(p.getId()).stream()
                .map(ProjectService::toMap).toList();
        Map<String, Object> myBid = null;
        if (viewer != null && viewer.isFreelancer()) {
            myBid = bids.findByProjectIdAndFreelancerId(p.getId(), viewer.id())
                    .map(b -> Map.<String, Object>of("bidId", b.getId(), "status", b.getStatus().name(), "amount", b.getAmount()))
                    .orElse(null);
        }
        return ProjectResponse.of(p, files, myBid);
    }

    private static Map<String, Object> toMap(ProjectAttachment a) {
        return Map.of("id", a.getId(), "fileId", a.getFileId(), "fileName", a.getFileName(), "url", a.getUrl());
    }

    private void validate(ProjectRequest req) {
        if (req.budgetMax().compareTo(req.budgetMin()) < 0) throw ApiException.badRequest("budgetMax must be >= budgetMin");
        if (req.deadline() != null && req.deadline().isBefore(LocalDate.now())) throw ApiException.badRequest("Deadline must be in the future");
        if (req.categoryId() != null && !categories.existsById(req.categoryId())) throw ApiException.badRequest("Unknown category");
    }

    private void apply(Project p, ProjectRequest req) {
        p.setTitle(req.title().trim());
        p.setDescription(req.description());
        p.setCategoryId(req.categoryId());
        p.setBudgetType(req.budgetType());
        p.setBudgetMin(req.budgetMin());
        p.setBudgetMax(req.budgetMax());
        p.setDeadline(req.deadline());
        if (req.paymentMode() != null) p.setPaymentMode(req.paymentMode());
        p.getSkills().clear();
        p.getSkills().addAll(new LinkedHashSet<>(req.skills().stream().map(String::trim).toList()));
    }

    /** Credits needed to bid scale with the project's budget (configurable tiers). */
    int creditCostFor(BigDecimal budgetMax) {
        for (ProjectProperties.CreditTier tier : props.getCreditTiers()) {
            if (budgetMax.compareTo(tier.getUpTo()) <= 0) return tier.getCredits();
        }
        return props.getMaxCreditCost();
    }
}
