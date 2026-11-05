package com.theunoia.engagement.integration;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * Sends approved WhatsApp template messages through the Meta WhatsApp Cloud API.
 * Without WHATSAPP_PHONE_ID / WHATSAPP_ACCESS_TOKEN it only logs and reports "not sent".
 */
@Component
@Slf4j
public class WhatsAppSender {

    private final String phoneNumberId;
    private final String accessToken;
    private final String language;
    private final RestClient http;

    public WhatsAppSender(@Value("${theunoia.whatsapp.phone-number-id:}") String phoneNumberId,
                          @Value("${theunoia.whatsapp.access-token:}") String accessToken,
                          @Value("${theunoia.whatsapp.language:en}") String language,
                          @Value("${theunoia.whatsapp.api-url:https://graph.facebook.com/v20.0}") String apiUrl) {
        this.phoneNumberId = phoneNumberId == null ? "" : phoneNumberId.trim();
        this.accessToken = accessToken == null ? "" : accessToken.trim();
        this.language = language;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(10000);
        this.http = RestClient.builder().baseUrl(apiUrl).requestFactory(factory).build();
    }

    public boolean isConfigured() {
        return !phoneNumberId.isEmpty() && !accessToken.isEmpty();
    }

    /** @return true when Meta accepted the message. Template params are sent in insertion order as body variables. */
    public boolean sendTemplateNotification(String toMobile, String templateName, Map<String, String> params) {
        if (!isConfigured()) {
            log.info("WhatsApp not configured; skipped template '{}' to {}", templateName, mask(toMobile));
            return false;
        }
        String to = toMobile.replaceAll("[^0-9]", "");
        if (to.length() == 10) to = "91" + to; // Indian numbers without country code
        List<Map<String, String>> bodyParams = (params == null ? Map.<String, String>of() : params).values().stream()
                .map(v -> Map.of("type", "text", "text", v == null ? "" : v))
                .toList();
        Map<String, Object> template = new java.util.LinkedHashMap<>();
        template.put("name", templateName);
        template.put("language", Map.of("code", language));
        if (!bodyParams.isEmpty()) template.put("components", List.of(Map.of("type", "body", "parameters", bodyParams)));
        Map<String, Object> body = Map.of(
                "messaging_product", "whatsapp",
                "to", to,
                "type", "template",
                "template", template);
        try {
            http.post()
                    .uri("/{phoneId}/messages", phoneNumberId)
                    .header("Authorization", "Bearer " + accessToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();
            log.info("WhatsApp template '{}' sent to {}", templateName, mask(to));
            return true;
        } catch (Exception e) {
            log.warn("WhatsApp template '{}' to {} failed: {}", templateName, mask(to), e.getMessage());
            return false;
        }
    }

    private static String mask(String mobile) {
        if (mobile == null || mobile.length() < 4) return "****";
        return "******" + mobile.substring(mobile.length() - 4);
    }
}
