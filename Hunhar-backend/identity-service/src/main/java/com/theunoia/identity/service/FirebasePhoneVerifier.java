package com.theunoia.identity.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.theunoia.common.exception.BadRequestException;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwsHeader;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.LocatorAdapter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.security.PublicKey;
import java.security.cert.CertificateFactory;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Mobile OTP through Firebase Authentication (phone sign-in). The browser sends the SMS and checks the code with
 * Firebase, then hands us Firebase's ID token; this class verifies that token (Google's signing keys, issuer,
 * audience, expiry) and returns the verified phone number. No Firebase service account is needed.
 */
@Slf4j
@Service
public class FirebasePhoneVerifier {

    private static final String KEYS_URL =
            "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";
    private static final Pattern MAX_AGE = Pattern.compile("max-age=(\\d+)");

    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    private final ObjectMapper mapper = new ObjectMapper();

    private final String projectId;
    private final String apiKey;
    private final String authDomain;
    private final String appId;
    private final String provider;

    private volatile Map<String, PublicKey> keys = Map.of();
    private volatile Instant keysExpireAt = Instant.EPOCH;

    public FirebasePhoneVerifier(
            @Value("${theunoia.otp.mobile-provider:sms}") String provider,
            @Value("${theunoia.firebase.project-id:}") String projectId,
            @Value("${theunoia.firebase.api-key:}") String apiKey,
            @Value("${theunoia.firebase.auth-domain:}") String authDomain,
            @Value("${theunoia.firebase.app-id:}") String appId) {
        this.provider = provider == null ? "sms" : provider.trim().toLowerCase();
        this.projectId = projectId == null ? "" : projectId.trim();
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.authDomain = authDomain == null ? "" : authDomain.trim();
        this.appId = appId == null ? "" : appId.trim();
        if ("firebase".equals(this.provider) && !isConfigured()) {
            log.warn("MOBILE_OTP_PROVIDER=firebase but FIREBASE_PROJECT_ID / FIREBASE_API_KEY are missing - using SMS (Fast2SMS)");
        }
        log.info("Mobile OTP provider: {}", isEnabled() ? "Firebase (project " + this.projectId + ")" : "SMS (Fast2SMS)");
    }

    private boolean isConfigured() {
        return !projectId.isEmpty() && !apiKey.isEmpty();
    }

    /** True when the website should send mobile OTPs through Firebase instead of Fast2SMS. */
    public boolean isEnabled() {
        return "firebase".equals(provider) && isConfigured();
    }

    /** Public web config the browser needs to start Firebase (all of it is public by design). */
    public Map<String, Object> webConfig() {
        Map<String, Object> cfg = new HashMap<>();
        cfg.put("apiKey", apiKey);
        cfg.put("authDomain", authDomain.isEmpty() ? projectId + ".firebaseapp.com" : authDomain);
        cfg.put("projectId", projectId);
        cfg.put("appId", appId);
        return cfg;
    }

    /** Verifies a Firebase ID token from phone sign-in and returns its phone number (E.164, e.g. +919876543210). */
    public String verifyPhoneToken(String idToken) {
        if (!isEnabled()) throw new BadRequestException("Firebase mobile verification is not enabled.");
        if (idToken == null || idToken.isBlank() || idToken.length() > 4096) {
            throw new BadRequestException("Mobile verification failed. Please request a new code.");
        }
        Claims claims;
        try {
            claims = Jwts.parser()
                    .keyLocator(new LocatorAdapter<Key>() {
                        @Override
                        protected Key locate(JwsHeader header) {
                            if (!"RS256".equals(header.getAlgorithm())) throw new JwtException("Unexpected algorithm");
                            return keyFor(header.getKeyId());
                        }
                    })
                    .requireIssuer("https://securetoken.google.com/" + projectId)
                    .clockSkewSeconds(60)
                    .build()
                    .parseSignedClaims(idToken)
                    .getPayload();
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Firebase phone token rejected: {}", e.getMessage());
            throw new BadRequestException("Mobile verification failed or expired. Please request a new code.");
        }
        if (claims.getAudience() == null || !claims.getAudience().contains(projectId)
                || claims.getSubject() == null || claims.getSubject().isBlank()) {
            throw new BadRequestException("Mobile verification failed. Please request a new code.");
        }
        Object authTime = claims.get("auth_time");
        if (authTime instanceof Number n && Instant.ofEpochSecond(n.longValue()).isBefore(Instant.now().minus(Duration.ofMinutes(15)))) {
            throw new BadRequestException("Mobile verification expired. Please verify your number again.");
        }
        Object phone = claims.get("phone_number");
        if (!(phone instanceof String p) || p.isBlank()) {
            throw new BadRequestException("This verification has no phone number. Please verify your mobile number again.");
        }
        return p;
    }

    private PublicKey keyFor(String kid) {
        if (kid == null) throw new JwtException("Missing key id");
        PublicKey key = keys.get(kid);
        if (key == null || Instant.now().isAfter(keysExpireAt)) {
            refreshKeys();
            key = keys.get(kid);
        }
        if (key == null) throw new JwtException("Unknown key id");
        return key;
    }

    private synchronized void refreshKeys() {
        if (Instant.now().isBefore(keysExpireAt) && !keys.isEmpty()) return;
        try {
            HttpResponse<String> res = http.send(HttpRequest.newBuilder(URI.create(KEYS_URL)).timeout(Duration.ofSeconds(10)).GET().build(),
                    HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() != 200) throw new IllegalStateException("HTTP " + res.statusCode());
            Map<String, String> pems = mapper.readValue(res.body(), new TypeReference<Map<String, String>>() {});
            CertificateFactory cf = CertificateFactory.getInstance("X.509");
            Map<String, PublicKey> fresh = new HashMap<>();
            for (Map.Entry<String, String> e : pems.entrySet()) {
                fresh.put(e.getKey(), cf.generateCertificate(new ByteArrayInputStream(e.getValue().getBytes(StandardCharsets.US_ASCII))).getPublicKey());
            }
            long maxAge = 3600;
            Matcher m = MAX_AGE.matcher(res.headers().firstValue("Cache-Control").orElse(""));
            if (m.find()) maxAge = Long.parseLong(m.group(1));
            keys = Map.copyOf(fresh);
            keysExpireAt = Instant.now().plusSeconds(Math.max(60, maxAge));
        } catch (Exception e) {
            log.warn("Could not load Firebase signing keys: {}", e.getMessage());
            throw new JwtException("Signing keys unavailable");
        }
    }
}
