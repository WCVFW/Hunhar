package com.theunoia.notification.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Meeting / deadline / payment reminders (WhatsApp + in-app + email). Due rows are claimed with
 * FOR UPDATE SKIP LOCKED so several notification pods never send the same reminder twice.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ReminderScheduler {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a").withZone(ZoneId.of("Asia/Kolkata"));

    private final JdbcTemplate jdbc;
    private final TransactionTemplate tx;
    private final Notifier notifier;

    @Scheduled(fixedDelayString = "${theunoia.notifications.reminder-interval-ms:60000}", initialDelay = 15000)
    public void sendDueReminders() {
        try {
            Integer sent = tx.execute(status -> {
                List<Map<String, Object>> due = jdbc.queryForList("""
                        SELECT id, owner_id, title, type, start_at, meeting_link FROM calendar_events
                        WHERE reminder_sent_at IS NULL AND reminder_at IS NOT NULL AND reminder_at <= now()
                        ORDER BY reminder_at LIMIT 100 FOR UPDATE SKIP LOCKED""");
                for (Map<String, Object> row : due) {
                    UUID id = (UUID) row.get("id");
                    List<UUID> recipients = new ArrayList<>();
                    recipients.add((UUID) row.get("owner_id"));
                    recipients.addAll(jdbc.queryForList("SELECT user_id FROM calendar_attendees WHERE event_id = ?", UUID.class, id));
                    String when = FMT.format(((java.sql.Timestamp) row.get("start_at")).toInstant());
                    String title = (String) row.get("title");
                    String type = (String) row.get("type");
                    String template = switch (type) {
                        case "DEADLINE" -> "deadline_reminder";
                        case "PAYMENT_REMINDER" -> "payment_reminder";
                        default -> "meeting_reminder";
                    };
                    for (UUID user : recipients) {
                        notifier.notify(user, Notifier.Spec.of("REMINDER_" + type, "Reminder: " + title, "Scheduled for " + when)
                                .data("calendarEventId", id)
                                .email("Reminder: " + title, "<p>This is a reminder for <b>" + title + "</b> scheduled on " + when + ".</p>")
                                .whatsapp(template, notifier.nameOf(user), title, when));
                    }
                    jdbc.update("UPDATE calendar_events SET reminder_sent_at = now() WHERE id = ?", id);
                }
                return due.size();
            });
            if (sent != null && sent > 0) log.info("Sent {} calendar reminders", sent);
        } catch (Exception e) {
            log.warn("Reminder run failed: {}", e.getMessage());
        }
    }
}
