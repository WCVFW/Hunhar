package com.theunoia.common.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

@Component
public class JwtUtils {

    // Default 256-bit dev secret; set JWT_SECRET in Hunhar-backend/.env or the environment in production
    private static final String DEFAULT_SECRET = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
    private final SecretKey key;
    private final long expirationMinutes = 1440; // 24 hours

    /** Reads JWT_SECRET from Spring's environment (OS env vars and the imported .env), like the gateway does. */
    public JwtUtils(@Value("${JWT_SECRET:${theunoia.jwt.secret:" + DEFAULT_SECRET + "}}") String secret) {
        if (secret == null || secret.length() < 32) {
            secret = DEFAULT_SECRET;
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(UUID userId, String email, String role, String status) {
        Instant now = Instant.now();
        Instant expiry = now.plus(expirationMinutes, ChronoUnit.MINUTES);

        return Jwts.builder()
                .subject(userId.toString())
                .claim("email", email)
                .claim("role", role)
                .claim("status", status)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(key)
                .compact();
    }

    public String generateRefreshToken(UUID userId) {
        Instant now = Instant.now();
        Instant expiry = now.plus(30, ChronoUnit.DAYS);

        return Jwts.builder()
                .subject(userId.toString())
                .claim("type", "REFRESH")
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(key)
                .compact();
    }

    public Claims validateAndGetClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean validateToken(String token) {
        try {
            validateAndGetClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
