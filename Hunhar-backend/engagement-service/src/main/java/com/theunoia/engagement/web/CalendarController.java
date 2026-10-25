package com.theunoia.engagement.web;

import com.theunoia.common.dto.ApiResponse;
import com.theunoia.common.exception.UnauthorizedException;
import com.theunoia.common.security.AuthUser;
import com.theunoia.common.security.CurrentUser;
import com.theunoia.engagement.domain.CalendarTask;
import com.theunoia.engagement.integration.GoogleCalendarClient;
import com.theunoia.engagement.service.CalendarTaskService;
import jakarta.validation.Valid;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/calendar")
@RequiredArgsConstructor
public class CalendarController {

    private final GoogleCalendarClient calendarClient;
    private final CalendarTaskService taskService;

    /** Dated tasks in [from, to); add includeUndated=true to also get undated to-dos. */
    @GetMapping("/tasks")
    public ResponseEntity<ApiResponse<List<CalendarTask>>> listTasks(
            @CurrentUser AuthUser user,
            @RequestParam Instant from,
            @RequestParam Instant to,
            @RequestParam(defaultValue = "false") boolean includeUndated) {
        return ResponseEntity.ok(ApiResponse.ok(taskService.list(requireUser(user).id(), from, to, includeUndated)));
    }

    @GetMapping("/todos")
    public ResponseEntity<ApiResponse<List<CalendarTask>>> listTodos(@CurrentUser AuthUser user) {
        return ResponseEntity.ok(ApiResponse.ok(taskService.todos(requireUser(user).id())));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<Map<String, Long>>> summary(@CurrentUser AuthUser user) {
        return ResponseEntity.ok(ApiResponse.ok(taskService.summary(requireUser(user).id())));
    }

    @PostMapping("/tasks")
    public ResponseEntity<ApiResponse<CalendarTask>> createTask(@CurrentUser AuthUser user, @Valid @RequestBody CalendarTaskService.TaskRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Task added", taskService.create(requireUser(user).id(), req)));
    }

    @PutMapping("/tasks/{id}")
    public ResponseEntity<ApiResponse<CalendarTask>> updateTask(@CurrentUser AuthUser user, @PathVariable UUID id,
                                                                @Valid @RequestBody CalendarTaskService.TaskRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Task updated", taskService.update(requireUser(user).id(), id, req)));
    }

    @PatchMapping("/tasks/{id}/status")
    public ResponseEntity<ApiResponse<CalendarTask>> setStatus(@CurrentUser AuthUser user, @PathVariable UUID id,
                                                               @RequestParam CalendarTask.Status status) {
        return ResponseEntity.ok(ApiResponse.ok(taskService.setStatus(requireUser(user).id(), id, status)));
    }

    @DeleteMapping("/tasks/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTask(@CurrentUser AuthUser user, @PathVariable UUID id) {
        taskService.delete(requireUser(user).id(), id);
        return ResponseEntity.ok(ApiResponse.ok("Task deleted", null));
    }

    @PostMapping("/events")
    public ResponseEntity<ApiResponse<String>> createCalendarEvent(@CurrentUser AuthUser user, @RequestBody CreateEventRequest req) {
        requireUser(user);
        String eventLink = calendarClient.createCalendarEvent(
                req.getSummary(),
                req.getDescription(),
                req.getStartTime() != null ? req.getStartTime() : Instant.now(),
                req.getEndTime() != null ? req.getEndTime() : Instant.now().plusSeconds(3600)
        );
        return ResponseEntity.ok(ApiResponse.ok("Google Calendar event created", eventLink));
    }

    private static AuthUser requireUser(AuthUser user) {
        if (user == null) throw new UnauthorizedException("Authentication required");
        return user;
    }

    @Data
    public static class CreateEventRequest {
        private String summary;
        private String description;
        private Instant startTime;
        private Instant endTime;
    }
}
