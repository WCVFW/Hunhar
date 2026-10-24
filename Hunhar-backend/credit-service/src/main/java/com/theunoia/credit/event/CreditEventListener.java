package com.theunoia.credit.event;

import com.theunoia.common.event.EventData;
import com.theunoia.common.event.EventEnvelope;
import com.theunoia.common.event.IdempotencyGuard;
import com.theunoia.credit.service.CreditService;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class CreditEventListener {

    private final IdempotencyGuard guard;
    private final CreditService credits;

    @Transactional
    @RabbitListener(queues = "${spring.application.name}.events")
    public void on(EventEnvelope event) {
        if (!guard.firstDelivery(event)) return;
        EventData d = EventData.of(event);
        switch (event.type()) {
            case "user.registered" -> {
                if ("FREELANCER".equals(d.str("role"))) credits.grantStarterCredits(d.uuid("userId"));
            }
            case "payment.captured" -> {
                if ("CREDIT_PURCHASE".equals(d.str("purpose"))) credits.completePurchase(d.uuid("referenceId"), d.uuid("orderId"));
            }
            case "payment.failed" -> {
                if ("CREDIT_PURCHASE".equals(d.str("purpose"))) credits.failPurchase(d.uuid("referenceId"));
            }
            case "bid.refund_requested" -> credits.refundBid(d.uuid("freelancerId"), d.integer("credits"),
                    "bid-cancel-refund:" + d.str("bidId"), "BID:" + d.str("bidId"), d.str("reason"));
            default -> {
            }
        }
    }
}
