package com.theunoia.notification.web;

import com.theunoia.common.security.CurrentUser;
import com.theunoia.common.web.PageResponse;
import com.theunoia.notification.domain.NotificationEntities.CalendarEvent;
import com.theunoia.notification.domain.NotificationEntities.Campaign;
import com.theunoia.notification.domain.NotificationEntities.Notification;
import com.theunoia.notification.domain.NotificationEntities.UserContact;
import com.theunoia.notification.service.CalendarService;
import com.theunoia.notification.service.CampaignService;
import com.theunoia.notification.service.Notifier;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class NotificationController {

    private final Notifier notifier;
    private final CalendarService calendar;
    private final CampaignService campaigns;
    private final JdbcTemplate jdbc;

    public record PreferencesRequest(Boolean emailEnabled, Boolean whatsappEnabled, Boolean marketingOptIn) {
    }

    public record EventRequest(@NotBlank @Size(max = 200) String title, @Size(max = 5000) String description,
                               @Pattern(regexp = "MEETING|DEADLINE|PAYMENT_REMINDER") String type,
                               @NotNull @Future Instant startAt, Instant endAt, UUID projectId,
                               @Size(max = 1000) String meetingLink, @Min(0) @Max(10080) Integer remindMinutesBefore,
                               @Size(max = 50) Set<UUID> attendees) {
    }

    public record CampaignRequest(@NotBlank @Size(max = 150) String name, @NotBlank @Size(max = 80) String templateName,
                                  @NotBlank @Pattern(regexp = "ALL|FREELANCER|CLIENT") String audience,
                                  @NotBlank @Size(max = 1000) String message) {
    }

    // ------------------------------------------------------------------ in-app notifications

    @GetMapping("/api/v1/notifications")
    public PageResponse<Notification> list(@RequestParam(defaultValue = "false") boolean unreadOnly,
                                           @RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "20") int size) {
        return notifier.list(CurrentUser.require().id(), unreadOnly, page, size);
    }

    @GetMapping("/api/v1/notifications/unread-count")
    public Map<String, Long> unread() {
        return Map.of("unread", notifier.unread(CurrentUser.require().id()));
    }

    @PostMapping("/api/v1/notifications/{id}/read")
    public Notification read(@PathVariable UUID id) {
        return notifier.markRead(CurrentUser.require().id(), id);
    }

    @PostMapping("/api/v1/notifications/read-all")
    public Map<String, Integer> readAll() {
        return Map.of("updated", notifier.markAllRead(CurrentUser.require().id()));
    }

    @GetMapping("/api/v1/notifications/preferences")
    public UserContact preferences() {
        return notifier.preferences(CurrentUser.require().id());
    }

    @PutMapping("/api/v1/notifications/preferences")
    public UserContact updatePreferences(@RequestBody PreferencesRequest req) {
        return notifier.updatePreferences(CurrentUser.require().id(), req.emailEnabled(), req.whatsappEnabled(), req.marketingOptIn());
    }

    // ------------------------------------------------------------------ calendar

    @GetMapping("/api/v1/calendar/events")
    public List<CalendarEvent> events(@RequestParam(required = false) Instant from, @RequestParam(required = false) Instant to) {
        return calendar.list(CurrentUser.require().id(), from, to);
    }

    @GetMapping("/api/v1/calendar/events/upcoming")
    public List<CalendarEvent> upcoming() {
        return calendar.upcoming(CurrentUser.require().id());
    }

    @PostMapping("/api/v1/calendar/events")
    @ResponseStatus(HttpStatus.CREATED)
    public CalendarEvent create(@Valid @RequestBody EventRequest req) {
        return calendar.create(CurrentUser.require().id(), command(req));
    }

    @PutMapping("/api/v1/calendar/events/{id}")
    public CalendarEvent update(@PathVariable UUID id, @Valid @RequestBody EventRequest req) {
        return calendar.update(CurrentUser.require().id(), id, command(req));
    }

    @DeleteMapping("/api/v1/calendar/events/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        calendar.delete(CurrentUser.require().id(), id);
    }

    @GetMapping("/api/v1/calendar/google/connect")
    public Map<String, Object> connectGoogle() {
        UUID me = CurrentUser.require().id();
        return Map.of("authorizationUrl", calendar.connectUrl(me), "connected", calendar.isConnected(me));
    }

    @GetMapping("/api/v1/calendar/google/callback")
    public ResponseEntity<Void> googleCallback(@RequestParam String code, @RequestParam String state) {
        String redirect = calendar.handleCallback(code, state);
        return ResponseEntity.status(HttpStatus.FOUND).header(HttpHeaders.LOCATION, URI.create(redirect).toString()).build();
    }

    @DeleteMapping("/api/v1/calendar/google")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void disconnectGoogle() {
        calendar.disconnect(CurrentUser.require().id());
    }

    // ------------------------------------------------------------------ admin

    @PostMapping("/api/v1/admin/notifications/campaigns")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public Campaign campaign(@Valid @RequestBody CampaignRequest req) {
        return campaigns.send(CurrentUser.require().id(), req.name(), req.templateName(), req.audience(), req.message());
    }

    @GetMapping("/api/v1/admin/notifications/campaigns")
    @PreAuthorize("hasRole('ADMIN')")
    public List<Campaign> campaigns() {
        return campaigns.list();
    }

    @GetMapping("/api/v1/admin/notifications/delivery-logs")
    @PreAuthorize("hasRole('ADMIN')")
    public List<Map<String, Object>> deliveryLogs(@RequestParam(required = false) String channel,
                                                  @RequestParam(defaultValue = "100") int limit) {
        return channel == null
                ? jdbc.queryForList("SELECT * FROM delivery_logs ORDER BY created_at DESC LIMIT ?", Math.min(limit, 500))
                : jdbc.queryForList("SELECT * FROM delivery_logs WHERE channel = ? ORDER BY created_at DESC LIMIT ?", channel, Math.min(limit, 500));
    }

    private static CalendarService.EventCommand command(EventRequest r) {
        return new CalendarService.EventCommand(r.title(), r.description(), r.type(), r.startAt(), r.endAt(), r.projectId(),
                r.meetingLink(), r.remindMinutesBefore(), r.attendees());
    }
}
