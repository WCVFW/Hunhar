package com.theunoia.project.service;

import com.theunoia.common.exception.BadRequestException;
import com.theunoia.common.exception.ForbiddenException;
import com.theunoia.common.exception.ResourceNotFoundException;
import com.theunoia.common.internal.InternalClient;
import com.theunoia.common.internal.NotificationPublisher;
import com.theunoia.common.security.AuthUser;
import com.theunoia.project.domain.Bid;
import com.theunoia.project.domain.BidStatus;
import com.theunoia.project.domain.Project;
import com.theunoia.project.domain.ProjectStatus;
import com.theunoia.project.dto.SubmitBidDto;
import com.theunoia.project.repository.BidRepository;
import com.theunoia.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class BidService {

    private final BidRepository bidRepository;
    private final ProjectRepository projectRepository;
    private final CreditClient creditClient;
    private final ProjectAccessService access;
    private final ProjectViewEnricher enricher;
    private final NotificationPublisher notifications;
    private final InternalClient internalClient;
    private final com.theunoia.common.internal.PlatformSettingsClient settings;

    @Transactional
    public Bid submitBid(AuthUser freelancer, UUID projectId, SubmitBidDto dto) {
        if (!freelancer.hasRole("FREELANCER")) {
            throw new ForbiddenException("Only freelancers can submit proposals");
        }
        UUID freelancerId = freelancer.id();
        Project project = access.load(projectId);

        if (project.getStatus() != ProjectStatus.OPEN) {
            throw new BadRequestException("This project is no longer accepting proposals");
        }
        if (project.getClientId().equals(freelancerId)) {
            throw new BadRequestException("You cannot bid on your own project");
        }
        bidRepository.findByProjectIdAndFreelancerId(projectId, freelancerId).ifPresent(existing -> {
            if (existing.getStatus() != BidStatus.WITHDRAWN) {
                throw new BadRequestException("You have already submitted a proposal for this project");
            }
        });

        if (!creditClient.consumeCreditsForBid(freelancerId, projectId)) {
            throw new BadRequestException("Not enough credits. Each proposal costs " + settings.getInt("creditsPerBid", 2)
                    + " credits — please top up on the Credits page.");
        }

        // Re-submitting after a withdrawal reuses the same row (one bid per freelancer per project)
        Bid bid = bidRepository.findByProjectIdAndFreelancerId(projectId, freelancerId).orElseGet(Bid::new);
        bid.setProjectId(projectId);
        bid.setFreelancerId(freelancerId);
        bid.setProposedCost(dto.getProposedCost());
        bid.setDeliveryTimelineDays(dto.getDeliveryTimelineDays());
        bid.setProposalMessage(dto.getProposalMessage().trim());
        bid.setAttachmentUrls(dto.getAttachmentUrls() == null ? null : String.join(",", dto.getAttachmentUrls()));
        bid.setStatus(BidStatus.SUBMITTED);
        bid.setShortlisted(false);
        bid = bidRepository.save(bid);

        project.setBidCount(project.getBidCount() + 1);
        projectRepository.save(project);

        notifications.notify(project.getClientId(), "BID_RECEIVED",
                "New proposal received",
                "A freelancer sent a proposal of ₹" + dto.getProposedCost().toPlainString() + " for \"" + project.getTitle() + "\".",
                "/client/projects");
        return enricher.bids(List.of(bid)).get(0);
    }

    @Transactional
    public Bid withdrawBid(UUID bidId, AuthUser user) {
        Bid bid = bidRepository.findById(bidId)
                .orElseThrow(() -> new ResourceNotFoundException("Proposal not found"));
        if (!bid.getFreelancerId().equals(user.id())) {
            throw new ForbiddenException("You can only withdraw your own proposals");
        }
        if (bid.getStatus() != BidStatus.SUBMITTED && bid.getStatus() != BidStatus.SHORTLISTED) {
            throw new BadRequestException("This proposal can no longer be withdrawn");
        }
        bid.setStatus(BidStatus.WITHDRAWN);
        bidRepository.save(bid);

        projectRepository.findById(bid.getProjectId()).ifPresent(p -> {
            p.setBidCount(Math.max(0, p.getBidCount() - 1));
            projectRepository.save(p);
        });
        return enricher.bids(List.of(bid)).get(0);
    }

    /** Only the client who owns the project (or an admin) may read its proposals. */
    @Transactional(readOnly = true)
    public List<Bid> getBidsForProject(UUID projectId, AuthUser user) {
        access.requireClient(projectId, user);
        return enricher.bids(bidRepository.findByProjectIdOrderByCreatedAtDesc(projectId));
    }

    /** Latest proposals across all of the client's projects (dashboard). */
    @Transactional(readOnly = true)
    public List<Bid> getRecentBidsForClient(UUID clientId) {
        List<UUID> projectIds = projectRepository.findByClientId(clientId).stream().map(Project::getId).toList();
        if (projectIds.isEmpty()) return List.of();
        return enricher.bids(bidRepository.findTop20ByProjectIdInOrderByCreatedAtDesc(projectIds));
    }

    @Transactional
    public Bid rejectBid(UUID bidId, AuthUser user) {
        Bid bid = bidRepository.findById(bidId)
                .orElseThrow(() -> new ResourceNotFoundException("Bid not found"));
        Project project = access.requireClient(bid.getProjectId(), user);
        if (bid.getStatus() != BidStatus.SUBMITTED && bid.getStatus() != BidStatus.SHORTLISTED) {
            throw new BadRequestException("This proposal can no longer be declined");
        }
        bid.setStatus(BidStatus.REJECTED);
        bidRepository.save(bid);
        notifications.notify(bid.getFreelancerId(), "BID_REJECTED", "Proposal not selected",
                "The client declined your proposal for \"" + project.getTitle() + "\".", "/freelancer/bids");
        return enricher.bids(List.of(bid)).get(0);
    }

    @Transactional(readOnly = true)
    public List<Bid> getBidsForFreelancer(UUID freelancerId) {
        return enricher.bids(bidRepository.findByFreelancerIdOrderByCreatedAtDesc(freelancerId));
    }

    @Transactional
    public Bid toggleShortlist(UUID bidId, boolean shortlist, AuthUser user) {
        Bid bid = bidRepository.findById(bidId)
                .orElseThrow(() -> new ResourceNotFoundException("Bid not found"));
        Project project = access.requireClient(bid.getProjectId(), user);

        bid.setShortlisted(shortlist);
        if (shortlist && bid.getStatus() == BidStatus.SUBMITTED) {
            bid.setStatus(BidStatus.SHORTLISTED);
            notifications.notify(bid.getFreelancerId(), "BID_SHORTLISTED",
                    "You've been shortlisted ⭐",
                    "Your proposal for \"" + project.getTitle() + "\" was shortlisted by the client.",
                    "/freelancer/bids");
        } else if (!shortlist && bid.getStatus() == BidStatus.SHORTLISTED) {
            bid.setStatus(BidStatus.SUBMITTED);
        }
        return enricher.bids(List.of(bidRepository.save(bid))).get(0);
    }

    @Transactional
    public Project awardBid(UUID clientId, UUID bidId) {
        Bid bid = bidRepository.findById(bidId)
                .orElseThrow(() -> new ResourceNotFoundException("Bid not found"));

        Project project = projectRepository.findById(bid.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        if (!project.getClientId().equals(clientId)) {
            throw new ForbiddenException("Only the project owner can award this bid");
        }
        if (project.getStatus() != ProjectStatus.OPEN) {
            throw new BadRequestException("Project is already " + project.getStatus());
        }
        if (bid.getStatus() == BidStatus.WITHDRAWN) {
            throw new BadRequestException("This proposal was withdrawn by the freelancer");
        }

        bid.setStatus(BidStatus.AWARDED);
        bidRepository.save(bid);

        for (Bid b : bidRepository.findByProjectId(project.getId())) {
            if (!b.getId().equals(bid.getId()) && b.getStatus() != BidStatus.WITHDRAWN) {
                b.setStatus(BidStatus.REJECTED);
                bidRepository.save(b);
                notifications.notify(b.getFreelancerId(), "BID_REJECTED",
                        "Proposal not selected",
                        "The client chose another freelancer for \"" + project.getTitle() + "\". Keep bidding!",
                        "/freelancer/bids");
            }
        }

        project.setAwardedFreelancerId(bid.getFreelancerId());
        project.setStatus(ProjectStatus.ACTIVE);
        project.setStartDate(Instant.now());
        Project saved = projectRepository.save(project);

        notifications.notify(bid.getFreelancerId(), "PROJECT_AWARDED",
                "You won the project! 🎉",
                "Your proposal for \"" + project.getTitle() + "\" was accepted. The workspace is ready.",
                "/freelancer/projects/" + project.getId());
        openConversation(clientId, bid.getFreelancerId(), project.getId());
        return saved;
    }

    private void openConversation(UUID clientId, UUID freelancerId, UUID projectId) {
        CompletableFuture.runAsync(() -> {
            try {
                internalClient.post(internalClient.engagement() + "/internal/conversations",
                        Map.of("participant1Id", clientId.toString(),
                                "participant2Id", freelancerId.toString(),
                                "projectId", projectId.toString()),
                        new ParameterizedTypeReference<Map<String, Object>>() {});
            } catch (Exception e) {
                log.warn("Could not open project conversation for {}: {}", projectId, e.getMessage());
            }
        });
    }
}
