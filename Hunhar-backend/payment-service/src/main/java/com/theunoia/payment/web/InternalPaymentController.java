package com.theunoia.payment.web;

import com.theunoia.payment.domain.PaymentOrder;
import com.theunoia.payment.service.PaymentService;
import com.theunoia.payment.service.WalletService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/internal/payments")
@RequiredArgsConstructor
public class InternalPaymentController {

    private final PaymentService payments;
    private final WalletService wallets;

    public record InternalOrderRequest(@NotNull UUID userId, @NotNull PaymentOrder.Purpose purpose, @NotNull UUID referenceId,
                                       @NotNull @DecimalMin("1.00") BigDecimal amount, String description) {
    }

    /** credit-service: credit package checkout. */
    @PostMapping("/orders")
    public Map<String, Object> createOrder(@Valid @RequestBody InternalOrderRequest req) {
        return payments.createInternalOrder(req.userId(), req.purpose(), req.referenceId(), req.amount(), req.description());
    }

    /** analytics-service: revenue / commission / pending payments. */
    @GetMapping("/summary")
    public Map<String, Object> summary() {
        return wallets.platformSummary();
    }
}
