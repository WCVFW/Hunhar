package com.theunoia.identity.service;

import com.theunoia.common.exception.BadRequestException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${theunoia.mail.from:no-reply@hunhar.in}")
    private String fromAddress;

    @Value("${theunoia.mail.from-name:Hunhar}")
    private String fromName;

    public void sendSignupOtp(String to, String otp, int expiryMinutes) {
        // Local development without SMTP credentials: print the code so signup can still be tested.
        if (mailUsername == null || mailUsername.isBlank()) {
            log.warn("MAIL_USERNAME is not configured - OTP email NOT sent. OTP for {} is {}", to, otp);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress, fromName);
            helper.setTo(to);
            helper.setSubject(otp + " is your Hunhar verification code");
            helper.setText(plainText(otp, expiryMinutes), htmlBody(otp, expiryMinutes));
            mailSender.send(message);
            log.info("Signup OTP email sent to {}", to);
        } catch (MailException | jakarta.mail.MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("Failed to send OTP email to {}: {}", to, e.getMessage());
            throw new BadRequestException("Could not send verification email. Please check the email address and try again.");
        }
    }

    private String plainText(String otp, int expiryMinutes) {
        return "Your Hunhar verification code is " + otp + ".\n\n"
                + "This code expires in " + expiryMinutes + " minutes. "
                + "If you did not try to create a Hunhar account, you can ignore this email.";
    }

    private String htmlBody(String otp, int expiryMinutes) {
        return """
                <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0F1B3D">
                  <h2 style="margin:0 0 16px">Verify your email</h2>
                  <p style="margin:0 0 16px;font-size:14px">Use the code below to finish creating your Hunhar account.</p>
                  <div style="font-size:32px;font-weight:bold;letter-spacing:8px;background:#FFF7ED;border:1px solid #FED7AA;border-radius:8px;padding:16px;text-align:center;color:#C06B3E">%s</div>
                  <p style="margin:16px 0 0;font-size:13px;color:#64748B">This code expires in %d minutes. If you did not try to sign up, you can ignore this email.</p>
                </div>
                """.formatted(otp, expiryMinutes);
    }
}
