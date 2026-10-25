package com.theunoia.common.internal;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

/**
 * Service-to-service HTTP calls on /internal/** endpoints.
 * Those paths are never routed by the gateway and additionally require the shared internal key.
 */
@Slf4j
@Component
public class InternalClient {

    public static final String INTERNAL_KEY_HEADER = "X-Internal-Key";

    private final RestTemplate restTemplate;

    @Value("${theunoia.internal.key:hunhar-internal-dev-key-change-me}")
    private String internalKey;

    @Value("${theunoia.services.identity:${IDENTITY_SERVICE_URL:http://localhost:8081}}")
    private String identityUrl;

    @Value("${theunoia.services.project:${PROJECT_SERVICE_URL:http://localhost:8082}}")
    private String projectUrl;

    @Value("${theunoia.services.billing:${BILLING_SERVICE_URL:http://localhost:8083}}")
    private String billingUrl;

    @Value("${theunoia.services.engagement:${ENGAGEMENT_SERVICE_URL:http://localhost:8084}}")
    private String engagementUrl;

    public InternalClient() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(3000);
        factory.setReadTimeout(5000);
        this.restTemplate = new RestTemplate(factory);
    }

    public String identity() { return identityUrl; }
    public String project() { return projectUrl; }
    public String billing() { return billingUrl; }
    public String engagement() { return engagementUrl; }

    public <T> T post(String url, Object body, ParameterizedTypeReference<T> type) {
        return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(body, headers()), type).getBody();
    }

    public <T> T get(String url, ParameterizedTypeReference<T> type) {
        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers()), type).getBody();
    }

    private HttpHeaders headers() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set(INTERNAL_KEY_HEADER, internalKey);
        return headers;
    }

    public boolean isValidKey(String key) {
        return key != null && java.security.MessageDigest.isEqual(
                key.getBytes(java.nio.charset.StandardCharsets.UTF_8),
                internalKey.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }
}
