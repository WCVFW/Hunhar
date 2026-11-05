package com.theunoia.project.service;

import com.theunoia.common.exception.ApiException;
import com.theunoia.common.internal.InternalClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;

import java.util.Map;
import java.util.UUID;

@Component
@Slf4j
@RequiredArgsConstructor
public class CreditClient {

    private final InternalClient internalClient;

    /**
     * Deducts the admin-configured "credits per proposal" (billing-service reads the live setting).
     * @return true when the credits were deducted, false when the freelancer does not have enough.
     * @throws ApiException when billing-service cannot be reached (the bid must not go through for free).
     */
    public boolean consumeCreditsForBid(UUID freelancerId, UUID projectId) {
        Map<String, Object> body = Map.of(
                "freelancerId", freelancerId.toString(),
                "projectId", projectId.toString()
        );
        try {
            Map<String, Object> res = internalClient.post(internalClient.billing() + "/internal/credits/consume", body,
                    new ParameterizedTypeReference<Map<String, Object>>() {});
            return res != null && Boolean.TRUE.equals(res.get("consumed"));
        } catch (HttpClientErrorException e) {
            log.warn("Credit deduction rejected for {}: {}", freelancerId, e.getStatusCode());
            return false;
        } catch (Exception e) {
            log.error("Billing service unavailable while deducting credits: {}", e.getMessage());
            throw new ApiException("Credits service is temporarily unavailable. Please try again in a minute.",
                    HttpStatus.SERVICE_UNAVAILABLE);
        }
    }
}
