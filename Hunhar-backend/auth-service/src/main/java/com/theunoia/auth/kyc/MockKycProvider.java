package com.theunoia.auth.kyc;

import com.theunoia.auth.config.AuthProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.UUID;

/** Development provider: every verification succeeds on the first status poll. */
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "theunoia.auth.kyc.provider", havingValue = "mock", matchIfMissing = true)
public class MockKycProvider implements AadhaarKycProvider {

    private final AuthProperties props;

    @Override
    public String name() {
        return "MOCK";
    }

    @Override
    public InitResult initiate(UUID userId, String reference) {
        return new InitResult(reference, props.getKyc().getRedirectUrl() + "?verification_id=" + reference + "&mock=true");
    }

    @Override
    public StatusResult status(String reference) {
        return new StatusResult(Outcome.VERIFIED, "1234", "Mock Verified User", null);
    }
}
