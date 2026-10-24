package com.theunoia.analytics.event;

import com.theunoia.analytics.service.MetricsRepository;
import com.theunoia.common.event.EventData;
import com.theunoia.common.event.EventEnvelope;
import com.theunoia.common.event.IdempotencyGuard;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Projects every relevant domain event into the daily_metrics fact table. */
@Component
@RequiredArgsConstructor
public class AnalyticsEventListener {

    private final IdempotencyGuard guard;
    private final MetricsRepository metrics;

    @Transactional
    @RabbitListener(queues = "${spring.application.name}.events")
    public void on(EventEnvelope event) {
        if (!guard.firstDelivery(event)) return;
        EventData d = EventData.of(event);
        switch (event.type()) {
            case "user.registered" -> {
                metrics.increment("new_registrations", d.str("role"));
                metrics.touchUser(d.uuid("userId"), d.str("role"));
            }
            case "user.approved" -> metrics.increment("users_approved", d.str("role"));
            case "user.logged_in" -> {
                metrics.increment("logins", d.str("role"));
                metrics.touchUser(d.uuid("userId"), d.str("role"));
            }
            case "project.published" -> metrics.increment("projects_posted", "");
            case "project.awarded" -> {
                metrics.increment("projects_awarded", d.str("paymentMode"));
                metrics.record("awarded_value", d.str("paymentMode"), d.decimal("amount"));
            }
            case "project.completed" -> {
                metrics.increment("projects_completed", d.str("paymentMode"));
                metrics.record("completed_value", d.str("paymentMode"), d.decimal("totalAmount"));
            }
            case "project.cancelled" -> metrics.increment("projects_cancelled", d.str("previousStatus"));
            case "bid.submitted" -> metrics.increment("bids_submitted", "");
            case "payment.captured" -> {
                metrics.increment("payments_count", d.str("purpose"));
                metrics.record("payments_volume", d.str("purpose"), d.decimal("amount"));
            }
            case "escrow.released" -> {
                metrics.record("commission_revenue", "", d.decimal("commission"));
                metrics.record("gst_collected", "", d.decimal("gst"));
                metrics.record("freelancer_earnings", "", d.decimal("netAmount"));
            }
            case "escrow.refunded" -> metrics.record("refunds", "", d.decimal("amount"));
            case "credits.purchased" -> {
                metrics.record("credit_revenue", "", d.decimal("price"));
                metrics.record("credits_sold", "", d.decimal("credits"));
            }
            case "withdrawal.completed" -> metrics.record("withdrawals", "", d.decimal("amount"));
            case "dispute.raised" -> metrics.increment("disputes_raised", "");
            case "review.created" -> metrics.increment("reviews", d.str("revieweeRole"));
            case "lead.captured" -> metrics.increment("leads", d.str("type"));
            case "message.sent" -> metrics.increment("messages_sent", d.str("conversationType"));
            case "community.thread_created" -> metrics.increment("community_threads", d.str("type"));
            default -> {
            }
        }
    }
}
