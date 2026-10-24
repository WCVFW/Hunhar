package com.theunoia.project.web;

import com.theunoia.common.exception.ApiException;
import com.theunoia.common.security.CurrentUser;
import com.theunoia.common.web.PageResponse;
import com.theunoia.project.domain.Category;
import com.theunoia.project.domain.Dispute;
import com.theunoia.project.domain.Project;
import com.theunoia.project.dto.ProjectDtos.BidComparison;
import com.theunoia.project.dto.ProjectDtos.CategoryRequest;
import com.theunoia.project.dto.ProjectDtos.DisputeResolution;
import com.theunoia.project.dto.ProjectDtos.ProjectResponse;
import com.theunoia.project.dto.ProjectDtos.StatusChangeRequest;
import com.theunoia.project.repository.ProjectRepositories.CategoryRepository;
import com.theunoia.project.service.BidService;
import com.theunoia.project.service.ProjectService;
import com.theunoia.project.service.ReviewDisputeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/** Admin panel - project monitoring, bid monitoring, dispute handling, category management. */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class AdminProjectController {

    private final ProjectService projects;
    private final BidService bids;
    private final ReviewDisputeService disputes;
    private final CategoryRepository categories;

    @GetMapping("/categories")
    public List<Category> categories() {
        return categories.findByActiveTrueOrderByPositionAscNameAsc();
    }

    @PostMapping("/admin/categories")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public Category createCategory(@Valid @RequestBody CategoryRequest req) {
        String slug = slugify(req.name());
        if (categories.existsBySlug(slug)) throw ApiException.conflict("Category already exists");
        Category c = new Category();
        c.setName(req.name());
        c.setSlug(slug);
        c.setParentId(req.parentId());
        c.setPosition(req.position());
        c.setActive(req.active() == null || req.active());
        return categories.save(c);
    }

    @PutMapping("/admin/categories/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public Category updateCategory(@PathVariable UUID id, @Valid @RequestBody CategoryRequest req) {
        Category c = categories.findById(id).orElseThrow(() -> ApiException.notFound("Category"));
        c.setName(req.name());
        c.setParentId(req.parentId());
        c.setPosition(req.position());
        if (req.active() != null) c.setActive(req.active());
        return c;
    }

    @GetMapping("/admin/projects")
    @PreAuthorize("hasRole('ADMIN')")
    public PageResponse<ProjectResponse> listProjects(@RequestParam(required = false) Project.Status status,
                                                      @RequestParam(required = false) UUID clientId,
                                                      @RequestParam(defaultValue = "0") int page,
                                                      @RequestParam(defaultValue = "20") int size) {
        return projects.adminSearch(status, clientId, page, size);
    }

    @PatchMapping("/admin/projects/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ProjectResponse changeStatus(@PathVariable UUID id, @Valid @RequestBody StatusChangeRequest req) {
        return projects.adminChangeStatus(CurrentUser.require(), id, req.status(), req.reason());
    }

    @GetMapping("/admin/bids")
    @PreAuthorize("hasRole('ADMIN')")
    public BidComparison bidsForProject(@RequestParam UUID projectId, @RequestParam(required = false) String sort) {
        return bids.forProject(CurrentUser.require(), projectId, sort);
    }

    @GetMapping("/admin/disputes")
    @PreAuthorize("hasRole('ADMIN')")
    public PageResponse<Dispute> listDisputes(@RequestParam(required = false) Dispute.Status status,
                                              @RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "20") int size) {
        return disputes.adminList(status, page, size);
    }

    @PostMapping("/admin/disputes/{id}/review")
    @PreAuthorize("hasRole('ADMIN')")
    public Dispute startReview(@PathVariable UUID id) {
        return disputes.markUnderReview(id);
    }

    @PostMapping("/admin/disputes/{id}/resolve")
    @PreAuthorize("hasRole('ADMIN')")
    public Dispute resolve(@PathVariable UUID id, @Valid @RequestBody DisputeResolution req) {
        return disputes.resolve(CurrentUser.require(), id, req);
    }

    static String slugify(String name) {
        return Normalizer.normalize(name, Normalizer.Form.NFD).replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
    }
}
