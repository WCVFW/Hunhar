package com.theunoia.auth.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;
import java.util.List;

@Getter
@Setter
@ConfigurationProperties(prefix = "theunoia.auth")
public class AuthProperties {

    private String jwtSecret;
    private Duration accessTokenTtl = Duration.ofMinutes(15);
    private Duration refreshTokenTtl = Duration.ofDays(30);
    private Duration emailTokenTtl = Duration.ofHours(24);
    private Duration passwordResetTtl = Duration.ofMinutes(30);
    private int maxFailedLogins = 5;
    private Duration lockDuration = Duration.ofMinutes(15);
    private String frontendUrl = "http://localhost:3000";
    /** Roles that must complete Aadhaar verification before admin approval. */
    private List<String> kycRequiredRoles = List.of("FREELANCER", "CLIENT");

    private Admin admin = new Admin();
    private Kyc kyc = new Kyc();

    @Getter
    @Setter
    public static class Admin {
        private String email;
        private String password;
        private String mobile = "9999999999";
    }

    @Getter
    @Setter
    public static class Kyc {
        /** mock | cashfree */
        private String provider = "mock";
        private String cashfreeBaseUrl = "https://sandbox.cashfree.com/verification";
        private String cashfreeClientId;
        private String cashfreeClientSecret;
        private String redirectUrl = "http://localhost:3000/kyc/callback";
    }
}
