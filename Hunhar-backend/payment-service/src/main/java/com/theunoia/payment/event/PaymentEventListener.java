package com.theunoia.payment.event;

import com.theunoia.common.event.EventData;
import com.theunoia.common.event.EventEnvelope;
import com.theunoia.common.event.IdempotencyGuard;
import com.theunoia.payment.service.EscrowService;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class PaymentEventListener {

    private final IdempotencyGuard guard;
    private final EscrowService escrow;

    @Transactional
    @RabbitListener(queues = "${spring.application.name}.events")
    public void on(EventEnvelope event) {
        if (!guard.firstDelivery(event)) return;
        EventData d = EventData.of(event);
        switch (event.type()) {
            case "milestone.approved" -> {
                if ("PLATFORM".equals(d.str("paymentMode"))) escrow.releaseForMilestone(d.uuid("milestoneId"));
            }
            case "dispute.resolved" -> escrow.settleDispute(d.uuid("milestoneId"), d.str("resolution"),
                    d.integer("freelancerSharePercent"), d.uuid("disputeId"));
            default -> {
            }
        }
    }
}
