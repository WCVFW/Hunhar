package com.theunoia.engagement.web;

import com.theunoia.common.dto.ApiResponse;
import com.theunoia.common.exception.UnauthorizedException;
import com.theunoia.common.security.AuthUser;
import com.theunoia.common.security.CurrentUser;
import com.theunoia.engagement.domain.ChatMessage;
import com.theunoia.engagement.domain.Conversation;
import com.theunoia.engagement.service.ChatService;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Messaging over REST. Senders are always the authenticated user; the browser polls for new messages.
 */
@RestController
@RequestMapping("/api/v1/messages")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/conversations")
    public ResponseEntity<ApiResponse<Conversation>> startConversation(
            @CurrentUser AuthUser currentUser,
            @RequestParam UUID recipientId,
            @RequestParam(required = false) UUID projectId
    ) {
        Conversation conv = chatService.startOrGetConversation(requireUser(currentUser).id(), recipientId, projectId);
        return ResponseEntity.ok(ApiResponse.ok("Conversation ready", conv));
    }

    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<List<Conversation>>> getMyConversations(@CurrentUser AuthUser currentUser) {
        return ResponseEntity.ok(ApiResponse.ok(chatService.getUserConversations(requireUser(currentUser).id())));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(@CurrentUser AuthUser currentUser) {
        return ResponseEntity.ok(ApiResponse.ok(chatService.getTotalUnread(requireUser(currentUser).id())));
    }

    @GetMapping("/conversations/{conversationId}")
    public ResponseEntity<ApiResponse<List<ChatMessage>>> getMessages(@CurrentUser AuthUser currentUser, @PathVariable UUID conversationId) {
        return ResponseEntity.ok(ApiResponse.ok(chatService.getMessages(conversationId, requireUser(currentUser).id())));
    }

    @PostMapping("/conversations/{conversationId}")
    public ResponseEntity<ApiResponse<ChatMessage>> sendMessage(
            @CurrentUser AuthUser currentUser,
            @PathVariable UUID conversationId,
            @RequestBody SendMessageRequest req
    ) {
        ChatMessage msg = chatService.sendMessage(conversationId, requireUser(currentUser).id(), req.getContent(), req.getAttachmentUrl(),
                req.getAttachmentName(), req.getAttachmentType(), req.getAttachmentSize(), req.getReplyToId());
        return ResponseEntity.ok(ApiResponse.ok("Message sent", msg));
    }

    /** Edit the text of your own message. */
    @PutMapping("/conversations/{conversationId}/messages/{messageId}")
    public ResponseEntity<ApiResponse<ChatMessage>> editMessage(
            @CurrentUser AuthUser currentUser,
            @PathVariable UUID conversationId,
            @PathVariable UUID messageId,
            @RequestBody EditMessageRequest req
    ) {
        return ResponseEntity.ok(ApiResponse.ok("Message updated",
                chatService.editMessage(conversationId, messageId, requireUser(currentUser).id(), req.getContent())));
    }

    /** React to a message with an emoji; sending the same emoji again removes your reaction. */
    @PostMapping("/conversations/{conversationId}/messages/{messageId}/reactions")
    public ResponseEntity<ApiResponse<ChatMessage>> react(
            @CurrentUser AuthUser currentUser,
            @PathVariable UUID conversationId,
            @PathVariable UUID messageId,
            @RequestBody ReactionRequest req
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                chatService.toggleReaction(conversationId, messageId, requireUser(currentUser).id(), req.getEmoji())));
    }

    /** Delete your own message (both sides then see "This message was deleted"). */
    @DeleteMapping("/conversations/{conversationId}/messages/{messageId}")
    public ResponseEntity<ApiResponse<ChatMessage>> deleteMessage(
            @CurrentUser AuthUser currentUser,
            @PathVariable UUID conversationId,
            @PathVariable UUID messageId
    ) {
        return ResponseEntity.ok(ApiResponse.ok("Message deleted",
                chatService.deleteMessage(conversationId, messageId, requireUser(currentUser).id())));
    }

    private static AuthUser requireUser(AuthUser user) {
        if (user == null) throw new UnauthorizedException("Authentication required");
        return user;
    }

    @Data
    public static class SendMessageRequest {
        @Size(max = 5000)
        private String content;
        @Size(max = 300)
        private String attachmentUrl;
        @Size(max = 255)
        private String attachmentName;
        @Size(max = 120)
        private String attachmentType;
        private Long attachmentSize;
        private UUID replyToId;
    }

    @Data
    public static class ReactionRequest {
        @Size(max = 16)
        private String emoji;
    }

    @Data
    public static class EditMessageRequest {
        @Size(max = 5000)
        private String content;
    }
}
