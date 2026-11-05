package com.theunoia.project.web;

import com.theunoia.common.dto.ApiResponse;
import com.theunoia.common.security.AuthUser;
import com.theunoia.common.security.CurrentUser;
import com.theunoia.project.domain.Deliverable;
import com.theunoia.project.domain.Milestone;
import com.theunoia.project.domain.Project;
import com.theunoia.project.dto.DeliverableDto;
import com.theunoia.project.dto.MilestoneDto;
import com.theunoia.project.dto.WorkspaceViewDto;
import com.theunoia.project.service.WorkspaceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

import static com.theunoia.project.service.ProjectAccessService.requireUser;

@RestController
@RequestMapping("/api/v1/workspace")
@RequiredArgsConstructor
public class WorkspaceController {

    private final WorkspaceService workspaceService;

    @GetMapping("/projects/{projectId}")
    public ResponseEntity<ApiResponse<WorkspaceViewDto>> getWorkspace(@CurrentUser AuthUser user, @PathVariable UUID projectId) {
        return ResponseEntity.ok(ApiResponse.ok(workspaceService.getWorkspace(projectId, requireUser(user))));
    }

    @PostMapping("/projects/{projectId}/milestones")
    public ResponseEntity<ApiResponse<Milestone>> addMilestone(
            @CurrentUser AuthUser user,
            @PathVariable UUID projectId,
            @Valid @RequestBody MilestoneDto dto
    ) {
        return ResponseEntity.ok(ApiResponse.ok("Milestone created", workspaceService.addMilestone(projectId, dto, requireUser(user))));
    }

    @GetMapping("/projects/{projectId}/milestones")
    public ResponseEntity<ApiResponse<List<Milestone>>> getMilestones(@CurrentUser AuthUser user, @PathVariable UUID projectId) {
        return ResponseEntity.ok(ApiResponse.ok(workspaceService.getProjectMilestones(projectId, requireUser(user))));
    }

    @PostMapping("/milestones/{milestoneId}/deliverables")
    public ResponseEntity<ApiResponse<Deliverable>> submitDeliverable(
            @CurrentUser AuthUser user,
            @PathVariable UUID milestoneId,
            @Valid @RequestBody DeliverableDto dto
    ) {
        return ResponseEntity.ok(ApiResponse.ok("Work submitted for review",
                workspaceService.submitDeliverable(milestoneId, requireUser(user), dto)));
    }

    @GetMapping("/milestones/{milestoneId}/deliverables")
    public ResponseEntity<ApiResponse<List<Deliverable>>> getDeliverables(@CurrentUser AuthUser user, @PathVariable UUID milestoneId) {
        return ResponseEntity.ok(ApiResponse.ok(workspaceService.getDeliverablesForMilestone(milestoneId, requireUser(user))));
    }

    @PostMapping("/deliverables/{deliverableId}/review")
    public ResponseEntity<ApiResponse<Void>> reviewDeliverable(
            @CurrentUser AuthUser user,
            @PathVariable UUID deliverableId,
            @RequestParam boolean approve
    ) {
        workspaceService.reviewDeliverable(deliverableId, approve, requireUser(user));
        return ResponseEntity.ok(ApiResponse.ok("Deliverable review recorded", null));
    }

    @PostMapping("/milestones/{milestoneId}/fund")
    public ResponseEntity<ApiResponse<Milestone>> fundMilestone(@CurrentUser AuthUser user, @PathVariable UUID milestoneId) {
        return ResponseEntity.ok(ApiResponse.ok("Milestone funded — the amount is held in escrow",
                workspaceService.fundMilestone(milestoneId, requireUser(user))));
    }

    @PostMapping("/milestones/{milestoneId}/release")
    public ResponseEntity<ApiResponse<Milestone>> releaseMilestone(@CurrentUser AuthUser user, @PathVariable UUID milestoneId) {
        return ResponseEntity.ok(ApiResponse.ok("Payment released to the freelancer",
                workspaceService.releaseMilestone(milestoneId, requireUser(user))));
    }

    @PatchMapping("/projects/{projectId}/progress")
    public ResponseEntity<ApiResponse<Project>> updateProgress(
            @CurrentUser AuthUser user,
            @PathVariable UUID projectId,
            @RequestParam int progressPercentage
    ) {
        return ResponseEntity.ok(ApiResponse.ok("Progress updated",
                workspaceService.updateProgress(projectId, progressPercentage, user)));
    }
}
