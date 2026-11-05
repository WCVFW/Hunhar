package com.theunoia.identity.service;

import com.theunoia.common.exception.BadRequestException;
import com.theunoia.common.exception.UnauthorizedException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Map;
import java.util.Set;

/**
 * Verifies a Google Identity Services ID token with Google's tokeninfo endpoint
 * (Google checks the signature) and then checks audience, issuer, expiry and email verification here.
 */
@Slf4j
@Component
public class GoogleTokenVerifier {

    private static final Set<String> ISSUERS = Set.of("accounts.google.com", "https://accounts.google.com");

    private final RestTemplate restTemplate;

    @Value("${theunoia.google.client-id:}")
    private String clientId;

    public GoogleTokenVerifier() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(8000);
        this.restTemplate = new RestTemplate(factory);
    }

    public record GoogleUser(String sub, String email, String name, String picture) {}

    public boolean isConfigured() {
        return clientId != null && !clientId.isBlank();
    }

    public String getClientId() {
        return isConfigured() ? clientId : null;
    }

    /** Verifies an OAuth access token issued to our client id, then reads the profile from userinfo. */
    @SuppressWarnings("unchecked")
    public GoogleUser verifyAccessToken(String accessToken) {
        if (!isConfigured()) {
            throw new BadRequestException("Google sign-in is not configured on this server yet");
        }
        Map<String, Object> info;
        Map<String, Object> profile;
        try {
            info = restTemplate.getForObject(
                    "https://oauth2.googleapis.com/tokeninfo?access_token=" + URLEncoder.encode(accessToken, StandardCharsets.UTF_8),
                    Map.class);
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            profile = restTemplate.exchange("https://openidconnect.googleapis.com/v1/userinfo", HttpMethod.GET,
                    new HttpEntity<>(headers), Map.class).getBody();
        } catch (HttpClientErrorException e) {
            throw new UnauthorizedException("Google sign-in failed. Please try again.");
        } catch (RestClientException e) {
            log.error("Google token endpoints unreachable: {}", e.getMessage());
            throw new BadRequestException("Could not reach Google. Please try again in a moment.");
        }
        if (info == null || profile == null) throw new UnauthorizedException("Google sign-in failed. Please try again.");

        // The token must have been issued to OUR client id, otherwise another site's token could be replayed here
        String aud = String.valueOf(info.getOrDefault("aud", info.get("azp")));
        long exp = Long.parseLong(String.valueOf(info.getOrDefault("exp", "0")));
        if (!clientId.equals(aud) || exp < Instant.now().getEpochSecond()) {
            throw new UnauthorizedException("Google sign-in failed. Please try again.");
        }
        String sub = String.valueOf(profile.get("sub"));
        if (!sub.equals(String.valueOf(info.get("sub")))) {
            throw new UnauthorizedException("Google sign-in failed. Please try again.");
        }
        if (!"true".equals(String.valueOf(profile.get("email_verified")))) {
            throw new UnauthorizedException("Your Google email address is not verified");
        }
        String email = String.valueOf(profile.get("email")).toLowerCase().trim();
        String name = profile.get("name") != null ? String.valueOf(profile.get("name")) : email.substring(0, email.indexOf('@'));
        String picture = profile.get("picture") != null ? String.valueOf(profile.get("picture")) : null;
        return new GoogleUser(sub, email, name, picture);
    }

    @SuppressWarnings("unchecked")
    public GoogleUser verify(String idToken) {
        if (!isConfigured()) {
            throw new BadRequestException("Google sign-in is not configured on this server yet");
        }
        Map<String, Object> info;
        try {
            info = restTemplate.getForObject(
                    "https://oauth2.googleapis.com/tokeninfo?id_token=" + URLEncoder.encode(idToken, StandardCharsets.UTF_8),
                    Map.class);
        } catch (HttpClientErrorException e) {
            throw new UnauthorizedException("Google sign-in failed. Please try again.");
        } catch (RestClientException e) {
            log.error("Google tokeninfo unreachable: {}", e.getMessage());
            throw new BadRequestException("Could not reach Google. Please try again in a moment.");
        }
        if (info == null) throw new UnauthorizedException("Google sign-in failed. Please try again.");

        String aud = String.valueOf(info.get("aud"));
        String iss = String.valueOf(info.get("iss"));
        long exp = Long.parseLong(String.valueOf(info.getOrDefault("exp", "0")));
        if (!clientId.equals(aud) || !ISSUERS.contains(iss) || exp < Instant.now().getEpochSecond()) {
            throw new UnauthorizedException("Google sign-in failed. Please try again.");
        }
        if (!"true".equals(String.valueOf(info.get("email_verified")))) {
            throw new UnauthorizedException("Your Google email address is not verified");
        }
        String email = String.valueOf(info.get("email")).toLowerCase().trim();
        String name = info.get("name") != null ? String.valueOf(info.get("name")) : email.substring(0, email.indexOf('@'));
        String picture = info.get("picture") != null ? String.valueOf(info.get("picture")) : null;
        return new GoogleUser(String.valueOf(info.get("sub")), email, name, picture);
    }
}
