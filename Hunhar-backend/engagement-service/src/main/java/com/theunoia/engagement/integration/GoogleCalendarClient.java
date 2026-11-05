package com.theunoia.engagement.integration;

import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

/**
 * Builds a Google Calendar "add event" link. Opening it lets the user save the event into their own calendar,
 * so no Google OAuth consent or server-side token is needed.
 */
@Component
public class GoogleCalendarClient {

    private static final DateTimeFormatter GCAL_UTC = DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'").withZone(ZoneOffset.UTC);

    public String createCalendarEvent(String summary, String description, Instant startTime, Instant endTime) {
        return UriComponentsBuilder.fromHttpUrl("https://calendar.google.com/calendar/render")
                .queryParam("action", "TEMPLATE")
                .queryParam("text", summary == null || summary.isBlank() ? "Hunhar task" : summary.trim())
                .queryParam("details", description == null ? "" : description.trim())
                .queryParam("dates", GCAL_UTC.format(startTime) + "/" + GCAL_UTC.format(endTime))
                .encode()
                .toUriString();
    }
}
