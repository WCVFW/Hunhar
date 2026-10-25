package com.theunoia.project.web;

import com.theunoia.common.dto.ApiResponse;
import com.theunoia.common.security.AuthUser;
import com.theunoia.common.security.CurrentUser;
import com.theunoia.project.domain.Dispute;
import com.theunoia.project.dto.CreateDisputeDto;
import com.theunoia.project.service.DisputeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/disputes")
@RequiredArgsConstructor
public class DisputeController {

    private final DisputeService disputeService;
    private final com.theunoia.project.service.ProjectAccessService access;

    private static void requireAdmin(AuthUser user) {
        if (user == null || !user.hasRole("ADMIN")) {
            throw new com.theunoia.common.exception.ForbiddenException("Admin access required");
        }
    }

    @PostMapping("/project/{projectId}")
    public ResponseEntity<ApiResponse<Dispute>> raiseDispute(
            @CurrentUser AuthUser currentUser,
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateDisputeDto dto
    ) {
        access.requireParticipant(projectId, currentUser);
        Dispute dispute = disputeService.raiseDispute(projectId, currentUser.id(), dto);
        return ResponseEntity.ok(ApiResponse.ok("Dispute submitted to administration", dispute));
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<ApiResponse<List<Dispute>>> getProjectDisputes(@CurrentUser AuthUser currentUser, @PathVariable UUID projectId) {
        access.requireParticipant(projectId, currentUser);
        return ResponseEntity.ok(ApiResponse.ok(disputeService.getProjectDisputes(projectId)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Dispute>>> getAllDisputes(@CurrentUser AuthUser currentUser) {
        requireAdmin(currentUser);
        return ResponseEntity.ok(ApiResponse.ok(disputeService.getAllDisputes()));
    }

    @PostMapping("/{disputeId}/resolve")
    public ResponseEntity<ApiResponse<Dispute>> resolveDispute(
            @CurrentUser AuthUser currentUser,
            @PathVariable UUID disputeId,
            @RequestParam String resolutionNotes,
            @RequestParam String status
    ) {
        requireAdmin(currentUser);
        return ResponseEntity.ok(ApiResponse.ok(disputeService.resolveDispute(disputeId, resolutionNotes, status)));
    }
}
