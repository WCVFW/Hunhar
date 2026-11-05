package com.theunoia.identity.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/** Logs which external integrations are configured (never the secret values). */
@Slf4j
@Component
public class IntegrationStatusLogger {

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Value("${spring.mail.username:}")
    private String mailUser;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Value("${theunoia.google.client-id:}")
    private String googleClientId;

    @EventListener(ApplicationReadyEvent.class)
    public void report() {
        if (mailUser.isBlank() || mailPassword.isBlank()) {
            log.warn("Email (SMTP): NOT configured - OTP codes are printed in this log instead of emailed. Set MAIL_USERNAME and MAIL_PASSWORD in .env.");
        } else {
            log.info("Email (SMTP): configured via {} as {}", mailHost, mask(mailUser));
        }
        if (googleClientId.isBlank()) {
            log.warn("Google sign-in: DISABLED - set GOOGLE_CLIENT_ID in .env (see docs/CREDENTIALS.md).");
        } else if (!googleClientId.endsWith(".apps.googleusercontent.com")) {
            log.error("Google sign-in: GOOGLE_CLIENT_ID does not look like a Web client id (should end with .apps.googleusercontent.com).");
        } else {
            log.info("Google sign-in: enabled (client {}...)", googleClientId.substring(0, Math.min(12, googleClientId.length())));
        }
    }

    private static String mask(String email) {
        int at = email.indexOf('@');
        return at > 2 ? email.substring(0, 2) + "***" + email.substring(at) : "***";
    }
}
