package com.theunoia.notification.service;

import com.theunoia.common.exception.ApiException;
import com.theunoia.common.web.PageResponse;
import com.theunoia.common.web.Pagination;
import com.theunoia.notification.channel.EmailSender;
import com.theunoia.notification.channel.WhatsAppSender;
import com.theunoia.notification.domain.NotificationEntities.Notification;
import com.theunoia.notification.domain.NotificationEntities.UserContact;
import com.theunoia.notification.repository.NotificationRepositories.NotificationRepository;
import com.theunoia.notification.repository.NotificationRepositories.UserContactRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Multi-channel dispatcher: in-app (always), email and WhatsApp (respecting user preferences). */
@Service
@RequiredArgsConstructor
public class Notifier {

    private final NotificationRepository notifications;
    private final UserContactRepository contacts;
    private final EmailSender email;
    private final WhatsAppSender whatsapp;

    /** Builder-style spec of one notification. */
    public static final class Spec {
        final String type;
        final String title;
        final String body;
        final Map<String, Object> data = new HashMap<>();
        String emailSubject;
        String emailHtml;
        String whatsappTemplate;
        List<String> whatsappParams = List.of();

        private Spec(String type, String title, String body) {
            this.type = type;
            this.title = title;
            this.body = body;
        }

        public static Spec of(String type, String title, String body) {
            return new Spec(type, title, body);
        }

        public Spec data(String key, Object value) {
            if (value != null) data.put(key, value);
            return this;
        }

        public Spec email(String subject, String html) {
            this.emailSubject = subject;
            this.emailHtml = html;
            return this;
        }

        public Spec whatsapp(String template, String... params) {
            this.whatsappTemplate = template;
            this.whatsappParams = List.of(params);
            return this;
        }
    }

    @Transactional
    public void notify(UUID userId, Spec spec) {
        if (userId == null) return;
        Notification n = new Notification();
        n.setUserId(userId);
        n.setType(spec.type);
        n.setTitle(spec.title);
        n.setBody(spec.body);
        n.setData(spec.data);
        notifications.save(n);

        UserContact c = contacts.findById(userId).orElse(null);
        if (c == null) return;
        if (spec.emailSubject != null && c.isEmailEnabled()) {
            email.send(userId, c.getEmail(), spec.type, spec.emailSubject, spec.emailHtml);
        }
        if (spec.whatsappTemplate != null && c.isWhatsappEnabled()) {
            whatsapp.sendTemplate(userId, c.getMobile(), spec.whatsappTemplate, spec.whatsappParams);
        }
    }

    public String nameOf(UUID userId) {
        return contacts.findById(userId).map(UserContact::getDisplayName).orElse("there");
    }

    // ------------------------------------------------------------------ in-app API

    @Transactional(readOnly = true)
    public PageResponse<Notification> list(UUID userId, boolean unreadOnly, int page, int size) {
        var pageable = Pagination.newestFirst(page, size);
        return PageResponse.of(unreadOnly ? notifications.findByUserIdAndReadAtIsNull(userId, pageable)
                : notifications.findByUserId(userId, pageable), x -> x);
    }

    @Transactional(readOnly = true)
    public long unread(UUID userId) {
        return notifications.countByUserIdAndReadAtIsNull(userId);
    }

    @Transactional
    public Notification markRead(UUID userId, UUID id) {
        Notification n = notifications.findByIdAndUserId(id, userId).orElseThrow(() -> ApiException.notFound("Notification"));
        if (n.getReadAt() == null) n.setReadAt(Instant.now());
        return n;
    }

    @Transactional
    public int markAllRead(UUID userId) {
        return notifications.markAllRead(userId);
    }

    @Transactional(readOnly = true)
    public UserContact preferences(UUID userId) {
        return contacts.findById(userId).orElseThrow(() -> ApiException.notFound("Notification preferences"));
    }

    @Transactional
    public UserContact updatePreferences(UUID userId, Boolean emailEnabled, Boolean whatsappEnabled, Boolean marketingOptIn) {
        UserContact c = preferences(userId);
        if (emailEnabled != null) c.setEmailEnabled(emailEnabled);
        if (whatsappEnabled != null) c.setWhatsappEnabled(whatsappEnabled);
        if (marketingOptIn != null) c.setMarketingOptIn(marketingOptIn);
        return c;
    }
}
