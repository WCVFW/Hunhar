package com.theunoia.notification.event;

import com.theunoia.common.event.EventData;
import com.theunoia.common.event.EventEnvelope;
import com.theunoia.common.event.IdempotencyGuard;
import com.theunoia.notification.channel.EmailSender;
import com.theunoia.notification.client.UserClient;
import com.theunoia.notification.config.NotificationProperties;
import com.theunoia.notification.service.CalendarService;
import com.theunoia.notification.service.ContactProjection;
import com.theunoia.notification.service.Notifier;
import com.theunoia.notification.service.Notifier.Spec;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;

/**
 * Translates domain events into user-facing notifications.
 * WhatsApp automation is used only for alerts and reminders (per product spec).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationEventListener {

    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");

    private final IdempotencyGuard guard;
    private final Notifier notifier;
    private final EmailSender email;
    private final ContactProjection contacts;
    private final CalendarService calendar;
    private final UserClient users;
    private final NotificationProperties props;

    @Transactional
    @RabbitListener(queues = "${spring.application.name}.events")
    public void on(EventEnvelope event) {
        if (!guard.firstDelivery(event)) return;
        EventData d = EventData.of(event);
        String app = props.getFrontendUrl();
        switch (event.type()) {
            // ------------------------------------------------------------ accounts
            case "user.registered" -> {
                contacts.upsert(d.uuid("userId"), d.str("email"), d.str("mobile"), d.str("displayName"), d.str("role"));
                notifier.notify(d.uuid("userId"), Spec.of("WELCOME", "Welcome to THEUNOiA!",
                        "Verify your email and complete Aadhaar verification to get approved."));
            }
            case "user.profile_updated" -> contacts.upsert(d.uuid("userId"), null, null, d.str("displayName"), null);
            case "auth.email_verification_requested" -> email.send(d.uuid("userId"), d.str("email"), "EMAIL_VERIFICATION",
                    "Verify your email address", "<p>Hi " + d.str("displayName") + ",</p><p>Please confirm your email address:</p>"
                            + button(d.str("verificationUrl"), "Verify email") + "<p>This link expires in 24 hours.</p>");
            case "auth.password_reset_requested" -> email.send(d.uuid("userId"), d.str("email"), "PASSWORD_RESET",
                    "Reset your password", "<p>Hi " + d.str("displayName") + ",</p><p>We received a request to reset your password.</p>"
                            + button(d.str("resetUrl"), "Reset password") + "<p>If you did not request this, ignore this email.</p>");
            case "user.kyc_verified" -> notifier.notify(d.uuid("userId"), Spec.of("VERIFICATION_COMPLETED",
                            "Aadhaar verification completed", "Your identity has been verified. Our team will review your profile shortly.")
                    .whatsapp("verification_completed", notifier.nameOf(d.uuid("userId"))));
            case "user.approved" -> notifier.notify(d.uuid("userId"), Spec.of("REGISTRATION_APPROVED",
                            "Your account is approved", "You can now start using THEUNOiA.")
                    .email("Your THEUNOiA account is approved", "<p>Great news! Your account has been approved.</p>" + button(app, "Open THEUNOiA"))
                    .whatsapp("registration_approved", notifier.nameOf(d.uuid("userId"))));
            case "user.rejected" -> notifier.notify(d.uuid("userId"), Spec.of("REGISTRATION_REJECTED",
                    "Registration not approved", d.str("reason"))
                    .email("Update on your THEUNOiA registration", "<p>Unfortunately your registration was not approved.</p><p>Reason: "
                            + d.str("reason") + "</p>"));
            case "user.suspended" -> notifier.notify(d.uuid("userId"), Spec.of("ACCOUNT_SUSPENDED", "Account suspended", d.str("reason"))
                    .email("Your THEUNOiA account has been suspended", "<p>Reason: " + d.str("reason") + "</p><p>Contact "
                            + props.getSupportEmail() + " for help.</p>"));

            // ------------------------------------------------------------ projects & bids
            case "project.published" -> {
                String title = d.str("title");
                for (UUID freelancer : users.matchingFreelancers(d.strings("skills"))) {
                    notifier.notify(freelancer, Spec.of("NEW_PROJECT_MATCH", "New project matches your skills", title)
                            .data("projectId", d.uuid("projectId"))
                            .whatsapp("new_project_match", notifier.nameOf(freelancer), title));
                }
            }
            case "bid.submitted" -> notifier.notify(d.uuid("clientId"), Spec.of("NEW_BID_RECEIVED",
                            "New proposal received", "A freelancer bid INR " + d.str("amount") + " on " + d.str("projectTitle"))
                    .data("projectId", d.uuid("projectId")).data("bidId", d.uuid("bidId"))
                    .whatsapp("new_bid_received", notifier.nameOf(d.uuid("clientId")), d.str("projectTitle")));
            case "bid.shortlisted" -> notifier.notify(d.uuid("freelancerId"), Spec.of("BID_SHORTLISTED",
                    "You were shortlisted", "Your proposal for " + d.str("projectTitle") + " was shortlisted.")
                    .data("projectId", d.uuid("projectId")));
            case "project.awarded" -> {
                UUID freelancer = d.uuid("freelancerId");
                notifier.notify(freelancer, Spec.of("PROJECT_AWARDED", "You won a project!", d.str("projectTitle"))
                        .data("projectId", d.uuid("projectId"))
                        .email("Project awarded: " + d.str("projectTitle"), "<p>Congratulations! Your proposal was accepted.</p>"
                                + button(app + "/workspace/" + d.str("projectId"), "Open workspace"))
                        .whatsapp("project_awarded", notifier.nameOf(freelancer), d.str("projectTitle")));
                LocalDate deadline = d.date("deadline");
                if (deadline != null) {
                    for (UUID u : new UUID[]{freelancer, d.uuid("clientId")}) {
                        calendar.ensureSystemEvent("project-deadline:" + d.str("projectId") + ":" + u, u, "DEADLINE",
                                "Deadline: " + d.str("projectTitle"), "Project delivery deadline",
                                deadline.atTime(18, 0).atZone(IST).toInstant(), d.uuid("projectId"), null);
                    }
                }
            }
            case "milestone.created" -> {
                LocalDate due = d.date("dueDate");
                if (due != null) {
                    calendar.ensureSystemEvent("milestone-deadline:" + d.str("milestoneId"), d.uuid("freelancerId"), "DEADLINE",
                            "Milestone due: " + d.str("title"), d.str("projectTitle"), due.atTime(18, 0).atZone(IST).toInstant(),
                            d.uuid("projectId"), d.uuid("milestoneId"));
                    if ("PLATFORM".equals(d.str("paymentMode"))) {
                        calendar.ensureSystemEvent("milestone-payment:" + d.str("milestoneId"), d.uuid("clientId"), "PAYMENT_REMINDER",
                                "Fund milestone: " + d.str("title"), "INR " + d.str("amount") + " for " + d.str("projectTitle"),
                                due.atTime(10, 0).atZone(IST).toInstant(), d.uuid("projectId"), d.uuid("milestoneId"));
                    }
                }
            }
            case "milestone.submitted" -> notifier.notify(d.uuid("clientId"), Spec.of("MILESTONE_SUBMITTED",
                    "Work submitted for review", d.str("title") + " - " + d.str("projectTitle")).data("milestoneId", d.uuid("milestoneId")));
            case "milestone.approved" -> notifier.notify(d.uuid("freelancerId"), Spec.of("MILESTONE_APPROVED",
                    "Milestone approved", d.str("title") + " - " + d.str("projectTitle")).data("milestoneId", d.uuid("milestoneId")));
            case "milestone.revision_requested" -> notifier.notify(d.uuid("freelancerId"), Spec.of("REVISION_REQUESTED",
                    "Revision requested", d.str("note")).data("milestoneId", d.uuid("milestoneId")));
            case "team.invited" -> notifier.notify(d.uuid("memberId"), Spec.of("TEAM_INVITATION",
                    "Collaboration invite", "You were invited to collaborate on " + d.str("projectTitle"))
                    .data("invitationId", d.uuid("invitationId")));
            case "dispute.raised", "dispute.resolved" -> {
                String title = event.type().endsWith("raised") ? "Dispute opened" : "Dispute resolved: " + d.str("resolution");
                for (UUID u : new UUID[]{d.uuid("clientId"), d.uuid("freelancerId")}) {
                    notifier.notify(u, Spec.of(event.type().toUpperCase().replace('.', '_'), title, d.str("projectTitle"))
                            .data("disputeId", d.uuid("disputeId")));
                }
            }
            case "review.created" -> notifier.notify(d.uuid("revieweeId"), Spec.of("REVIEW_RECEIVED",
                    "You received a " + d.str("rating") + "-star review", "").data("projectId", d.uuid("projectId")));

            // ------------------------------------------------------------ payments
            case "payment.captured" -> {
                if ("PROJECT_PAYMENT".equals(d.str("purpose"))) {
                    notifier.notify(d.uuid("freelancerId"), Spec.of("MILESTONE_FUNDED", "Milestone funded",
                            "INR " + d.str("amount") + " is secured in escrow. You can start working.").data("milestoneId", d.uuid("milestoneId")));
                }
            }
            case "escrow.released" -> notifier.notify(d.uuid("freelancerId"), Spec.of("PAYMENT_RECEIVED", "Payment received",
                            "INR " + d.str("netAmount") + " was added to your wallet.")
                    .whatsapp("payment_received", notifier.nameOf(d.uuid("freelancerId")), d.str("netAmount")));
            case "escrow.refunded" -> notifier.notify(d.uuid("clientId"), Spec.of("REFUND_PROCESSED", "Refund processed",
                    "INR " + d.str("amount") + " will be credited to your original payment method.")
                    .email("Refund processed", "<p>Your refund of INR " + d.str("amount") + " has been initiated.</p>"));
            case "withdrawal.completed" -> notifier.notify(d.uuid("userId"), Spec.of("WITHDRAWAL_COMPLETED", "Withdrawal completed",
                    "INR " + d.str("amount") + " has been sent to your account.")
                    .email("Withdrawal completed", "<p>INR " + d.str("amount") + " has been paid out.</p>"));
            case "withdrawal.failed", "withdrawal.rejected" -> notifier.notify(d.uuid("userId"), Spec.of("WITHDRAWAL_FAILED",
                    "Withdrawal not completed", d.str("reason") + " - funds returned to your wallet."));
            case "invoice.generated" -> notifier.notify(d.uuid("userId"), Spec.of("INVOICE", "Invoice " + d.str("invoiceNumber"),
                            "Total INR " + d.str("total"))
                    .data("invoiceId", d.uuid("invoiceId"))
                    .email("Invoice " + d.str("invoiceNumber"), "<p>Your invoice is ready.</p>"
                            + button(props.getApiBaseUrl() + d.str("downloadPath"), "Download PDF")));
            case "credits.purchased", "credits.allocated" -> notifier.notify(d.uuid("userId"), Spec.of("CREDITS_UPDATED",
                    "Credits updated", "Your credit balance is now " + d.str("balance")));

            // ------------------------------------------------------------ messaging & website
            case "message.sent" -> {
                for (String recipient : d.strings("recipientIds")) {
                    notifier.notify(UUID.fromString(recipient), Spec.of("NEW_MESSAGE", "New message", d.str("preview"))
                            .data("conversationId", d.uuid("conversationId")));
                }
            }
            case "contact.received" -> email.send(null, props.getSupportEmail(), "CONTACT_INQUIRY",
                    "New contact inquiry: " + d.str("subject"), "<p>From: " + d.str("name") + " (" + d.str("email") + ")</p><p>"
                            + d.str("message") + "</p>");
            default -> log.debug("No notification mapped for {}", event.type());
        }
    }

    private static String button(String url, String label) {
        return "<p><a href=\"" + url + "\" style=\"background:#4b2bd6;color:#fff;padding:10px 18px;border-radius:6px;"
                + "text-decoration:none;display:inline-block\">" + label + "</a></p>";
    }
}
