package com.theunoia.identity.service;

import com.theunoia.common.exception.BadRequestException;
import com.theunoia.identity.domain.MobileOtp;
import com.theunoia.identity.repository.MobileOtpRepository;
import com.theunoia.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

/** Signup mobile verification by SMS OTP (same rules as email OTP, plus a daily SMS cap per number). */
@Service
@RequiredArgsConstructor
public class MobileOtpService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");

    private final MobileOtpRepository mobileOtpRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SmsService smsService;

    @Value("${theunoia.otp.expiry-minutes:10}")
    private int expiryMinutes;

    @Value("${theunoia.otp.resend-cooldown-seconds:30}")
    private int resendCooldownSeconds;

    @Value("${theunoia.otp.max-attempts:5}")
    private int maxAttempts;

    @Value("${theunoia.otp.verified-window-minutes:30}")
    private int verifiedWindowMinutes;

    @Value("${theunoia.otp.mobile-daily-limit:5}")
    private int dailyLimit;

    @Value("${theunoia.otp.mobile-required:true}")
    private boolean required;

    public boolean isRequired() {
        return required;
    }

    /** 10-digit Indian mobile number from "+91 98765 43210", "09876543210", etc. */
    public static String normalize(String raw) {
        String digits = raw == null ? "" : raw.replaceAll("[^0-9]", "");
        if (digits.length() == 12 && digits.startsWith("91")) digits = digits.substring(2);
        if (digits.length() == 11 && digits.startsWith("0")) digits = digits.substring(1);
        if (!digits.matches("^[6-9][0-9]{9}$")) {
            throw new BadRequestException("Enter a valid 10-digit Indian mobile number");
        }
        return digits;
    }

    @Transactional
    public String send(String rawMobile) {
        String mobile = normalize(rawMobile);
        if (userRepository.existsByMobile(mobile)) {
            throw new BadRequestException("This mobile number is already registered. Please log in instead.");
        }
        Instant now = Instant.now();
        LocalDate today = LocalDate.now(IST);
        MobileOtp record = mobileOtpRepository.findByMobile(mobile).orElse(null);
        if (record != null && record.getLastSentAt().plusSeconds(resendCooldownSeconds).isAfter(now)) {
            long wait = Duration.between(now, record.getLastSentAt().plusSeconds(resendCooldownSeconds)).getSeconds() + 1;
            throw new BadRequestException("Please wait " + wait + " seconds before requesting a new code.");
        }
        int sentToday = record != null && today.equals(record.getSentOn()) ? record.getSentToday() : 0;
        if (sentToday >= dailyLimit) {
            throw new BadRequestException("Too many codes sent to this number today. Please try again tomorrow.");
        }

        String otp = String.format("%06d", RANDOM.nextInt(1_000_000));
        if (record == null) record = MobileOtp.builder().mobile(mobile).build();
        record.setOtpHash(passwordEncoder.encode(otp));
        record.setExpiresAt(now.plus(Duration.ofMinutes(expiryMinutes)));
        record.setLastSentAt(now);
        record.setAttempts(0);
        record.setVerified(false);
        record.setVerifiedAt(null);
        record.setSentOn(today);
        record.setSentToday(sentToday + 1);
        mobileOtpRepository.save(record);

        // Throws if Fast2SMS fails, rolling back so the user can retry immediately.
        smsService.sendOtp(mobile, otp);
        return mobile;
    }

    @Transactional(noRollbackFor = BadRequestException.class)
    public void verify(String rawMobile, String otp) {
        String mobile = normalize(rawMobile);
        if (otp == null || !otp.matches("^[0-9]{6}$")) {
            throw new BadRequestException("Enter the 6-digit code sent to your mobile");
        }
        MobileOtp record = mobileOtpRepository.findByMobile(mobile)
                .orElseThrow(() -> new BadRequestException("No code found for this number. Please request a new code."));
        if (record.isVerified()) return;
        if (record.getExpiresAt().isBefore(Instant.now())) {
            throw new BadRequestException("Verification code has expired. Please request a new code.");
        }
        if (record.getAttempts() >= maxAttempts) {
            throw new BadRequestException("Too many incorrect attempts. Please request a new code.");
        }
        if (!passwordEncoder.matches(otp, record.getOtpHash())) {
            record.setAttempts(record.getAttempts() + 1);
            mobileOtpRepository.save(record);
            int left = maxAttempts - record.getAttempts();
            throw new BadRequestException(left > 0
                    ? "Incorrect code. " + left + " attempt(s) left."
                    : "Too many incorrect attempts. Please request a new code.");
        }
        record.setVerified(true);
        record.setVerifiedAt(Instant.now());
        mobileOtpRepository.save(record);
    }

    /** Called during registration: the number must have been verified recently. The record is then removed. */
    @Transactional
    public void consumeVerifiedMobile(String rawMobile) {
        String mobile = normalize(rawMobile);
        MobileOtp record = mobileOtpRepository.findByMobile(mobile)
                .filter(MobileOtp::isVerified)
                .orElseThrow(() -> new BadRequestException("Please verify your mobile number with the SMS code before creating your account."));
        if (record.getVerifiedAt().plus(Duration.ofMinutes(verifiedWindowMinutes)).isBefore(Instant.now())) {
            throw new BadRequestException("Mobile verification expired. Please verify your number again.");
        }
        mobileOtpRepository.delete(record);
    }
}
