package com.theunoia.project.web;

import com.theunoia.common.dto.ApiResponse;
import com.theunoia.common.exception.ForbiddenException;
import com.theunoia.common.security.AuthUser;
import com.theunoia.common.security.CurrentUser;
import com.theunoia.project.domain.Dispute;
import com.theunoia.project.dto.CreateDisputeDto;
import com.theunoia.project.service.DisputeService;
import jakarta.validation.Valid;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

import static com.theunoia.project.service.ProjectAccessService.requireUser;

@RestController
@RequestMapping("/api/v1/disputes")
@RequiredArgsConstructor
public class DisputeController {

    private final DisputeService disputeService;

    @PostMapping("/project/{projectId}")
    public ResponseEntity<ApiResponse<Dispute>> raiseDispute(
            @CurrentUser AuthUser currentUser,
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateDisputeDto dto
    ) {
        return ResponseEntity.ok(ApiResponse.ok("Dispute submitted. Hunhar support will review it.",
                disputeService.raiseDispute(projectId, requireUser(currentUser), dto)));
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<ApiResponse<List<Dispute>>> getProjectDisputes(@CurrentUser AuthUser currentUser, @PathVariable UUID projectId) {
        return ResponseEntity.ok(ApiResponse.ok(disputeService.getProjectDisputes(projectId, requireUser(currentUser))));
    }

    /** Admin: all disputes, optional ?status=OPEN|RESOLVED|DISMISSED */
    @GetMapping
    public ResponseEntity<ApiResponse<List<Dispute>>> getAllDisputes(@CurrentUser AuthUser currentUser,
                                                                     @RequestParam(required = false) String status) {
        requireAdmin(currentUser);
        return ResponseEntity.ok(ApiResponse.ok(disputeService.getAllDisputes(status)));
    }

    @PostMapping("/{disputeId}/resolve")
    public ResponseEntity<ApiResponse<Dispute>> resolveDispute(
            @CurrentUser AuthUser currentUser,
            @PathVariable UUID disputeId,
            @RequestBody ResolveRequest req
    ) {
        requireAdmin(currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Dispute closed",
                disputeService.resolveDispute(disputeId, req.getResolutionNotes(), req.getStatus())));
    }

    private static void requireAdmin(AuthUser user) {
        if (!requireUser(user).hasRole("ADMIN")) throw new ForbiddenException("Admin access required");
    }

    @Data
    public static class ResolveRequest {
        private String resolutionNotes;
        private String status;
    }
}
