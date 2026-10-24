package com.theunoia.payment.gateway;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.theunoia.payment.config.PaymentProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Map;

@Configuration
public class GatewayConfig {

    @Bean
    public MockGateway mockGateway() {
        return new MockGateway();
    }

    /** Active checkout provider plus a registry so webhooks of every provider can be verified. */
    @Bean
    public GatewayRegistry gatewayRegistry(PaymentProperties props, ObjectMapper mapper, MockGateway mock) {
        RazorpayGateway razorpay = props.getRazorpay().getKeyId() == null || props.getRazorpay().getKeyId().isBlank()
                ? null : new RazorpayGateway(props, mapper);
        CashfreeGateway cashfree = props.getCashfree().getClientId() == null || props.getCashfree().getClientId().isBlank()
                ? null : new CashfreeGateway(props, mapper);

        PaymentGateway active = switch (props.getProvider().toLowerCase()) {
            case "razorpay" -> require(razorpay, "razorpay");
            case "cashfree" -> require(cashfree, "cashfree");
            default -> mock;
        };
        PayoutGateway payouts = "razorpayx".equalsIgnoreCase(props.getPayoutProvider()) ? require(razorpay, "razorpayx") : mock;

        Map<String, PaymentGateway> byName = new java.util.HashMap<>();
        byName.put("mock", mock);
        if (razorpay != null) byName.put("razorpay", razorpay);
        if (cashfree != null) byName.put("cashfree", cashfree);
        return new GatewayRegistry(active, payouts, byName);
    }

    private static <T> T require(T gateway, String name) {
        if (gateway == null) throw new IllegalStateException("Payment provider '" + name + "' selected but credentials are missing");
        return gateway;
    }

    public record GatewayRegistry(PaymentGateway active, PayoutGateway payouts, Map<String, PaymentGateway> byName) {

        public PaymentGateway byProvider(String provider) {
            PaymentGateway g = byName.get(provider.toLowerCase());
            if (g == null) throw new IllegalArgumentException("Unknown or unconfigured provider " + provider);
            return g;
        }
    }
}
