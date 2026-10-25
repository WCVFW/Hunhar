package com.theunoia.identity.service;

import com.theunoia.common.exception.BadRequestException;
import com.theunoia.identity.domain.EmailOtp;
import com.theunoia.identity.repository.EmailOtpRepository;
import com.theunoia.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;

@Service
@RequiredArgsConstructor
public class EmailOtpService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final EmailOtpRepository emailOtpRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Value("${theunoia.otp.expiry-minutes:10}")
    private int expiryMinutes;

    @Value("${theunoia.otp.resend-cooldown-seconds:30}")
    private int resendCooldownSeconds;

    @Value("${theunoia.otp.max-attempts:5}")
    private int maxAttempts;

    @Value("${theunoia.otp.verified-window-minutes:30}")
    private int verifiedWindowMinutes;

    @Transactional
    public void sendSignupOtp(String rawEmail) {
        String email = normalize(rawEmail);
        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("Email is already registered. Please log in instead.");
        }

        Instant now = Instant.now();
        EmailOtp record = emailOtpRepository.findByEmail(email).orElse(null);
        if (record != null && record.getLastSentAt().plusSeconds(resendCooldownSeconds).isAfter(now)) {
            long wait = Duration.between(now, record.getLastSentAt().plusSeconds(resendCooldownSeconds)).getSeconds() + 1;
            throw new BadRequestException("Please wait " + wait + " seconds before requesting a new code.");
        }

        String otp = String.format("%06d", RANDOM.nextInt(1_000_000));
        if (record == null) {
            record = EmailOtp.builder().email(email).build();
        }
        record.setOtpHash(passwordEncoder.encode(otp));
        record.setExpiresAt(now.plus(Duration.ofMinutes(expiryMinutes)));
        record.setLastSentAt(now);
        record.setAttempts(0);
        record.setVerified(false);
        record.setVerifiedAt(null);
        emailOtpRepository.save(record);

        // Throws if SMTP fails, rolling back the saved record so the user can retry immediately.
        emailService.sendSignupOtp(email, otp, expiryMinutes);
    }

    @Transactional(noRollbackFor = BadRequestException.class)
    public void verifySignupOtp(String rawEmail, String otp) {
        String email = normalize(rawEmail);
        EmailOtp record = emailOtpRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("No verification code found for this email. Please request a new code."));

        if (record.isVerified()) {
            return;
        }
        if (record.getExpiresAt().isBefore(Instant.now())) {
            throw new BadRequestException("Verification code has expired. Please request a new code.");
        }
        if (record.getAttempts() >= maxAttempts) {
            throw new BadRequestException("Too many incorrect attempts. Please request a new code.");
        }

        if (!passwordEncoder.matches(otp.trim(), record.getOtpHash())) {
            record.setAttempts(record.getAttempts() + 1);
            emailOtpRepository.save(record);
            int left = maxAttempts - record.getAttempts();
            throw new BadRequestException(left > 0
                    ? "Incorrect code. " + left + " attempt(s) left."
                    : "Too many incorrect attempts. Please request a new code.");
        }

        record.setVerified(true);
        record.setVerifiedAt(Instant.now());
        emailOtpRepository.save(record);
    }

    /**
     * Called during registration: the email must have been verified recently.
     * The record is removed so the verification cannot be reused.
     */
    @Transactional
    public void consumeVerifiedEmail(String rawEmail) {
        String email = normalize(rawEmail);
        EmailOtp record = emailOtpRepository.findByEmail(email)
                .filter(EmailOtp::isVerified)
                .orElseThrow(() -> new BadRequestException("Please verify your email with the OTP before creating your account."));

        if (record.getVerifiedAt().plus(Duration.ofMinutes(verifiedWindowMinutes)).isBefore(Instant.now())) {
            throw new BadRequestException("Email verification expired. Please verify your email again.");
        }
        emailOtpRepository.delete(record);
    }

    private String normalize(String email) {
        return email.toLowerCase().trim();
    }
}
