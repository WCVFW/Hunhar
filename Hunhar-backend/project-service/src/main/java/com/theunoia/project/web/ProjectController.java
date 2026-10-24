package com.theunoia.project.web;

import com.theunoia.common.security.CurrentUser;
import com.theunoia.common.web.PageResponse;
import com.theunoia.project.domain.Dispute;
import com.theunoia.project.domain.Project;
import com.theunoia.project.domain.ProjectUpdate;
import com.theunoia.project.domain.Review;
import com.theunoia.project.domain.TeamMember;
import com.theunoia.project.dto.ProjectDtos.AttachmentRequest;
import com.theunoia.project.dto.ProjectDtos.BidComparison;
import com.theunoia.project.dto.ProjectDtos.BidRequest;
import com.theunoia.project.dto.ProjectDtos.BidResponse;
import com.theunoia.project.dto.ProjectDtos.CancelRequest;
import com.theunoia.project.dto.ProjectDtos.DisputeRequest;
import com.theunoia.project.dto.ProjectDtos.MilestoneRequest;
import com.theunoia.project.dto.ProjectDtos.MilestoneResponse;
import com.theunoia.project.dto.ProjectDtos.ProgressUpdateRequest;
import com.theunoia.project.dto.ProjectDtos.ProjectRequest;
import com.theunoia.project.dto.ProjectDtos.ProjectResponse;
import com.theunoia.project.dto.ProjectDtos.ProjectSummary;
import com.theunoia.project.dto.ProjectDtos.ReviewRequest;
import com.theunoia.project.dto.ProjectDtos.TeamInviteRequest;
import com.theunoia.project.service.BidService;
import com.theunoia.project.service.ProjectSearchRepository;
import com.theunoia.project.service.ProjectService;
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

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
public class ProjectController {

    private static final String ACTIVE_CLIENT = "hasRole('CLIENT') and hasAuthority('STATUS_ACTIVE')";
    private static final String ACTIVE_FREELANCER = "hasRole('FREELANCER') and hasAuthority('STATUS_ACTIVE')";

    private final ProjectService projects;
    private final BidService bids;
    private final WorkspaceService workspace;
    private final ReviewDisputeService reviewDisputes;

    // ------------------------------------------------------------------ discovery (public)

    @GetMapping
    public PageResponse<ProjectSummary> browse(@RequestParam(required = false) String q,
                                               @RequestParam(required = false) UUID categoryId,
                                               @RequestParam(required = false) String skill,
                                               @RequestParam(required = false) BigDecimal minBudget,
                                               @RequestParam(required = false) BigDecimal maxBudget,
                                               @RequestParam(required = false) String budgetType,
                                               @RequestParam(defaultValue = "newest") String sort,
                                               @RequestParam(defaultValue = "0") int page,
                                               @RequestParam(defaultValue = "20") int size) {
        return projects.browse(new ProjectSearchRepository.Criteria(q, categoryId, skill, minBudget, maxBudget, budgetType,
                sort, page, size));
    }

    @GetMapping("/{id}")
    public ProjectResponse get(@PathVariable UUID id) {
        return projects.get(id, CurrentUser.get().orElse(null));
    }

