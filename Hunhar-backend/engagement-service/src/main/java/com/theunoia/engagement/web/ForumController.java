package com.theunoia.engagement.web;

import com.theunoia.common.dto.ApiResponse;
import com.theunoia.common.dto.PagedResponse;
import com.theunoia.common.security.AuthUser;
import com.theunoia.common.security.CurrentUser;
import com.theunoia.engagement.domain.ForumComment;
import com.theunoia.engagement.domain.ForumPost;
import com.theunoia.engagement.service.ForumService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/community")
@RequiredArgsConstructor
public class ForumController {

    private final ForumService forumService;

    @GetMapping("/posts")
    public ResponseEntity<ApiResponse<PagedResponse<ForumPost>>> getPosts(
            @RequestParam(required = false) String topic,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.ok(forumService.getPosts(topic, pageable)));
    }

    @PostMapping("/posts")
    public ResponseEntity<ApiResponse<ForumPost>> createPost(
            @CurrentUser AuthUser currentUser,
            @RequestBody CreatePostRequest req
    ) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        ForumPost post = forumService.createPost(currentUser.id(), currentUser.email(), req.getTitle(), req.getContent(), req.getTopic());
        return ResponseEntity.ok(ApiResponse.ok("Discussion post created", post));
    }

    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<ApiResponse<ForumComment>> addComment(
            @CurrentUser AuthUser currentUser,
            @PathVariable UUID postId,
            @RequestBody AddCommentRequest req
    ) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        ForumComment comment = forumService.addComment(postId, currentUser.id(), currentUser.email(), req.getContent());
        return ResponseEntity.ok(ApiResponse.ok("Comment added", comment));
    }

    @GetMapping("/posts/{postId}/comments")
    public ResponseEntity<ApiResponse<List<ForumComment>>> getComments(@PathVariable UUID postId) {
        return ResponseEntity.ok(ApiResponse.ok(forumService.getComments(postId)));
    }

    @PatchMapping("/comments/{commentId}/accept")
    public ResponseEntity<ApiResponse<Void>> acceptAnswer(@PathVariable UUID commentId) {
        forumService.acceptAnswer(commentId);
        return ResponseEntity.ok(ApiResponse.ok("Marked as accepted answer", null));
    }

    @PostMapping("/posts/{postId}/upvote")
    public ResponseEntity<ApiResponse<ForumPost>> upvotePost(@PathVariable UUID postId) {
        return ResponseEntity.ok(ApiResponse.ok(forumService.upvotePost(postId)));
    }

    @Data
    public static class CreatePostRequest {
        private String title;
        private String content;
        private String topic;
    }

    @Data
    public static class AddCommentRequest {
        private String content;
    }
}
