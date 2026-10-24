package com.theunoia.notification.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.theunoia.common.exception.ApiException;
import com.theunoia.notification.config.NotificationProperties;
import com.theunoia.notification.domain.NotificationEntities.CalendarEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.HashMap;
import java.util.Map;

/** Google Calendar integration over OAuth 2.0 (offline access -> refresh token) and Calendar API v3. */
@Slf4j
@Component
public class GoogleCalendarClient {

    private static final String AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
    private static final String TOKEN_URL = "https://oauth2.googleapis.com/token";
    private static final String USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
    private static final String EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
    private static final String SCOPES = "openid email https://www.googleapis.com/auth/calendar.events";

    private final NotificationProperties.Google cfg;
    private final RestClient http = RestClient.create();

    public GoogleCalendarClient(NotificationProperties props) {
        this.cfg = props.getGoogle();
    }

    public boolean configured() {
        return cfg.getClientId() != null && !cfg.getClientId().isBlank();
    }

    public String authorizationUrl(String state) {
        if (!configured()) throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "GOOGLE_NOT_CONFIGURED", "Google Calendar is not configured");
        return UriComponentsBuilder.fromHttpUrl(AUTH_URL)
                .queryParam("client_id", cfg.getClientId())
                .queryParam("redirect_uri", cfg.getRedirectUri())
                .queryParam("response_type", "code")
                .queryParam("scope", SCOPES)
                .queryParam("access_type", "offline")
                .queryParam("prompt", "consent")
                .queryParam("state", state)
                .encode().toUriString();
    }

    public record Tokens(String accessToken, String refreshToken, String email) {
    }

    public Tokens exchangeCode(String code) {
        LinkedMultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("code", code);
        form.add("client_id", cfg.getClientId());
        form.add("client_secret", cfg.getClientSecret());
        form.add("redirect_uri", cfg.getRedirectUri());
        form.add("grant_type", "authorization_code");
        JsonNode token = http.post().uri(TOKEN_URL).contentType(MediaType.APPLICATION_FORM_URLENCODED).body(form)
                .retrieve().body(JsonNode.class);
        String access = token.path("access_token").asText();
        JsonNode info = http.get().uri(USERINFO_URL).header(HttpHeaders.AUTHORIZATION, "Bearer " + access)
                .retrieve().body(JsonNode.class);
        return new Tokens(access, token.path("refresh_token").asText(null), info == null ? null : info.path("email").asText(null));
    }

    /** Creates the event in the user's primary calendar; returns the Google event id (null on failure). */
    public String insertEvent(String refreshToken, CalendarEvent e) {
        try {
            String access = refresh(refreshToken);
            Map<String, Object> body = new HashMap<>();
            body.put("summary", e.getTitle());
            body.put("description", e.getDescription() == null ? "" : e.getDescription());
            body.put("start", Map.of("dateTime", e.getStartAt().toString()));
            body.put("end", Map.of("dateTime", (e.getEndAt() != null ? e.getEndAt() : e.getStartAt().plusSeconds(1800)).toString()));
            if (e.getMeetingLink() != null) body.put("location", e.getMeetingLink());
            body.put("reminders", Map.of("useDefault", true));
            JsonNode res = http.post().uri(EVENTS_URL).header(HttpHeaders.AUTHORIZATION, "Bearer " + access)
                    .contentType(MediaType.APPLICATION_JSON).body(body).retrieve().body(JsonNode.class);
            return res == null ? null : res.path("id").asText(null);
        } catch (Exception ex) {
            log.warn("Google Calendar sync failed for event {}: {}", e.getId(), ex.getMessage());
            return null;
        }
    }

    private String refresh(String refreshToken) {
        LinkedMultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("client_id", cfg.getClientId());
        form.add("client_secret", cfg.getClientSecret());
        form.add("refresh_token", refreshToken);
        form.add("grant_type", "refresh_token");
        JsonNode token = http.post().uri(TOKEN_URL).contentType(MediaType.APPLICATION_FORM_URLENCODED).body(form)
                .retrieve().body(JsonNode.class);
        return token.path("access_token").asText();
    }
}
