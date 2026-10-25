package com.theunoia.billing.web;

import com.theunoia.common.dto.ApiResponse;
import com.theunoia.billing.gateway.PaymentGateway;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/webhooks")
@RequiredArgsConstructor
@Slf4j
public class WebhookController {

    private final PaymentGateway paymentGateway;
    private final com.theunoia.billing.service.PaymentService paymentService;

    @PostMapping("/razorpay")
    public ResponseEntity<ApiResponse<String>> handleRazorpayWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature
    ) {
        log.info("Received Razorpay webhook event");
        paymentService.handleWebhook(payload, signature);
        return ResponseEntity.ok(ApiResponse.ok("Razorpay webhook processed", "ACK"));
    }

    @PostMapping("/cashfree")
    public ResponseEntity<ApiResponse<String>> handleCashfreeWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "X-Webhook-Signature", required = false) String signature
    ) {
        log.info("Received Cashfree webhook event");
        boolean valid = paymentGateway.verifyWebhook(payload, signature != null ? signature : "");
        if (valid) {
            return ResponseEntity.ok(ApiResponse.ok("Cashfree webhook processed", "ACK"));
        } else {
            return ResponseEntity.status(400).body(ApiResponse.error("Invalid signature"));
        }
    }
}
