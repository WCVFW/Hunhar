package com.theunoia.user.event;

import com.theunoia.common.event.EventData;
import com.theunoia.common.event.EventEnvelope;
import com.theunoia.common.event.IdempotencyGuard;
import com.theunoia.user.repository.StatsRepository;
import com.theunoia.user.service.ProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/** Builds profiles from registrations and keeps ranking counters current from marketplace events. */
@Slf4j
@Component
@RequiredArgsConstructor
public class UserEventListener {

    private final IdempotencyGuard guard;
    private final ProfileService profiles;
    private final StatsRepository stats;

    @Transactional
    @RabbitListener(queues = "${spring.application.name}.events")
    public void on(EventEnvelope event) {
        if (!guard.firstDelivery(event)) return;
        EventData d = EventData.of(event);
        switch (event.type()) {
            case "user.registered" -> {
                UUID userId = d.uuid("userId");
                EventData profile = EventData.of(d.map("profile"));
                if ("FREELANCER".equals(d.str("role"))) {
                    profiles.provisionFreelancer(userId, profile.str("fullName"), profile.strings("skills"),
                            profile.strings("portfolioLinks"));
                } else if ("CLIENT".equals(d.str("role"))) {
                    profiles.provisionClient(userId, profile.str("companyName"), profile.str("contactPerson"));
                }
            }
            case "user.email_verified", "user.kyc_verified", "user.awaiting_approval", "user.approved", "user.rejected",
                 "user.suspended", "user.reactivated" -> {
                String status = d.str("status");
                if (status == null && "user.awaiting_approval".equals(event.type())) status = "PENDING_APPROVAL";
                if (status != null) profiles.updateVerificationStatus(d.uuid("userId"), status);
            }
            case "project.completed" -> withFreelancer(d, stats::projectCompleted);
            case "project.cancelled" -> withFreelancer(d, stats::projectCancelled);
            case "review.created" -> {
                if ("FREELANCER".equals(d.str("revieweeRole"))) {
                    stats.reviewReceived(d.uuid("revieweeId"), d.integer("rating"));
                }
            }
            case "escrow.released" -> stats.revenueEarned(d.uuid("freelancerId"), d.decimal("netAmount"));
            case "direct_payment.confirmed" -> stats.revenueEarned(d.uuid("freelancerId"), d.decimal("amount"));
            case "messaging.response_stats" -> stats.responseStats(d.uuid("userId"), d.integer("received"), d.integer("responded"));
            default -> log.debug("Ignoring event {}", event.type());
        }
    }

    private static void withFreelancer(EventData d, java.util.function.Consumer<UUID> action) {
        UUID freelancerId = d.uuid("freelancerId");
        if (freelancerId != null) action.accept(freelancerId);
    }
}
