package com.theunoia.project.web;

import com.theunoia.common.dto.ApiResponse;
import com.theunoia.common.security.AuthUser;
import com.theunoia.common.security.CurrentUser;
import com.theunoia.project.domain.TeamCollaborator;
import com.theunoia.project.dto.InviteCollaboratorDto;
import com.theunoia.project.service.CollaborationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

import static com.theunoia.project.service.ProjectAccessService.requireUser;

@RestController
@RequestMapping("/api/v1/collaborations")
@RequiredArgsConstructor
public class CollaborationController {

    private final CollaborationService collaborationService;

    @PostMapping("/project/{projectId}/invite")
    public ResponseEntity<ApiResponse<TeamCollaborator>> inviteCollaborator(
            @CurrentUser AuthUser currentUser,
            @PathVariable UUID projectId,
            @Valid @RequestBody InviteCollaboratorDto dto
    ) {
        TeamCollaborator tc = collaborationService.inviteCollaborator(projectId, requireUser(currentUser), dto);
        return ResponseEntity.ok(ApiResponse.ok("Invitation sent", tc));
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<ApiResponse<List<TeamCollaborator>>> getProjectTeam(@CurrentUser AuthUser currentUser, @PathVariable UUID projectId) {
        return ResponseEntity.ok(ApiResponse.ok(collaborationService.getProjectTeam(projectId, requireUser(currentUser))));
    }

    @GetMapping("/my-invites")
    public ResponseEntity<ApiResponse<List<TeamCollaborator>>> getMyInvites(@CurrentUser AuthUser currentUser) {
        return ResponseEntity.ok(ApiResponse.ok(collaborationService.getMyInvites(requireUser(currentUser).id())));
    }

    @GetMapping("/sent")
    public ResponseEntity<ApiResponse<List<TeamCollaborator>>> getSentInvites(@CurrentUser AuthUser currentUser) {
        return ResponseEntity.ok(ApiResponse.ok(collaborationService.getSentInvites(requireUser(currentUser).id())));
    }

    @PostMapping("/invites/{inviteId}/respond")
    public ResponseEntity<ApiResponse<TeamCollaborator>> respondToInvite(
            @CurrentUser AuthUser currentUser,
            @PathVariable UUID inviteId,
            @RequestParam boolean accept
    ) {
        return ResponseEntity.ok(ApiResponse.ok(accept ? "Invitation accepted" : "Invitation declined",
                collaborationService.respondToInvite(inviteId, accept, requireUser(currentUser))));
    }

    @DeleteMapping("/invites/{inviteId}")
    public ResponseEntity<ApiResponse<Void>> removeCollaborator(@CurrentUser AuthUser currentUser, @PathVariable UUID inviteId) {
        collaborationService.removeCollaborator(inviteId, requireUser(currentUser));
        return ResponseEntity.ok(ApiResponse.ok("Team member removed", null));
    }
}
