package com.theunoia.project.web;

import com.theunoia.common.security.CurrentUser;
import com.theunoia.common.web.PageResponse;
import com.theunoia.project.domain.Bid;
import com.theunoia.project.domain.Review;
import com.theunoia.project.domain.TeamMember;
import com.theunoia.project.dto.ProjectDtos.BidRequest;
import com.theunoia.project.dto.ProjectDtos.BidResponse;
import com.theunoia.project.dto.ProjectDtos.MilestoneRequest;
import com.theunoia.project.dto.ProjectDtos.MilestoneResponse;
import com.theunoia.project.dto.ProjectDtos.ReviewDecisionRequest;
import com.theunoia.project.dto.ProjectDtos.SubmitWorkRequest;
import com.theunoia.project.service.BidService;
import com.theunoia.project.service.ReviewDisputeService;
import com.theunoia.project.service.WorkspaceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class BidMilestoneController {

    private final BidService bids;
    private final WorkspaceService workspace;
    private final ReviewDisputeService reviewDisputes;

    // ------------------------------------------------------------------ bids

    @GetMapping("/bids/mine")
    @PreAuthorize("hasRole('FREELANCER')")
    public PageResponse<BidResponse> myBids(@RequestParam(required = false) Bid.Status status,
                                            @RequestParam(defaultValue = "0") int page,
                                            @RequestParam(defaultValue = "20") int size) {
        return bids.mine(CurrentUser.require(), status, page, size);
    }

    @PutMapping("/bids/{bidId}")
    @PreAuthorize("hasRole('FREELANCER')")
    public BidResponse updateBid(@PathVariable UUID bidId, @Valid @RequestBody BidRequest req) {
        return bids.update(CurrentUser.require(), bidId, req);
    }

    @PostMapping("/bids/{bidId}/withdraw")
    @PreAuthorize("hasRole('FREELANCER')")
    public BidResponse withdraw(@PathVariable UUID bidId) {
        return bids.withdraw(CurrentUser.require(), bidId);
    }

    @PostMapping("/bids/{bidId}/shortlist")
    @PreAuthorize("hasRole('CLIENT')")
    public BidResponse shortlist(@PathVariable UUID bidId) {
        return bids.shortlist(CurrentUser.require(), bidId, true);
    }

    @DeleteMapping("/bids/{bidId}/shortlist")
    @PreAuthorize("hasRole('CLIENT')")
    public BidResponse unshortlist(@PathVariable UUID bidId) {
        return bids.shortlist(CurrentUser.require(), bidId, false);
    }

    @PostMapping("/bids/{bidId}/award")
    @PreAuthorize("hasRole('CLIENT') and hasAuthority('STATUS_ACTIVE')")
    public BidResponse award(@PathVariable UUID bidId) {
        return bids.award(CurrentUser.require(), bidId);
    }

    // ------------------------------------------------------------------ milestones

    @PutMapping("/milestones/{milestoneId}")
    @PreAuthorize("hasRole('CLIENT')")
    public MilestoneResponse updateMilestone(@PathVariable UUID milestoneId, @Valid @RequestBody MilestoneRequest req) {
        return workspace.updateMilestone(CurrentUser.require(), milestoneId, req);
    }

    @DeleteMapping("/milestones/{milestoneId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('CLIENT')")
    public void cancelMilestone(@PathVariable UUID milestoneId) {
        workspace.cancelMilestone(CurrentUser.require(), milestoneId);
    }

    @PostMapping("/milestones/{milestoneId}/submit")
    @PreAuthorize("hasRole('FREELANCER')")
    public MilestoneResponse submit(@PathVariable UUID milestoneId, @Valid @RequestBody SubmitWorkRequest req) {
        return workspace.submitWork(CurrentUser.require(), milestoneId, req);
    }

    @PostMapping("/milestones/{milestoneId}/approve")
    @PreAuthorize("hasRole('CLIENT')")
    public MilestoneResponse approve(@PathVariable UUID milestoneId, @Valid @RequestBody(required = false) ReviewDecisionRequest req) {
        return workspace.approve(CurrentUser.require(), milestoneId, req == null ? null : req.note());
    }

    @PostMapping("/milestones/{milestoneId}/request-revision")
    @PreAuthorize("hasRole('CLIENT')")
    public MilestoneResponse revision(@PathVariable UUID milestoneId, @Valid @RequestBody ReviewDecisionRequest req) {
        return workspace.requestRevision(CurrentUser.require(), milestoneId, req.note());
    }

    // ------------------------------------------------------------------ collaboration invitations

    @GetMapping("/team-invitations")
    @PreAuthorize("hasRole('FREELANCER')")
    public List<TeamMember> invitations() {
        return workspace.myInvitations(CurrentUser.require());
    }

    @PostMapping("/team-invitations/{id}/accept")
    @PreAuthorize("hasRole('FREELANCER')")
    public TeamMember accept(@PathVariable UUID id) {
        return workspace.respond(CurrentUser.require(), id, true);
    }

    @PostMapping("/team-invitations/{id}/decline")
    @PreAuthorize("hasRole('FREELANCER')")
    public TeamMember decline(@PathVariable UUID id) {
        return workspace.respond(CurrentUser.require(), id, false);
    }

    // ------------------------------------------------------------------ public reviews

    @GetMapping("/reviews/users/{userId}")
    public PageResponse<Review> reviewsForUser(@PathVariable UUID userId,
                                               @RequestParam(defaultValue = "0") int page,
                                               @RequestParam(defaultValue = "20") int size) {
        return reviewDisputes.reviewsFor(userId, page, size);
    }

    @GetMapping("/reviews/projects/{projectId}")
    public List<Review> reviewsForProject(@PathVariable UUID projectId) {
        return reviewDisputes.reviewsForProject(projectId);
    }
}
