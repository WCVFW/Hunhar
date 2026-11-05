package com.theunoia.engagement.service;

import com.theunoia.common.exception.ForbiddenException;
import com.theunoia.common.exception.ResourceNotFoundException;
import com.theunoia.engagement.domain.Notification;
import com.theunoia.engagement.integration.EmailSender;
import com.theunoia.engagement.integration.WhatsAppSender;
import com.theunoia.engagement.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final WhatsAppSender whatsAppSender;
    private final EmailSender emailSender;

    @Transactional
    public Notification sendNotification(UUID userId, String title, String message, String type, String link) {
        Notification notification = Notification.builder()
                .userId(userId)
                .title(truncate(title, 150))
                .message(message)
                .type(truncate(type == null ? "SYSTEM" : type, 50))
                .link(link)
                .isRead(false)
                .build();
        return notificationRepository.save(notification);
    }

    public boolean triggerWhatsAppAlert(String mobileNumber, String templateName, Map<String, String> params) {
        if (mobileNumber == null || mobileNumber.isBlank() || templateName == null || templateName.isBlank()) return false;
        return whatsAppSender.sendTemplateNotification(mobileNumber, templateName, params);
    }

    public List<Notification> getUserNotifications(UUID userId, int limit) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(0, Math.min(Math.max(limit, 1), 200)));
    }

    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markAsRead(UUID id, UUID userId) {
        Notification notification = owned(id, userId);
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public int markAllAsRead(UUID userId) {
        return notificationRepository.markAllRead(userId);
    }

    @Transactional
    public void delete(UUID id, UUID userId) {
        notificationRepository.delete(owned(id, userId));
    }

    @Transactional
    public void deleteAll(UUID userId) {
        notificationRepository.deleteByUserId(userId);
    }

    private Notification owned(UUID id, UUID userId) {
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        if (!n.getUserId().equals(userId)) {
            throw new ForbiddenException("Not your notification");
        }
        return n;
    }

    private static String truncate(String s, int max) {
        return s == null || s.length() <= max ? s : s.substring(0, max);
    }
}
