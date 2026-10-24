package com.theunoia.community.web;

import com.theunoia.common.security.CurrentUser;
import com.theunoia.common.web.PageResponse;
import com.theunoia.community.domain.CommunityEntities.ContentReport;
import com.theunoia.community.domain.CommunityEntities.ForumCategory;
import com.theunoia.community.domain.CommunityEntities.ForumThread;
import com.theunoia.community.domain.CommunityEntities.Reply;
import com.theunoia.community.service.CommunityService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class CommunityController {

    private final CommunityService community;

    public record ThreadRequest(@NotNull UUID categoryId, @Pattern(regexp = "DISCUSSION|QUESTION") String type,
                                @NotBlank @Size(min = 10, max = 200) String title, @NotBlank @Size(min = 20, max = 20000) String body,
                                @Size(max = 8) List<@Size(max = 40) String> tags) {
    }

    public record ReplyRequest(@NotBlank @Size(max = 10000) String body) {
    }

    public record VoteRequest(@NotNull @Pattern(regexp = "THREAD|REPLY") String targetType, @NotNull UUID targetId,
                              @Min(-1) @Max(1) int value) {
    }

    public record ReportRequest(@NotNull @Pattern(regexp = "THREAD|REPLY|USER") String targetType, @NotNull UUID targetId,
                                @NotNull @Pattern(regexp = "SPAM|ABUSE|HARASSMENT|SCAM|OFF_TOPIC|OTHER") String reason,
                                @Size(max = 1000) String details) {
    }

    public record ModerationRequest(@NotNull @Pattern(regexp = "THREAD|REPLY|USER") String targetType, @NotNull UUID targetId,
                                    @NotNull @Pattern(regexp = "LOCK|UNLOCK|PIN|UNPIN|HIDE|RESTORE") String action) {
    }

    public record ReportDecision(@NotNull @Pattern(regexp = "HIDE_CONTENT|DISMISS") String action) {
    }

    public record CategoryRequest(@NotBlank @Size(max = 100) String name, @Size(max = 500) String description, int position,
                                  boolean active) {
    }

    // ------------------------------------------------------------------ public reads

    @GetMapping("/api/v1/community/categories")
    public List<ForumCategory> categories() {
        return community.categories();
    }

    @GetMapping("/api/v1/community/threads")
    public PageResponse<Map<String, Object>> feed(@RequestParam(required = false) UUID categoryId,
                                                  @RequestParam(required = false) String type,
                                                  @RequestParam(required = false) String tag,
                                                  @RequestParam(required = false) String q,
                                                  @RequestParam(defaultValue = "latest") String sort,
                                                  @RequestParam(defaultValue = "0") int page,
                                                  @RequestParam(defaultValue = "20") int size) {
        return community.feed(categoryId, type, tag, q, sort, page, size);
    }

    @GetMapping("/api/v1/community/threads/{id}")
    public Map<String, Object> thread(@PathVariable UUID id) {
        return community.view(id, CurrentUser.get().orElse(null));
    }

    @GetMapping("/api/v1/community/users/{userId}/network")
    public Map<String, Object> network(@PathVariable UUID userId) {
        return community.network(userId);
    }

    // ------------------------------------------------------------------ participation

    @PostMapping("/api/v1/community/threads")
    @ResponseStatus(HttpStatus.CREATED)
    public ForumThread create(@Valid @RequestBody ThreadRequest req) {
        return community.create(CurrentUser.requireActive(), command(req));
    }

    @PutMapping("/api/v1/community/threads/{id}")
    public ForumThread update(@PathVariable UUID id, @Valid @RequestBody ThreadRequest req) {
        return community.update(CurrentUser.require(), id, command(req));
    }

    @DeleteMapping("/api/v1/community/threads/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        community.delete(CurrentUser.require(), id);
    }

    @PostMapping("/api/v1/community/threads/{id}/replies")
    @ResponseStatus(HttpStatus.CREATED)
    public Reply reply(@PathVariable UUID id, @Valid @RequestBody ReplyRequest req) {
        return community.reply(CurrentUser.requireActive(), id, req.body());
    }

    @PutMapping("/api/v1/community/replies/{replyId}")
    public Reply editReply(@PathVariable UUID replyId, @Valid @RequestBody ReplyRequest req) {
        return community.editReply(CurrentUser.require(), replyId, req.body());
    }

    @PostMapping("/api/v1/community/threads/{id}/accept/{replyId}")
    public ForumThread accept(@PathVariable UUID id, @PathVariable UUID replyId) {
        return community.acceptAnswer(CurrentUser.require(), id, replyId);
    }

    @PostMapping("/api/v1/community/votes")
    public Map<String, Object> vote(@Valid @RequestBody VoteRequest req) {
        return community.vote(CurrentUser.require(), req.targetType(), req.targetId(), req.value());
    }

    @PostMapping("/api/v1/community/reports")
    @ResponseStatus(HttpStatus.CREATED)
    public ContentReport report(@Valid @RequestBody ReportRequest req) {
        return community.report(CurrentUser.require(), req.targetType(), req.targetId(), req.reason(), req.details());
    }

    @PostMapping("/api/v1/community/follow/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void follow(@PathVariable UUID userId) {
        community.follow(CurrentUser.require(), userId, true);
    }

    @DeleteMapping("/api/v1/community/follow/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unfollow(@PathVariable UUID userId) {
        community.follow(CurrentUser.require(), userId, false);
    }

    // ------------------------------------------------------------------ admin moderation

    @GetMapping("/api/v1/admin/community/reports")
    @PreAuthorize("hasRole('ADMIN')")
    public PageResponse<ContentReport> reports(@RequestParam(required = false) String status,
                                               @RequestParam(defaultValue = "0") int page,
                                               @RequestParam(defaultValue = "50") int size) {
        return community.reports(status, page, size);
    }

    @PostMapping("/api/v1/admin/community/reports/{id}/resolve")
    @PreAuthorize("hasRole('ADMIN')")
    public ContentReport resolve(@PathVariable UUID id, @Valid @RequestBody ReportDecision req) {
        return community.resolveReport(CurrentUser.require(), id, req.action());
    }

    @PostMapping("/api/v1/admin/community/moderate")
    @PreAuthorize("hasRole('ADMIN')")
    public Object moderate(@Valid @RequestBody ModerationRequest req) {
        return community.moderate(req.targetType(), req.targetId(), req.action());
    }

    @PostMapping("/api/v1/admin/community/categories")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public ForumCategory createCategory(@Valid @RequestBody CategoryRequest req) {
        return community.saveCategory(null, req.name(), req.description(), req.position(), req.active());
    }

    @PutMapping("/api/v1/admin/community/categories/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ForumCategory updateCategory(@PathVariable UUID id, @Valid @RequestBody CategoryRequest req) {
        return community.saveCategory(id, req.name(), req.description(), req.position(), req.active());
    }

    private static CommunityService.ThreadCommand command(ThreadRequest r) {
        return new CommunityService.ThreadCommand(r.categoryId(), r.type(), r.title(), r.body(), r.tags());
    }
}
