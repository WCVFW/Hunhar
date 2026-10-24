package com.theunoia.common.web;

import com.theunoia.common.exception.ApiException;
import com.theunoia.common.security.InternalTokenFilter;
import com.theunoia.common.security.SecurityProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StreamUtils;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;

/**
 * Builds RestClients for synchronous service-to-service calls (inside the cluster, never via
 * the gateway). Calls carry the internal token; 4xx responses from the peer are surfaced as
 * {@link ApiException}s with the same status so business errors propagate to the caller.
 */
@Component
@RequiredArgsConstructor
public class InternalClientFactory {

    private final SecurityProperties securityProperties;

    public RestClient create(String baseUrl) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(3_000);
        factory.setReadTimeout(10_000);
        return RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .defaultHeader(InternalTokenFilter.HEADER, securityProperties.getInternalToken())
                .defaultStatusHandler(HttpStatusCode::isError, (request, response) -> {
                    String body = StreamUtils.copyToString(response.getBody(), StandardCharsets.UTF_8);
                    HttpStatus status = HttpStatus.resolve(response.getStatusCode().value());
                    if (status != null && status.is4xxClientError()) {
                        throw new ApiException(status, "UPSTREAM_REJECTED", extractMessage(body));
                    }
                    throw new ApiException(HttpStatus.BAD_GATEWAY, "UPSTREAM_ERROR",
                            "Dependent service failed: " + request.getURI().getPath());
                })
                .build();
    }

    private static String extractMessage(String body) {
        int idx = body.indexOf("\"message\":\"");
        if (idx < 0) return "Request rejected by dependent service";
        int start = idx + 11;
        int end = body.indexOf('"', start);
        return end > start ? body.substring(start, end) : "Request rejected by dependent service";
    }
}
