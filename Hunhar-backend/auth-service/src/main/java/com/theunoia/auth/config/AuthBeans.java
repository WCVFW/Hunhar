package com.theunoia.auth.config;

import com.theunoia.auth.domain.Role;
import com.theunoia.auth.domain.User;
import com.theunoia.auth.domain.UserStatus;
import com.theunoia.auth.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.util.Locale;

@Slf4j
@Configuration
public class AuthBeans {

    private final JdbcTemplate jdbcTemplate;

    public AuthBeans(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    /** Seeds the first platform administrator from ADMIN_EMAIL / ADMIN_PASSWORD (Kubernetes secret). */
    @Bean
    public ApplicationRunner adminSeeder(AuthProperties props, UserRepository users, PasswordEncoder encoder,
                                         TransactionTemplate tx) {
        return args -> {
            String email = props.getAdmin().getEmail();
            if (email == null || email.isBlank() || props.getAdmin().getPassword() == null) {
                log.info("No bootstrap admin configured");
                return;
            }
            String normalized = email.trim().toLowerCase(Locale.ROOT);
            tx.executeWithoutResult(s -> {
                if (users.existsByEmail(normalized)) return;
                User admin = new User();
                admin.setEmail(normalized);
                admin.setMobile(props.getAdmin().getMobile());
                admin.setPasswordHash(encoder.encode(props.getAdmin().getPassword()));
                admin.setRole(Role.ADMIN);
                admin.setDisplayName("Platform Admin");
                admin.setStatus(UserStatus.ACTIVE);
                admin.setEmailVerified(true);
                admin.setAadhaarVerified(true);
                admin.setApprovedAt(Instant.now());
                users.save(admin);
                log.info("Bootstrap admin {} created", normalized);
            });
        };
    }

    /** Nightly cleanup via the PL/pgSQL function defined in V1 migration. */
    @Scheduled(cron = "0 30 2 * * *")
    public void purgeExpiredTokens() {
        Integer removed = jdbcTemplate.queryForObject("SELECT purge_expired_auth_tokens()", Integer.class);
        log.info("Purged {} expired auth tokens", removed);
    }
}
