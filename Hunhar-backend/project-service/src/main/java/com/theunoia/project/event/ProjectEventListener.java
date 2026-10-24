package com.theunoia.project.event;

import com.theunoia.common.event.EventData;
import com.theunoia.common.event.EventEnvelope;
import com.theunoia.common.event.IdempotencyGuard;
import com.theunoia.project.service.WorkspaceService;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/** Payment outcomes drive milestone state (funded / paid / refunded). */
@Component
@RequiredArgsConstructor
public class ProjectEventListener {

    private final IdempotencyGuard guard;
    private final WorkspaceService workspace;

    @Transactional
    @RabbitListener(queues = "${spring.application.name}.events")
    public void on(EventEnvelope event) {
        if (!guard.firstDelivery(event)) return;
        EventData d = EventData.of(event);
        UUID milestoneId = d.uuid("milestoneId");
        if (milestoneId == null) return;
        switch (event.type()) {
            case "payment.captured" -> {
                if ("PROJECT_PAYMENT".equals(d.str("purpose"))) workspace.markFunded(milestoneId);
            }
            case "escrow.released" -> workspace.markPaid(milestoneId);
            case "escrow.refunded" -> workspace.markRefunded(milestoneId);
            default -> {
            }
        }
    }
}
