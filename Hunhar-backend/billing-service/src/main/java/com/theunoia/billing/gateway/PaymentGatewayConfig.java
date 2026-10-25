package com.theunoia.billing.gateway;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Configuration
public class PaymentGatewayConfig {

    @Bean
    public PaymentGateway paymentGateway(
            @Value("${theunoia.gateway.razorpay.key-id:}") String keyId,
            @Value("${theunoia.gateway.razorpay.key-secret:}") String keySecret,
            @Value("${theunoia.gateway.razorpay.webhook-secret:}") String webhookSecret,
            @Value("${theunoia.payments.allow-mock:true}") boolean allowMock
    ) {
        boolean configured = keyId != null && keyId.startsWith("rzp_") && !keyId.contains("placeholder")
                && keySecret != null && !keySecret.isBlank() && !keySecret.contains("placeholder");
        if (configured) {
            log.info("Payments: Razorpay gateway enabled ({} mode)", keyId.startsWith("rzp_live_") ? "LIVE" : "TEST");
            return new RazorpayPaymentGateway(keyId, keySecret, webhookSecret);
        }
        if (!allowMock) {
            throw new IllegalStateException("RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET must be set when theunoia.payments.allow-mock=false");
        }
        log.warn("Payments: no Razorpay keys configured - using SIMULATED payments. Do not use this in production.");
        return new MockPaymentGateway();
    }
}
