package com.theunoia.engagement.web;

import com.theunoia.common.dto.ApiResponse;
import com.theunoia.common.exception.ForbiddenException;
import com.theunoia.common.exception.UnauthorizedException;
import com.theunoia.common.security.AuthUser;
import com.theunoia.common.security.CurrentUser;
import com.theunoia.engagement.domain.Notification;
import com.theunoia.engagement.service.NotificationService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Notification>>> getMyNotifications(
            @CurrentUser AuthUser currentUser,
            @RequestParam(defaultValue = "100") int limit) {
        return ResponseEntity.ok(ApiResponse.ok(notificationService.getUserNotifications(requireUser(currentUser).id(), limit)));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(@CurrentUser AuthUser currentUser) {
        return ResponseEntity.ok(ApiResponse.ok(notificationService.getUnreadCount(requireUser(currentUser).id())));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@CurrentUser AuthUser currentUser, @PathVariable UUID id) {
        notificationService.markAsRead(id, requireUser(currentUser).id());
        return ResponseEntity.ok(ApiResponse.ok("Notification marked as read", null));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<Integer>> markAllAsRead(@CurrentUser AuthUser currentUser) {
        return ResponseEntity.ok(ApiResponse.ok("All notifications marked as read",
                notificationService.markAllAsRead(requireUser(currentUser).id())));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@CurrentUser AuthUser currentUser, @PathVariable UUID id) {
        notificationService.delete(id, requireUser(currentUser).id());
        return ResponseEntity.ok(ApiResponse.ok("Notification deleted", null));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> deleteAll(@CurrentUser AuthUser currentUser) {
        notificationService.deleteAll(requireUser(currentUser).id());
        return ResponseEntity.ok(ApiResponse.ok("All notifications cleared", null));
    }

    @PostMapping("/trigger-whatsapp")
    public ResponseEntity<ApiResponse<Void>> triggerWhatsApp(
            @CurrentUser AuthUser currentUser,
            @RequestBody WhatsAppTriggerRequest req
    ) {
        if (!requireUser(currentUser).hasRole("ADMIN")) {
            throw new ForbiddenException("Admin access required");
        }
        notificationService.triggerWhatsAppAlert(req.getMobileNumber(), req.getTemplateName(), req.getParams());
        return ResponseEntity.ok(ApiResponse.ok("WhatsApp notification triggered", null));
    }

    private static AuthUser requireUser(AuthUser user) {
        if (user == null) throw new UnauthorizedException("Authentication required");
        return user;
    }

    @Data
    public static class WhatsAppTriggerRequest {
        private String mobileNumber;
        private String templateName;
        private Map<String, String> params;
    }
}
