package com.theunoia.messaging.web;

import com.theunoia.common.security.CurrentUser;
import com.theunoia.messaging.domain.Message;
import com.theunoia.messaging.service.MessagingService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final MessagingService messaging;

    public record DirectRequest(@NotNull UUID participantId) {
    }

    public record SendRequest(@Size(max = 10000) String body, @Size(max = 10) List<Map<String, Object>> attachments) {
    }

    @PostMapping
    public Map<String, Object> openDirect(@Valid @RequestBody DirectRequest req) {
        return messaging.openDirect(CurrentUser.require().id(), req.participantId());
    }

    @GetMapping
    public List<Map<String, Object>> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "30") int size) {
        return messaging.list(CurrentUser.require().id(), page, size);
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unread() {
        return Map.of("unread", messaging.totalUnread(CurrentUser.require().id()));
    }

    @GetMapping("/{id}/messages")
    public List<Message> history(@PathVariable UUID id, @RequestParam(required = false) Instant before,
                                 @RequestParam(defaultValue = "50") int limit) {
        return messaging.history(CurrentUser.require().id(), id, before, limit);
    }

    @PostMapping("/{id}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public Message send(@PathVariable UUID id, @Valid @RequestBody SendRequest req) {
        return messaging.send(CurrentUser.require().id(), id, new MessagingService.SendCommand(req.body(), req.attachments()));
    }

    @PostMapping("/{id}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void read(@PathVariable UUID id) {
        messaging.markRead(CurrentUser.require().id(), id);
    }

    @DeleteMapping("/messages/{messageId}")
    public Message delete(@PathVariable UUID messageId) {
        return messaging.delete(CurrentUser.require().id(), messageId);
    }
}
