package com.theunoia.project.service;

import com.theunoia.common.event.EventPublisher;
import com.theunoia.common.exception.ApiException;
import com.theunoia.common.security.AuthUser;
import com.theunoia.common.web.PageResponse;
import com.theunoia.common.web.Pagination;
import com.theunoia.project.client.CreditClient;
import com.theunoia.project.domain.Bid;
import com.theunoia.project.domain.Milestone;
import com.theunoia.project.domain.Project;
import com.theunoia.project.dto.ProjectDtos.BidComparison;
import com.theunoia.project.dto.ProjectDtos.BidRequest;
import com.theunoia.project.dto.ProjectDtos.BidResponse;
import com.theunoia.project.repository.ProjectRepositories.BidRepository;
import com.theunoia.project.repository.ProjectRepositories.MilestoneRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class BidService {

    private final BidRepository bids;
    private final MilestoneRepository milestones;
    private final ProjectAccess access;
    private final CreditClient credits;
    private final EventPublisher events;
    private final TransactionTemplate tx;

    /**
     * Bid submission is a small saga across two services:
     * 1. validate locally, 2. debit credits in credit-service (idempotent key = project + freelancer,
     *    which is unique because a freelancer can bid only once per project),
     * 3. persist the bid + outbox event in one local transaction,
     * compensation: if step 3 fails the credits are refunded with a second idempotent call.
     */
    public BidResponse submit(AuthUser freelancer, UUID projectId, BidRequest req) {
        Project project = access.load(projectId);
        ProjectAccess.requireStatus(project, Project.Status.OPEN);
        if (project.isOwnedBy(freelancer.id())) throw ApiException.forbidden("You cannot bid on your own project");
        if (bids.findByProjectIdAndFreelancerId(projectId, freelancer.id()).isPresent()) {
            throw ApiException.conflict("You have already placed a bid on this project");
        }

        String key = projectId + ":" + freelancer.id();
        int cost = project.getCreditCost();
        if (cost > 0) {
            credits.debit(freelancer.id(), cost, "bid:" + key, "PROJECT:" + projectId, "Bid on project: " + project.getTitle());
        }
        try {
            Bid saved = tx.execute(status -> {
                Project locked = access.loadForUpdate(projectId);
                ProjectAccess.requireStatus(locked, Project.Status.OPEN);
                Bid bid = new Bid();
                bid.setProjectId(projectId);
                bid.setFreelancerId(freelancer.id());
                bid.setAmount(req.amount());
                bid.setDeliveryDays(req.deliveryDays());
                bid.setProposal(req.proposal());
                bid.setCreditsSpent(cost);
                bids.saveAndFlush(bid);
                events.publish("bid.submitted", Map.of("bidId", bid.getId(), "projectId", projectId,
                        "projectTitle", locked.getTitle(), "clientId", locked.getClientId(),
                        "freelancerId", freelancer.id(), "amount", req.amount(), "deliveryDays", req.deliveryDays()));
                return bid;
            });
            return BidResponse.of(saved);
        } catch (RuntimeException e) {
            if (cost > 0) {
                try {
                    credits.refund(freelancer.id(), cost, "bid-refund:" + key, "PROJECT:" + projectId, "Bid could not be placed");
                } catch (RuntimeException refundError) {
                    log.error("Credit compensation failed for bid {} - will need reconciliation", key, refundError);
                }
            }
            throw e;
        }
    }

    @Transactional
    public BidResponse update(AuthUser freelancer, UUID bidId, BidRequest req) {
        Bid bid = loadOwn(freelancer, bidId);
        if (bid.getStatus() != Bid.Status.SUBMITTED) throw ApiException.unprocessable("BID_LOCKED", "Only submitted bids can be edited");
        ProjectAccess.requireStatus(access.load(bid.getProjectId()), Project.Status.OPEN);
        bid.setAmount(req.amount());
        bid.setDeliveryDays(req.deliveryDays());
        bid.setProposal(req.proposal());
        return BidResponse.of(bid);
    }

    /** Withdrawing does not refund credits (they pay for the application itself). */
    @Transactional
    public BidResponse withdraw(AuthUser freelancer, UUID bidId) {
        Bid bid = loadOwn(freelancer, bidId);
        if (!bid.isOpen()) throw ApiException.unprocessable("BID_LOCKED", "This bid can no longer be withdrawn");
        bid.setStatus(Bid.Status.WITHDRAWN);
        return BidResponse.of(bid);
    }

    @Transactional(readOnly = true)
    public PageResponse<BidResponse> mine(AuthUser freelancer, Bid.Status status, int page, int size) {
        var pageable = Pagination.newestFirst(page, size);
        var result = status == null ? bids.findByFreelancerId(freelancer.id(), pageable)
                : bids.findByFreelancerIdAndStatus(freelancer.id(), status, pageable);
        return PageResponse.of(result, BidResponse::of);
    }

    /** Client's "Review Proposals / Compare Bids" view. */
    @Transactional(readOnly = true)
    public BidComparison forProject(AuthUser user, UUID projectId, String sort) {
        Project p = access.load(projectId);
        if (!p.isOwnedBy(user.id()) && !user.isAdmin()) throw ApiException.forbidden("Only the project owner can review bids");
        List<Bid> all = bids.findByProjectId(projectId, Pagination.of(0, 100, Sort.by("createdAt"))).getContent().stream()
                .filter(b -> b.getStatus() != Bid.Status.WITHDRAWN).toList();
        Comparator<Bid> order = switch (sort == null ? "" : sort) {
            case "amount" -> Comparator.comparing(Bid::getAmount);
            case "delivery" -> Comparator.comparingInt(Bid::getDeliveryDays);
            case "shortlisted" -> Comparator.comparing((Bid b) -> b.getStatus() != Bid.Status.SHORTLISTED)
                    .thenComparing(Bid::getCreatedAt);
            default -> Comparator.comparing(Bid::getCreatedAt);
        };
        List<BidResponse> sorted = all.stream().sorted(order).map(BidResponse::of).toList();
        if (all.isEmpty()) return new BidComparison(0, null, null, null, null, List.of());
        BigDecimal sum = all.stream().map(Bid::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new BidComparison(all.size(),
                all.stream().map(Bid::getAmount).min(BigDecimal::compareTo).orElse(null),
                all.stream().map(Bid::getAmount).max(BigDecimal::compareTo).orElse(null),
                sum.divide(BigDecimal.valueOf(all.size()), 2, RoundingMode.HALF_UP),
                all.stream().mapToInt(Bid::getDeliveryDays).min().orElse(0),
                sorted);
    }

    @Transactional
    public BidResponse shortlist(AuthUser client, UUID bidId, boolean shortlisted) {
        Bid bid = bids.findById(bidId).orElseThrow(() -> ApiException.notFound("Bid"));
        Project p = access.requireOwner(bid.getProjectId(), client);
        ProjectAccess.requireStatus(p, Project.Status.OPEN);
        if (!bid.isOpen()) throw ApiException.unprocessable("BID_LOCKED", "Bid is no longer open");
        bid.setStatus(shortlisted ? Bid.Status.SHORTLISTED : Bid.Status.SUBMITTED);
        bid.setShortlistedAt(shortlisted ? Instant.now() : null);
        if (shortlisted) {
            events.publish("bid.shortlisted", Map.of("bidId", bidId, "projectId", p.getId(), "projectTitle", p.getTitle(),
                    "freelancerId", bid.getFreelancerId(), "clientId", p.getClientId()));
        }
        return BidResponse.of(bid);
    }

    /**
     * Award: accept one bid, reject the rest, move the project to IN_PROGRESS and create a
     * default milestone for the full bid amount (client can split it into more milestones).
     */
    @Transactional
    public BidResponse award(AuthUser client, UUID bidId) {
        Bid bid = bids.findById(bidId).orElseThrow(() -> ApiException.notFound("Bid"));
        Project p = access.requireOwner(bid.getProjectId(), client);
        ProjectAccess.requireStatus(p, Project.Status.OPEN);
        if (!bid.isOpen()) throw ApiException.unprocessable("BID_LOCKED", "Bid is no longer open");

        bid.setStatus(Bid.Status.ACCEPTED);
        bids.rejectOthers(p.getId(), bid.getId());
        p.setStatus(Project.Status.IN_PROGRESS);
        p.setFreelancerId(bid.getFreelancerId());
        p.setAwardedBidId(bid.getId());
        p.setAwardedAt(Instant.now());

        LocalDate due = LocalDate.now().plusDays(bid.getDeliveryDays());
        Milestone m = new Milestone();
        m.setProjectId(p.getId());
        m.setTitle("Complete project delivery");
        m.setDescription("Default milestone created from the accepted proposal");
        m.setAmount(bid.getAmount());
        m.setDueDate(p.getDeadline() != null && p.getDeadline().isBefore(due) ? p.getDeadline() : due);
        m.setPosition(1);
        milestones.save(m);

        Map<String, Object> data = new HashMap<>();
        data.put("projectId", p.getId());
        data.put("projectTitle", p.getTitle());
        data.put("clientId", p.getClientId());
        data.put("freelancerId", bid.getFreelancerId());
        data.put("bidId", bid.getId());
        data.put("amount", bid.getAmount());
        data.put("paymentMode", p.getPaymentMode().name());
        data.put("deadline", m.getDueDate().toString());
        events.publish("project.awarded", data);
        events.publish("milestone.created", milestoneEvent(p, m));
        return BidResponse.of(bid);
    }

    static Map<String, Object> milestoneEvent(Project p, Milestone m) {
        Map<String, Object> data = new HashMap<>();
        data.put("milestoneId", m.getId());
        data.put("projectId", p.getId());
        data.put("projectTitle", p.getTitle());
        data.put("clientId", p.getClientId());
        data.put("freelancerId", p.getFreelancerId());
        data.put("title", m.getTitle());
        data.put("amount", m.getAmount());
        data.put("paymentMode", p.getPaymentMode().name());
        if (m.getDueDate() != null) data.put("dueDate", m.getDueDate().toString());
        return data;
    }

    private Bid loadOwn(AuthUser freelancer, UUID bidId) {
        Bid bid = bids.findById(bidId).orElseThrow(() -> ApiException.notFound("Bid"));
        if (!bid.getFreelancerId().equals(freelancer.id())) throw ApiException.forbidden("Not your bid");
        return bid;
    }
}
