package com.theunoia.engagement.integration;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
@Slf4j
public class GoogleCalendarClient {

    public String createCalendarEvent(String summary, String description, Instant startTime, Instant endTime) {
        log.info("Creating Google Calendar Event: '{}' from {} to {}", summary, startTime, endTime);
        return "https://calendar.google.com/calendar/event?eid=mock_event_" + Instant.now().getEpochSecond();
    }
}
