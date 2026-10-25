package com.theunoia.engagement.service;

import com.theunoia.common.exception.BadRequestException;
import com.theunoia.common.exception.ForbiddenException;
import com.theunoia.common.exception.ResourceNotFoundException;
import com.theunoia.engagement.domain.CalendarTask;
import com.theunoia.engagement.repository.CalendarTaskRepository;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CalendarTaskService {

    private static final int MAX_TASKS_PER_USER_RANGE_DAYS = 400;
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("d MMM, h:mm a").withZone(ZoneId.of("Asia/Kolkata"));

    private final CalendarTaskRepository repository;
    private final NotificationService notificationService;

    @Data
    public static class TaskRequest {
        @NotBlank(message = "Title is required")
        @Size(max = 200)
        private String title;
        @Size(max = 4000)
        private String notes;
        private CalendarTask.Type type;
        private CalendarTask.Priority priority;
        private CalendarTask.Status status;
        private Instant dueAt;
        private boolean allDay;
        private UUID projectId;
        @Size(max = 200)
        private String projectTitle;
        @Min(0) @Max(10080)
        private Integer reminderMinutes;
    }

    @Transactional(readOnly = true)
    public List<CalendarTask> list(UUID userId, Instant from, Instant to, boolean includeUndated) {
        if (from == null || to == null || !to.isAfter(from)) {
            throw new BadRequestException("Invalid date range");
        }
        if (Duration.between(from, to).toDays() > MAX_TASKS_PER_USER_RANGE_DAYS) {
            throw new BadRequestException("Date range is too large");
        }
        return repository.findInRange(userId, from, to, includeUndated);
    }

    @Transactional(readOnly = true)
    public List<CalendarTask> todos(UUID userId) {
        return repository.findByUserIdAndDueAtIsNullOrderByCreatedAtAsc(userId);
    }

    @Transactional(readOnly = true)
    public Map<String, Long> summary(UUID userId) {
        Map<String, Long> s = new LinkedHashMap<>();
        s.put("todo", repository.countByUserIdAndStatus(userId, CalendarTask.Status.TODO));
        s.put("inProgress", repository.countByUserIdAndStatus(userId, CalendarTask.Status.IN_PROGRESS));
        s.put("done", repository.countByUserIdAndStatus(userId, CalendarTask.Status.DONE));
        s.put("overdue", repository.countByUserIdAndStatusNotAndDueAtLessThan(userId, CalendarTask.Status.DONE, Instant.now()));
        return s;
    }

    @Transactional
    public CalendarTask create(UUID userId, TaskRequest req) {
        CalendarTask task = CalendarTask.builder().userId(userId).build();
        apply(task, req);
        return repository.save(task);
    }

    @Transactional
    public CalendarTask update(UUID userId, UUID id, TaskRequest req) {
        CalendarTask task = owned(userId, id);
        apply(task, req);
        return repository.save(task);
    }

    @Transactional
    public CalendarTask setStatus(UUID userId, UUID id, CalendarTask.Status status) {
        CalendarTask task = owned(userId, id);
        task.setStatus(status);
        task.setCompletedAt(status == CalendarTask.Status.DONE ? Instant.now() : null);
        return repository.save(task);
    }

    @Transactional
    public void delete(UUID userId, UUID id) {
        repository.delete(owned(userId, id));
    }

    /** Sends due reminders as in-app notifications. Runs every minute. */
    @Scheduled(fixedDelay = 60_000, initialDelay = 30_000)
    @Transactional
    public void sendDueReminders() {
        List<CalendarTask> due = repository.findTop200ByRemindAtLessThanEqualOrderByRemindAtAsc(Instant.now());
        for (CalendarTask t : due) {
            if (t.getStatus() != CalendarTask.Status.DONE && t.getDueAt() != null) {
                notificationService.sendNotification(t.getUserId(),
                        "Reminder: " + t.getTitle(),
                        "Due " + TIME.format(t.getDueAt()) + (t.getProjectTitle() != null ? " · " + t.getProjectTitle() : ""),
                        "DEADLINE_REMINDER",
                        "/freelancer/calendar");
            }
            t.setRemindAt(null);
            repository.save(t);
        }
        if (!due.isEmpty()) log.info("Sent {} calendar reminders", due.size());
    }

    private void apply(CalendarTask task, TaskRequest req) {
        task.setTitle(req.getTitle().trim());
        task.setNotes(req.getNotes() == null || req.getNotes().isBlank() ? null : req.getNotes().trim());
        if (req.getType() != null) task.setType(req.getType());
        if (req.getPriority() != null) task.setPriority(req.getPriority());
        if (req.getStatus() != null) {
            task.setStatus(req.getStatus());
            task.setCompletedAt(req.getStatus() == CalendarTask.Status.DONE ? Instant.now() : null);
        }
        task.setDueAt(req.getDueAt());
        task.setAllDay(req.isAllDay());
        task.setProjectId(req.getProjectId());
        task.setProjectTitle(req.getProjectTitle());
        task.setReminderMinutes(req.getDueAt() == null ? null : req.getReminderMinutes());

        Instant remindAt = null;
        if (task.getDueAt() != null && task.getReminderMinutes() != null) {
            Instant at = task.getDueAt().minus(Duration.ofMinutes(task.getReminderMinutes()));
            if (at.isAfter(Instant.now())) remindAt = at;
        }
        task.setRemindAt(remindAt);
    }

    private CalendarTask owned(UUID userId, UUID id) {
        CalendarTask t = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        if (!t.getUserId().equals(userId)) throw new ForbiddenException("Not your task");
        return t;
    }
}
