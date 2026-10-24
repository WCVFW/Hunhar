package com.theunoia.auth.kyc;

import com.fasterxml.jackson.databind.JsonNode;
import com.theunoia.auth.config.AuthProperties;
import com.theunoia.common.exception.ApiException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Cashfree Verification Suite - DigiLocker flow (DigiLocker lite, bundled with Cashfree).
 * <ol>
 *   <li>POST /digilocker -> consent URL where the user shares Aadhaar from DigiLocker</li>
 *   <li>GET /digilocker?verification_id= -> status (PENDING / AUTHENTICATED / EXPIRED ...)</li>
 *   <li>GET /digilocker/document/AADHAAR?verification_id= -> masked Aadhaar details</li>
 * </ol>
 * Only the last 4 digits and the name are persisted. Verify field names against the
 * current Cashfree API version before going live.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "theunoia.auth.kyc.provider", havingValue = "cashfree")
public class CashfreeDigilockerProvider implements AadhaarKycProvider {

    private final RestClient client;
    private final AuthProperties props;

    public CashfreeDigilockerProvider(AuthProperties props) {
        this.props = props;
        this.client = RestClient.builder()
                .baseUrl(props.getKyc().getCashfreeBaseUrl())
                .defaultHeader("x-client-id", props.getKyc().getCashfreeClientId())
                .defaultHeader("x-client-secret", props.getKyc().getCashfreeClientSecret())
                .build();
    }

    @Override
    public String name() {
        return "CASHFREE_DIGILOCKER";
    }

    @Override
    public InitResult initiate(UUID userId, String reference) {
        try {
            JsonNode res = client.post().uri("/digilocker")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "verification_id", reference,
                            "document_requested", List.of("AADHAAR"),
                            "redirect_url", props.getKyc().getRedirectUrl(),
                            "user_flow", "signup"))
                    .retrieve().body(JsonNode.class);
            return new InitResult(reference, res == null ? null : res.path("url").asText());
        } catch (RestClientException e) {
            log.error("Cashfree DigiLocker initiation failed: {}", e.getMessage());
            throw new ApiException(HttpStatus.BAD_GATEWAY, "KYC_PROVIDER_ERROR", "Unable to start Aadhaar verification, please retry");
        }
    }

    @Override
    public StatusResult status(String reference) {
        try {
            JsonNode res = client.get().uri(u -> u.path("/digilocker").queryParam("verification_id", reference).build())
                    .retrieve().body(JsonNode.class);
            String status = res == null ? "PENDING" : res.path("status").asText("PENDING");
            return switch (status) {
                case "AUTHENTICATED" -> fetchDocument(reference);
                case "EXPIRED" -> new StatusResult(Outcome.EXPIRED, null, null, "Consent link expired");
                case "CONSENT_DENIED", "FAILED" -> new StatusResult(Outcome.FAILED, null, null, "Consent denied or verification failed");
                default -> new StatusResult(Outcome.PENDING, null, null, null);
            };
        } catch (RestClientException e) {
            log.error("Cashfree DigiLocker status failed: {}", e.getMessage());
            throw new ApiException(HttpStatus.BAD_GATEWAY, "KYC_PROVIDER_ERROR", "Unable to fetch verification status");
        }
    }

    private StatusResult fetchDocument(String reference) {
        JsonNode doc = client.get()
                .uri(u -> u.path("/digilocker/document/AADHAAR").queryParam("verification_id", reference).build())
                .retrieve().body(JsonNode.class);
        String uid = doc == null ? "" : doc.path("uid").asText("");
        String last4 = uid.length() >= 4 ? uid.substring(uid.length() - 4) : null;
        return new StatusResult(Outcome.VERIFIED, last4, doc == null ? null : doc.path("name").asText(null), null);
    }
}
