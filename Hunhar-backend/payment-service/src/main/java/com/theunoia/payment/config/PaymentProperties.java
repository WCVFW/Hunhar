package com.theunoia.payment.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.math.BigDecimal;

@Getter
@Setter
@ConfigurationProperties(prefix = "theunoia.payments")
public class PaymentProperties {

    /** mock | razorpay | cashfree */
    private String provider = "mock";
    /** mock | razorpayx */
    private String payoutProvider = "mock";
    /** Platform commission deducted before freelancer payout (0.10 = 10%). */
    private BigDecimal commissionRate = new BigDecimal("0.10");
    /** GST charged on the platform commission. */
    private BigDecimal gstRate = new BigDecimal("0.18");
    private BigDecimal minWithdrawal = new BigDecimal("500.00");
    /** AES-256 key (base64) for payout account numbers at rest. */
    private String encryptionKey;
    private String invoicePrefix = "TNU";
    private String companyName = "THEUNOiA Technologies Pvt. Ltd.";
    private String companyGstin = "";
    private String companyAddress = "India";

    private Razorpay razorpay = new Razorpay();
    private Cashfree cashfree = new Cashfree();

    @Getter
    @Setter
    public static class Razorpay {
        private String keyId;
        private String keySecret;
        private String webhookSecret;
        /** RazorpayX current account number used as payout source. */
        private String payoutAccountNumber;
        private String baseUrl = "https://api.razorpay.com/v1";
    }

    @Getter
    @Setter
    public static class Cashfree {
        private String clientId;
        private String clientSecret;
        private String baseUrl = "https://sandbox.cashfree.com/pg";
        private String apiVersion = "2023-08-01";
        private String defaultCustomerPhone = "9999999999";
    }
}
