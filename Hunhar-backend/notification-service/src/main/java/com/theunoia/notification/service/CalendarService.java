package com.theunoia.notification.service;

import com.theunoia.common.exception.ApiException;
import com.theunoia.common.security.SecurityProperties;
import com.theunoia.common.util.CryptoUtil;
import com.theunoia.notification.config.NotificationProperties;
import com.theunoia.notification.domain.NotificationEntities.CalendarEvent;
import com.theunoia.notification.domain.NotificationEntities.GoogleConnection;
import com.theunoia.notification.repository.NotificationRepositories.CalendarEventRepository;
import com.theunoia.notification.repository.NotificationRepositories.GoogleConnectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

/** Calendar: meetings, deadlines and payment reminders, optionally mirrored to Google Calendar. */
@Service
@RequiredArgsConstructor
public class CalendarService {

    private final CalendarEventRepository events;
    private final GoogleConnectionRepository google;
    private final GoogleCalendarClient googleClient;
    private final NotificationProperties props;
    private final SecurityProperties security;

    public record EventCommand(String title, String description, String type, Instant startAt, Instant endAt,
                               UUID projectId, String meetingLink, Integer remindMinutesBefore, Collection<UUID> attendees) {
    }

    @Transactional
    public CalendarEvent create(UUID ownerId, EventCommand cmd) {
        CalendarEvent e = new CalendarEvent();
        e.setOwnerId(ownerId);
        apply(e, cmd);
        events.save(e);
        syncToGoogle(ownerId, e);
        return e;
    }

    @Transactional
    public CalendarEvent update(UUID ownerId, UUID id, EventCommand cmd) {
        CalendarEvent e = own(ownerId, id);
        apply(e, cmd);
        e.setReminderSentAt(null);
        return e;
    }

    @Transactional
    public void delete(UUID ownerId, UUID id) {
        events.delete(own(ownerId, id));
    }

    @Transactional(readOnly = true)
    public List<CalendarEvent> list(UUID userId, Instant from, Instant to) {
        Instant f = from == null ? Instant.now().minus(Duration.ofDays(30)) : from;
        Instant t = to == null ? f.plus(Duration.ofDays(90)) : to;
        return events.forUser(userId, f, t);
    }

    @Transactional(readOnly = true)
    public List<CalendarEvent> upcoming(UUID userId) {
        return events.forUser(userId, Instant.now(), Instant.now().plus(Duration.ofDays(14))).stream().limit(10).toList();
    }

    /** Auto-created deadline / payment reminder events (idempotent by source key). */
    @Transactional
    public void ensureSystemEvent(String sourceKey, UUID ownerId, String type, String title, String description,
                                  Instant at, UUID projectId, UUID milestoneId) {
        if (ownerId == null || at == null || events.findBySourceKey(sourceKey).isPresent()) return;
        CalendarEvent e = new CalendarEvent();
        e.setOwnerId(ownerId);
        e.setType(type);
        e.setTitle(title);
        e.setDescription(description);
        e.setStartAt(at);
        e.setProjectId(projectId);
        e.setMilestoneId(milestoneId);
        e.setSourceKey(sourceKey);
        Instant reminder = at.minus(Duration.ofDays(1));
        e.setReminderAt(reminder.isAfter(Instant.now()) ? reminder : Instant.now());
        events.save(e);
        syncToGoogle(ownerId, e);
    }

    // ------------------------------------------------------------------ Google OAuth

    public String connectUrl(UUID userId) {
        String payload = userId + "." + Instant.now().getEpochSecond();
        return googleClient.authorizationUrl(payload + "." + CryptoUtil.hmacSha256Hex(security.getInternalToken(), payload));
    }

    /** OAuth redirect target; the signed state proves which user started the flow. */
    @Transactional
    public String handleCallback(String code, String state) {
        String[] parts = state == null ? new String[0] : state.split("\\.");
        if (parts.length != 3) throw ApiException.badRequest("Invalid OAuth state");
        String payload = parts[0] + "." + parts[1];
        if (!CryptoUtil.safeEquals(CryptoUtil.hmacSha256Hex(security.getInternalToken(), payload), parts[2])
                || Instant.now().getEpochSecond() - Long.parseLong(parts[1]) > 900) {
            throw ApiException.badRequest("OAuth state expired or tampered");
        }
        UUID userId = UUID.fromString(parts[0]);
        GoogleCalendarClient.Tokens tokens = googleClient.exchangeCode(code);
        if (tokens.refreshToken() == null) throw ApiException.badRequest("Google did not return offline access");
        GoogleConnection c = google.findById(userId).orElseGet(GoogleConnection::new);
        c.setUserId(userId);
        c.setRefreshTokenEncrypted(CryptoUtil.encrypt(tokens.refreshToken(), props.getEncryptionKey()));
        c.setGoogleEmail(tokens.email());
        c.setConnectedAt(Instant.now());
        google.save(c);
        return props.getFrontendUrl() + "/settings/calendar?connected=true";
    }

    @Transactional
    public void disconnect(UUID userId) {
        google.deleteById(userId);
    }

    @Transactional(readOnly = true)
    public boolean isConnected(UUID userId) {
        return google.existsById(userId);
    }

    private void syncToGoogle(UUID userId, CalendarEvent e) {
        if (!googleClient.configured()) return;
        google.findById(userId).ifPresent(c -> e.setGoogleEventId(
                googleClient.insertEvent(CryptoUtil.decrypt(c.getRefreshTokenEncrypted(), props.getEncryptionKey()), e)));
    }

    private CalendarEvent own(UUID ownerId, UUID id) {
        CalendarEvent e = events.findById(id).orElseThrow(() -> ApiException.notFound("Calendar event"));
        if (!e.getOwnerId().equals(ownerId)) throw ApiException.forbidden("Not your event");
        return e;
    }

    private static void apply(CalendarEvent e, EventCommand cmd) {
        if (cmd.endAt() != null && cmd.endAt().isBefore(cmd.startAt())) throw ApiException.badRequest("endAt must be after startAt");
        e.setTitle(cmd.title());
        e.setDescription(cmd.description());
        e.setType(cmd.type() == null ? "MEETING" : cmd.type());
        e.setStartAt(cmd.startAt());
        e.setEndAt(cmd.endAt());
        e.setProjectId(cmd.projectId());
        e.setMeetingLink(cmd.meetingLink());
        int before = cmd.remindMinutesBefore() == null ? 30 : cmd.remindMinutesBefore();
        e.setReminderAt(cmd.startAt().minus(Duration.ofMinutes(before)));
        e.getAttendees().clear();
        if (cmd.attendees() != null) e.getAttendees().addAll(cmd.attendees());
    }
}
