package com.theunoia.project.web;

import com.theunoia.common.dto.ApiResponse;
import com.theunoia.common.dto.PagedResponse;
import com.theunoia.common.security.AuthUser;
import com.theunoia.common.security.CurrentUser;
import com.theunoia.project.domain.Project;
import com.theunoia.project.dto.CreateProjectDto;
import com.theunoia.project.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static com.theunoia.project.service.ProjectAccessService.requireUser;

@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @PostMapping
    public ResponseEntity<ApiResponse<Project>> createProject(
            @CurrentUser AuthUser currentUser,
            @Valid @RequestBody CreateProjectDto dto
    ) {
        AuthUser user = requireUser(currentUser);
        if (!user.hasRole("CLIENT")) throw new com.theunoia.common.exception.ForbiddenException("Only clients can post projects");
        Project project = projectService.createProject(user.id(), dto);
        return ResponseEntity.ok(ApiResponse.ok(project.getStatus() == com.theunoia.project.domain.ProjectStatus.DRAFT
                ? "Draft saved" : "Project published", project));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Project>> getProjectById(@CurrentUser AuthUser currentUser, @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(projectService.getProjectById(id, requireUser(currentUser))));
    }

    /**
     * Open projects for freelancers. {@code categories}/{@code excludeCategories} are comma separated,
     * {@code sort} is one of newest, budget_desc, budget_asc, deadline_asc.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<Project>>> searchProjects(
            @CurrentUser AuthUser currentUser,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) List<String> categories,
            @RequestParam(required = false) List<String> excludeCategories,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) BigDecimal minBudget,
            @RequestParam(required = false) BigDecimal maxBudget,
            @RequestParam(required = false) Integer maxDays,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        List<String> cats = categories;
        if ((cats == null || cats.isEmpty()) && category != null && !category.isBlank()) {
            cats = List.of(category);
        }
        var filters = new ProjectService.SearchFilters(cats, excludeCategories, search, minBudget, maxBudget, maxDays, sort);
        return ResponseEntity.ok(ApiResponse.ok(projectService.searchProjects(filters, page, size, requireUser(currentUser).id())));
    }

    @GetMapping("/client/my-projects")
    public ResponseEntity<ApiResponse<List<Project>>> getClientProjects(@CurrentUser AuthUser currentUser) {
        return ResponseEntity.ok(ApiResponse.ok(projectService.getClientProjects(requireUser(currentUser).id())));
    }

    @GetMapping("/freelancer/my-projects")
    public ResponseEntity<ApiResponse<List<Project>>> getFreelancerProjects(@CurrentUser AuthUser currentUser) {
        return ResponseEntity.ok(ApiResponse.ok(projectService.getFreelancerProjects(requireUser(currentUser).id())));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Project>> updateProject(@CurrentUser AuthUser currentUser, @PathVariable UUID id,
                                                              @Valid @RequestBody CreateProjectDto dto) {
        return ResponseEntity.ok(ApiResponse.ok("Project updated", projectService.updateProject(id, requireUser(currentUser), dto)));
    }

    @PostMapping("/{id}/publish")
    public ResponseEntity<ApiResponse<Project>> publish(@CurrentUser AuthUser currentUser, @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok("Project published", projectService.publish(id, requireUser(currentUser))));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<Project>> cancel(@CurrentUser AuthUser currentUser, @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok("Project cancelled", projectService.cancelByClient(id, requireUser(currentUser))));
    }

    // ------------------------------------------------------------ admin

    @GetMapping("/admin/all")
    public ResponseEntity<ApiResponse<List<Project>>> adminList(@CurrentUser AuthUser currentUser,
                                                                @RequestParam(required = false) com.theunoia.project.domain.ProjectStatus status,
                                                                @RequestParam(required = false) String search) {
        requireAdmin(currentUser);
        return ResponseEntity.ok(ApiResponse.ok(projectService.adminList(status, search)));
    }

    @PostMapping("/admin/{id}/cancel")
    public ResponseEntity<ApiResponse<Project>> adminCancel(@CurrentUser AuthUser currentUser, @PathVariable UUID id,
                                                            @RequestParam(required = false) String reason) {
        requireAdmin(currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Project cancelled", projectService.cancelByAdmin(id, reason)));
    }

    @GetMapping("/admin/stats")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> adminStats(@CurrentUser AuthUser currentUser) {
        requireAdmin(currentUser);
        return ResponseEntity.ok(ApiResponse.ok(projectService.stats()));
    }

    private static void requireAdmin(AuthUser user) {
        if (!requireUser(user).hasRole("ADMIN")) throw new com.theunoia.common.exception.ForbiddenException("Admin access required");
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<Project>> completeProject(@CurrentUser AuthUser currentUser, @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok("Project marked as complete", projectService.completeProject(id, currentUser)));
    }
}
