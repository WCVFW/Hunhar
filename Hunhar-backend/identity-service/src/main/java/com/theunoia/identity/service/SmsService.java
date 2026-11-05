package com.theunoia.identity.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.theunoia.common.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Sends OTP SMS through Fast2SMS.
 *
 * Routes: "otp" (needs website verification in Fast2SMS > OTP Message), "q" Quick SMS (needs one
 * recharge of at least ₹100), or "auto" = try otp, then q. Fast2SMS's exact reason is logged on failure.
 */
@Slf4j
@Service
public class SmsService {

    /** Fast2SMS status codes that mean the account is not set up for that route (not a temporary error). */
    private static final int OTP_ROUTE_NOT_VERIFIED = 996;
    private static final int API_ROUTE_NEEDS_RECHARGE = 999;

    private final RestTemplate restTemplate;
    private final ObjectMapper mapper = new ObjectMapper();

    @Value("${theunoia.sms.fast2sms.url:https://www.fast2sms.com/dev/bulkV2}")
    private String apiUrl;

    @Value("${theunoia.sms.fast2sms.api-key:}")
    private String apiKey;

    @Value("${theunoia.sms.fast2sms.route:auto}")
    private String route;

    @Value("${theunoia.otp.expiry-minutes:10}")
    private int expiryMinutes;

    public SmsService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(10000);
        this.restTemplate = new RestTemplate(factory);
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    private record Result(boolean ok, int code, String message, String requestId) {}

    public void sendOtp(String mobile, String otp) {
        // Local development without an SMS key: print the code so signup can still be tested.
        if (!isConfigured()) {
            log.warn("FAST2SMS_API_KEY is not configured - SMS NOT sent. OTP for {} is {}", mask(mobile), otp);
            return;
        }

        String r = route == null ? "auto" : route.trim().toLowerCase();
        Result res;
        if ("q".equals(r)) {
            res = sendQuick(mobile, otp);
        } else {
            res = sendOtpRoute(mobile, otp);
            if (!res.ok() && "auto".equals(r) && res.code() == OTP_ROUTE_NOT_VERIFIED) {
                log.warn("Fast2SMS OTP route not enabled ({}); trying the Quick SMS route", res.message());
                res = sendQuick(mobile, otp);
            }
        }

        if (res.ok()) {
            log.info("OTP SMS sent to {} (request {})", mask(mobile), res.requestId());
            return;
        }
        log.error("Fast2SMS rejected SMS to {}: [{}] {}{}", mask(mobile), res.code(), res.message(), hint(res.code()));
        if (res.code() == OTP_ROUTE_NOT_VERIFIED || res.code() == API_ROUTE_NEEDS_RECHARGE || res.code() == 412 || res.code() == 413) {
            // Account / key problem: retrying will not help, so say so instead of "try again"
            throw new BadRequestException("SMS verification is temporarily unavailable. Please try again later or contact support.");
        }
        if (res.code() == 0) {
            throw new BadRequestException("Could not reach the SMS service. Please try again in a minute.");
        }
        throw new BadRequestException("Could not send the SMS to this number. Please check the number and try again.");
    }

    private Result sendOtpRoute(String mobile, String otp) {
        return post(Map.of("route", "otp", "variables_values", otp, "numbers", mobile, "flash", "0"));
    }

    private Result sendQuick(String mobile, String otp) {
        String text = "Your Hunhar verification code is " + otp + ". It is valid for " + expiryMinutes
                + " minutes. Do not share it with anyone.";
        return post(Map.of("route", "q", "message", text, "numbers", mobile, "flash", "0"));
    }

    private Result post(Map<String, Object> body) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("authorization", apiKey.trim());
        headers.setContentType(MediaType.APPLICATION_JSON);
        try {
            String raw = restTemplate.postForObject(apiUrl, new HttpEntity<>(body, headers), String.class);
            return parse(raw);
        } catch (HttpStatusCodeException e) {
            // Fast2SMS answers errors with HTTP 4xx and a JSON body that explains why
            Result r = parse(e.getResponseBodyAsString());
            return new Result(false, r.code() != 0 ? r.code() : e.getStatusCode().value(), r.message(), null);
        } catch (RestClientException e) {
            return new Result(false, 0, e.getMessage(), null);
        }
    }

    private Result parse(String raw) {
        try {
            JsonNode n = mapper.readTree(raw == null ? "{}" : raw);
            JsonNode msg = n.path("message");
            String message = msg.isArray() && !msg.isEmpty() ? msg.get(0).asText() : msg.asText("");
            return new Result(n.path("return").asBoolean(false), n.path("status_code").asInt(0), message, n.path("request_id").asText(null));
        } catch (Exception e) {
            return new Result(false, 0, "Unreadable response: " + (raw == null ? "" : raw.substring(0, Math.min(200, raw.length()))), null);
        }
    }

    private static String hint(int code) {
        return switch (code) {
            case OTP_ROUTE_NOT_VERIFIED -> " -> Fix: Fast2SMS dashboard > OTP Message > complete website verification (or set FAST2SMS_ROUTE=q).";
            case API_ROUTE_NEEDS_RECHARGE -> " -> Fix: recharge the Fast2SMS wallet with at least Rs 100 once to unlock the API.";
            case 412 -> " -> Fix: FAST2SMS_API_KEY is invalid; copy it again from Fast2SMS > Dev API.";
            default -> "";
        };
    }

    static String mask(String mobile) {
        return mobile.length() == 10 ? mobile.substring(0, 2) + "******" + mobile.substring(8) : "**********";
    }
}
