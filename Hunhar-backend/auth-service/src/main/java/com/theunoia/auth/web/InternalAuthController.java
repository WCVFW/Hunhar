package com.theunoia.auth.web;

import com.theunoia.auth.dto.AuthDtos.UserStatsResponse;
import com.theunoia.auth.service.AdminUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Service-to-service endpoints (blocked at the gateway, guarded by the internal token). */
@RestController
@RequestMapping("/internal/users")
@RequiredArgsConstructor
public class InternalAuthController {

    private final AdminUserService adminUsers;

    @GetMapping("/contacts")
    public List<Map<String, Object>> contacts(@RequestParam List<UUID> ids) {
        return adminUsers.contacts(ids);
    }

    @GetMapping("/stats")
    public UserStatsResponse stats() {
        return adminUsers.stats();
    }
}
