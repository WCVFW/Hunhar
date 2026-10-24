package com.theunoia.project.client;

import com.theunoia.common.web.InternalClientFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;
import java.util.UUID;

/** Synchronous call to credit-service: bidding must fail immediately if credits are insufficient. */
@Component
public class CreditClient {

    private final RestClient client;

    public CreditClient(InternalClientFactory factory, @Value("${theunoia.services.credit}") String baseUrl) {
        this.client = factory.create(baseUrl);
    }

    /** Idempotent: the same key never debits twice. Throws 422 INSUFFICIENT_CREDITS from credit-service. */
    public void debit(UUID userId, int amount, String idempotencyKey, String reference, String description) {
        client.post().uri("/internal/credits/debit")
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("userId", userId, "amount", amount, "idempotencyKey", idempotencyKey,
                        "reference", reference, "description", description))
                .retrieve().toBodilessEntity();
    }

    public void refund(UUID userId, int amount, String idempotencyKey, String reference, String description) {
        client.post().uri("/internal/credits/refund")
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("userId", userId, "amount", amount, "idempotencyKey", idempotencyKey,
                        "reference", reference, "description", description))
                .retrieve().toBodilessEntity();
    }
}
