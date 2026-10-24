package com.theunoia.notification.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "theunoia.notifications")
public class NotificationProperties {

    private String frontendUrl = "http://localhost:3000";
    private String apiBaseUrl = "http://localhost:8080";
    private String supportEmail = "support@theunoia.com";
    private Email email = new Email();
    private WhatsApp whatsapp = new WhatsApp();
    private Google google = new Google();
    /** AES-256 key (base64) for Google refresh tokens at rest. */
    private String encryptionKey;

    @Getter
    @Setter
    public static class Email {
        private boolean enabled = true;
        private String from = "THEUNOiA <no-reply@theunoia.com>";
    }

    /** WhatsApp Business (Meta Cloud API) - used only for alerts and reminders. */
    @Getter
    @Setter
    public static class WhatsApp {
        private boolean enabled = false;
        private String apiUrl = "https://graph.facebook.com/v20.0";
        private String phoneNumberId;
        private String accessToken;
        private String languageCode = "en";
        private String countryCode = "91";
    }

    @Getter
    @Setter
    public static class Google {
        private String clientId;
        private String clientSecret;
        private String redirectUri = "http://localhost:8080/api/v1/calendar/google/callback";
    }
}
