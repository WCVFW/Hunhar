package com.theunoia.notification.channel;

import com.fasterxml.jackson.databind.JsonNode;
import com.theunoia.notification.config.NotificationProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * WhatsApp Business Platform (Meta Cloud API) - template messages only, used for alerts and
 * reminders (business-initiated messages require pre-approved templates). Templates expected:
 * registration_approved, new_project_match, new_bid_received, project_awarded, meeting_reminder,
 * deadline_reminder, payment_reminder, payment_received, verification_completed, promotional_campaign.
 */
@Slf4j
@Component
public class WhatsAppSender {

    private final NotificationProperties.WhatsApp cfg;
    private final JdbcTemplate jdbc;
    private final RestClient client;

    public WhatsAppSender(NotificationProperties props, JdbcTemplate jdbc) {
        this.cfg = props.getWhatsapp();
        this.jdbc = jdbc;
        this.client = RestClient.builder().baseUrl(cfg.getApiUrl()).build();
    }

    public void sendTemplate(UUID userId, String mobile, String template, List<String> params) {
        if (mobile == null || mobile.isBlank()) return;
        String to = mobile.length() == 10 ? cfg.getCountryCode() + mobile : mobile.replace("+", "");
        if (!cfg.isEnabled() || cfg.getAccessToken() == null || cfg.getAccessToken().isBlank()) {
            log(userId, to, template, "SKIPPED", "whatsapp disabled", null);
            return;
        }
        try {
            Map<String, Object> body = Map.of(
                    "messaging_product", "whatsapp",
                    "to", to,
                    "type", "template",
                    "template", Map.of(
                            "name", template,
                            "language", Map.of("code", cfg.getLanguageCode()),
                            "components", List.of(Map.of("type", "body", "parameters",
                                    params.stream().map(p -> Map.of("type", "text", "text", p)).toList()))));
            JsonNode res = client.post().uri("/{phoneId}/messages", cfg.getPhoneNumberId())
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + cfg.getAccessToken())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body).retrieve().body(JsonNode.class);
            String messageId = res == null ? null : res.path("messages").path(0).path("id").asText(null);
            log(userId, to, template, "SENT", null, messageId);
        } catch (Exception e) {
            log.warn("WhatsApp {} to {} failed: {}", template, to, e.getMessage());
            log(userId, to, template, "FAILED", e.getMessage(), null);
        }
    }

    private void log(UUID userId, String to, String template, String status, String error, String messageId) {
        jdbc.update("""
                INSERT INTO delivery_logs (user_id, channel, template, recipient, status, error, provider_message_id)
                VALUES (?, 'WHATSAPP', ?, ?, ?, ?, ?)""", userId, template, to, status,
                error == null ? null : error.substring(0, Math.min(error.length(), 500)), messageId);
    }
}
