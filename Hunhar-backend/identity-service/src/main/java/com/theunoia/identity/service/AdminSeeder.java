package com.theunoia.identity.service;

import com.theunoia.identity.domain.KycStatus;
import com.theunoia.identity.domain.User;
import com.theunoia.identity.domain.UserRole;
import com.theunoia.identity.domain.UserStatus;
import com.theunoia.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Admins cannot sign up. On startup, if ADMIN_EMAIL and ADMIN_PASSWORD are set and that
 * account does not exist yet, it is created as the platform administrator.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdminSeeder {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${theunoia.admin.email:}")
    private String adminEmail;

    @Value("${theunoia.admin.password:}")
    private String adminPassword;

    @Value("${theunoia.admin.name:Hunhar Admin}")
    private String adminName;

    @EventListener(ApplicationReadyEvent.class)
    public void seedAdmin() {
        if (adminEmail == null || adminEmail.isBlank() || adminPassword == null || adminPassword.isBlank()) {
            if (!userRepository.existsByRole(UserRole.ADMIN)) {
                log.warn("No admin account exists. Set ADMIN_EMAIL and ADMIN_PASSWORD in .env and restart identity-service to create one.");
            }
            return;
        }
        String email = adminEmail.trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            return;
        }
        if (adminPassword.length() < 10) {
            log.error("ADMIN_PASSWORD must be at least 10 characters - admin account NOT created");
            return;
        }
        userRepository.save(User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(adminPassword))
                .fullName(adminName)
                .role(UserRole.ADMIN)
                .status(UserStatus.ACTIVE)
                .kycStatus(KycStatus.VERIFIED)
                .emailVerified(true)
                .build());
        log.info("Created admin account {}", email);
    }
}