    // ------------------------------------------------------------------ client: project management

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize(ACTIVE_CLIENT)
    public ProjectResponse create(@Valid @RequestBody ProjectRequest req) {
        return projects.create(CurrentUser.require(), req);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('CLIENT')")
    public ProjectResponse update(@PathVariable UUID id, @Valid @RequestBody ProjectRequest req) {
        return projects.update(CurrentUser.require(), id, req);
    }

    @PostMapping("/{id}/publish")
    @PreAuthorize(ACTIVE_CLIENT)
    public ProjectResponse publish(@PathVariable UUID id) {
        return projects.publish(CurrentUser.require(), id);
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasRole('CLIENT')")
    public ProjectResponse cancel(@PathVariable UUID id, @Valid @RequestBody(required = false) CancelRequest req) {
        return projects.cancel(CurrentUser.require(), id, req == null ? null : req.reason());
    }

    @PostMapping("/{id}/attachments")
    @PreAuthorize("hasRole('CLIENT')")
    public Map<String, Object> attach(@PathVariable UUID id, @Valid @RequestBody AttachmentRequest req) {
        return projects.addAttachment(CurrentUser.require(), id, req);
    }

    /** Client: own projects; freelancer: assigned projects. Filter by status (OPEN, IN_PROGRESS, COMPLETED, CANCELLED). */
    @GetMapping("/mine")
    public PageResponse<ProjectResponse> mine(@RequestParam(required = false) Project.Status status,
                                              @RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "20") int size) {
        return projects.mine(CurrentUser.require(), status, page, size);
    }

    @GetMapping("/dashboard/freelancer")
    @PreAuthorize("hasRole('FREELANCER')")
    public Map<String, Object> freelancerDashboard() {
        return projects.freelancerDashboard(CurrentUser.require().id());
    }

    @GetMapping("/dashboard/client")
    @PreAuthorize("hasRole('CLIENT')")
    public Map<String, Object> clientDashboard() {
        return projects.clientDashboard(CurrentUser.require().id());
    }

    // ------------------------------------------------------------------ bidding

    @PostMapping("/{id}/bids")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize(ACTIVE_FREELANCER)
    public BidResponse bid(@PathVariable UUID id, @Valid @RequestBody BidRequest req) {
        return bids.submit(CurrentUser.require(), id, req);
    }

    @GetMapping("/{id}/bids")
    @PreAuthorize("hasAnyRole('CLIENT', 'ADMIN')")
    public BidComparison projectBids(@PathVariable UUID id, @RequestParam(required = false) String sort) {
        return bids.forProject(CurrentUser.require(), id, sort);
    }

    // ------------------------------------------------------------------ workspace

    @GetMapping("/{id}/workspace")
    public Map<String, Object> workspace(@PathVariable UUID id) {
        return workspace.workspace(CurrentUser.require(), id);
    }

    @PostMapping("/{id}/milestones")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('CLIENT')")
    public MilestoneResponse addMilestone(@PathVariable UUID id, @Valid @RequestBody MilestoneRequest req) {
        return workspace.addMilestone(CurrentUser.require(), id, req);
    }

    @PostMapping("/{id}/updates")
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectUpdate postUpdate(@PathVariable UUID id, @Valid @RequestBody ProgressUpdateRequest req) {
        return workspace.postUpdate(CurrentUser.require(), id, req);
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasRole('CLIENT')")
    public Map<String, Object> complete(@PathVariable UUID id) {
        return workspace.complete(CurrentUser.require(), id);
    }

    @PostMapping("/{id}/team")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('FREELANCER')")
    public TeamMember invite(@PathVariable UUID id, @Valid @RequestBody TeamInviteRequest req) {
        return workspace.invite(CurrentUser.require(), id, req);
    }

    @DeleteMapping("/{id}/team/{invitationId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeMember(@PathVariable UUID id, @PathVariable UUID invitationId) {
        workspace.removeMember(CurrentUser.require(), id, invitationId);
    }

    // ------------------------------------------------------------------ reviews & disputes

    @PostMapping("/{id}/reviews")
    @ResponseStatus(HttpStatus.CREATED)
    public Review review(@PathVariable UUID id, @Valid @RequestBody ReviewRequest req) {
        return reviewDisputes.review(CurrentUser.require(), id, req);
    }

    @PostMapping("/{id}/disputes")
    @ResponseStatus(HttpStatus.CREATED)
    public Dispute raiseDispute(@PathVariable UUID id, @Valid @RequestBody DisputeRequest req) {
        return reviewDisputes.raise(CurrentUser.require(), id, req);
    }

    @GetMapping("/{id}/disputes")
    public List<Dispute> disputes(@PathVariable UUID id) {
        return reviewDisputes.forProject(CurrentUser.require(), id);
    }
}
