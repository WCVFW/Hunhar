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
    private final com.theunoia.project.service.MilestonePlanService planService;

    // ---------------------------------------------------------------- milestone plan (agreed before milestones exist)

    public record PlanRequest(List<com.theunoia.project.service.MilestonePlanService.Item> items, String note) {}

    @GetMapping("/projects/{projectId}/milestone-plan")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> plan(@CurrentUser AuthUser user, @PathVariable UUID projectId) {
        return ResponseEntity.ok(ApiResponse.ok(planService.view(projectId, requireUser(user))));
    }

    /** Save without sending (your draft, or edits while the plan is with you). */
    @PutMapping("/projects/{projectId}/milestone-plan")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> savePlan(@CurrentUser AuthUser user, @PathVariable UUID projectId,
                                                                               @RequestBody PlanRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Plan saved", planService.save(projectId, req.items(), req.note(), requireUser(user))));
    }

    /** Send the plan (with your changes) to the other side. */
    @PostMapping("/projects/{projectId}/milestone-plan/send")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> sendPlan(@CurrentUser AuthUser user, @PathVariable UUID projectId,
                                                                               @RequestBody(required = false) PlanRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Plan sent",
                planService.send(projectId, req == null ? null : req.items(), req == null ? null : req.note(), requireUser(user))));
    }

    /** Accept the plan you received: its milestones are created. */
    @PostMapping("/projects/{projectId}/milestone-plan/accept")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> acceptPlan(@CurrentUser AuthUser user, @PathVariable UUID projectId) {
        return ResponseEntity.ok(ApiResponse.ok("Milestone plan accepted", planService.accept(projectId, requireUser(user))));
    }

    /** After acceptance: propose more milestones (new round). */
    @PostMapping("/projects/{projectId}/milestone-plan/new-round")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> newRound(@CurrentUser AuthUser user, @PathVariable UUID projectId) {
        return ResponseEntity.ok(ApiResponse.ok(planService.startRound(projectId, requireUser(user))));
    }

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

    @PostMapping("/milestones/{milestoneId}/tasks")
    public ResponseEntity<ApiResponse<List<WorkspaceService.MilestoneTaskItem>>> addMilestoneTask(
            @CurrentUser AuthUser user,
            @PathVariable UUID milestoneId,
            @RequestBody WorkspaceService.MilestoneTaskRequest req
    ) {
        return ResponseEntity.ok(ApiResponse.ok("Task added",
                workspaceService.addMilestoneTask(milestoneId, req, requireUser(user))));
    }

    @PutMapping("/milestones/{milestoneId}/tasks/{taskId}")
    public ResponseEntity<ApiResponse<List<WorkspaceService.MilestoneTaskItem>>> updateMilestoneTask(
            @CurrentUser AuthUser user,
            @PathVariable UUID milestoneId,
            @PathVariable String taskId,
            @RequestBody WorkspaceService.MilestoneTaskRequest req
    ) {
        return ResponseEntity.ok(ApiResponse.ok("Task updated",
                workspaceService.updateMilestoneTask(milestoneId, taskId, req, requireUser(user))));
    }

    @DeleteMapping("/milestones/{milestoneId}/tasks/{taskId}")
    public ResponseEntity<ApiResponse<List<WorkspaceService.MilestoneTaskItem>>> deleteMilestoneTask(
            @CurrentUser AuthUser user,
            @PathVariable UUID milestoneId,
            @PathVariable String taskId
    ) {
        return ResponseEntity.ok(ApiResponse.ok("Task deleted",
                workspaceService.deleteMilestoneTask(milestoneId, taskId, requireUser(user))));
    }
}
