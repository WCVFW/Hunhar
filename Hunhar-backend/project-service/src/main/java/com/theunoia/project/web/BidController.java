package com.theunoia.project.web;

import com.theunoia.common.dto.ApiResponse;
import com.theunoia.common.security.AuthUser;
import com.theunoia.common.security.CurrentUser;
import com.theunoia.project.domain.Bid;
import com.theunoia.project.domain.Project;
import com.theunoia.project.dto.SubmitBidDto;
import com.theunoia.project.service.BidService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

import static com.theunoia.project.service.ProjectAccessService.requireUser;

@RestController
@RequestMapping("/api/v1/bids")
@RequiredArgsConstructor
public class BidController {

    private final BidService bidService;

    @PostMapping("/project/{projectId}")
    public ResponseEntity<ApiResponse<Bid>> submitBid(
            @CurrentUser AuthUser currentUser,
            @PathVariable UUID projectId,
            @Valid @RequestBody SubmitBidDto dto
    ) {
        Bid bid = bidService.submitBid(requireUser(currentUser), projectId, dto);
        return ResponseEntity.ok(ApiResponse.ok("Proposal submitted successfully", bid));
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<ApiResponse<List<Bid>>> getBidsForProject(@CurrentUser AuthUser currentUser, @PathVariable UUID projectId) {
        return ResponseEntity.ok(ApiResponse.ok(bidService.getBidsForProject(projectId, requireUser(currentUser))));
    }

    @GetMapping("/my-bids")
    public ResponseEntity<ApiResponse<List<Bid>>> getMyBids(@CurrentUser AuthUser currentUser) {
        return ResponseEntity.ok(ApiResponse.ok(bidService.getBidsForFreelancer(requireUser(currentUser).id())));
    }

    @PatchMapping("/{bidId}/withdraw")
    public ResponseEntity<ApiResponse<Bid>> withdrawBid(@CurrentUser AuthUser currentUser, @PathVariable UUID bidId) {
        return ResponseEntity.ok(ApiResponse.ok("Proposal withdrawn", bidService.withdrawBid(bidId, requireUser(currentUser))));
    }

    @PatchMapping("/{bidId}/shortlist")
    public ResponseEntity<ApiResponse<Bid>> toggleShortlist(
            @CurrentUser AuthUser currentUser,
            @PathVariable UUID bidId,
            @RequestParam boolean shortlist
    ) {
        return ResponseEntity.ok(ApiResponse.ok(bidService.toggleShortlist(bidId, shortlist, requireUser(currentUser))));
    }

    @PostMapping("/{bidId}/award")
    public ResponseEntity<ApiResponse<Project>> awardBid(
            @CurrentUser AuthUser currentUser,
            @PathVariable UUID bidId
    ) {
        Project project = bidService.awardBid(requireUser(currentUser).id(), bidId);
        return ResponseEntity.ok(ApiResponse.ok("Project successfully awarded to freelancer", project));
    }
}
