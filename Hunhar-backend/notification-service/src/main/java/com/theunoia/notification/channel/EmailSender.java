package com.theunoia.notification.channel;

import com.theunoia.notification.config.NotificationProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

/** Email Service Provider via SMTP (SES / SendGrid / Mailgun SMTP relay; MailHog locally). */
@Slf4j
@Component
@RequiredArgsConstructor
public class EmailSender {

    private final JavaMailSender mailSender;
    private final NotificationProperties props;
    private final JdbcTemplate jdbc;

    public void send(UUID userId, String to, String template, String subject, String htmlBody) {
        if (to == null || to.isBlank()) return;
        if (!props.getEmail().isEnabled()) {
            log(userId, to, template, "SKIPPED", "email disabled");
            return;
        }
        try {
            var message = mailSender.createMimeMessage();
            var helper = new MimeMessageHelper(message, false, StandardCharsets.UTF_8.name());
            helper.setFrom(props.getEmail().getFrom());
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(wrap(subject, htmlBody), true);
            mailSender.send(message);
            log(userId, to, template, "SENT", null);
        } catch (Exception e) {
            log.warn("Email {} to {} failed: {}", template, to, e.getMessage());
            log(userId, to, template, "FAILED", e.getMessage());
        }
    }

    private void log(UUID userId, String to, String template, String status, String error) {
        jdbc.update("INSERT INTO delivery_logs (user_id, channel, template, recipient, status, error) VALUES (?, 'EMAIL', ?, ?, ?, ?)",
                userId, template, to, status, error == null ? null : error.substring(0, Math.min(error.length(), 500)));
    }

    private static String wrap(String title, String body) {
        return """
                <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;color:#222">
                  <h2 style="color:#4b2bd6;margin-top:0">THEUNOiA</h2>
                  <h3>%s</h3>
                  <div style="line-height:1.6">%s</div>
                  <hr style="border:none;border-top:1px solid #eee;margin-top:32px"/>
                  <p style="font-size:12px;color:#888">You receive this email because you have an account on THEUNOiA.</p>
                </div>""".formatted(title, body);
    }
}
