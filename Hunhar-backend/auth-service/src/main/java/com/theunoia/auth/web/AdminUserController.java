package com.theunoia.auth.web;

import com.theunoia.auth.domain.Role;
import com.theunoia.auth.domain.UserStatus;
import com.theunoia.auth.dto.AuthDtos.KycStatusResponse;
import com.theunoia.auth.dto.AuthDtos.ReasonRequest;
import com.theunoia.auth.dto.AuthDtos.UserResponse;
import com.theunoia.auth.dto.AuthDtos.UserStatsResponse;
import com.theunoia.auth.service.AdminUserService;
import com.theunoia.auth.service.KycService;
import com.theunoia.common.security.CurrentUser;
import com.theunoia.common.web.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

/** Admin panel: Freelancer / Client / Verification management and account suspension. */
@RestController
@RequestMapping("/api/v1/admin/users")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUsers;
    private final KycService kycService;

    @GetMapping
    public PageResponse<UserResponse> list(@RequestParam(required = false) Role role,
                                           @RequestParam(required = false) UserStatus status,
                                           @RequestParam(required = false) String q,
                                           @RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "20") int size) {
        return adminUsers.search(role, status, q, page, size);
    }

    @GetMapping("/stats")
    public UserStatsResponse stats() {
        return adminUsers.stats();
    }

    @GetMapping("/{id}")
    public Map<String, Object> details(@PathVariable UUID id) {
        return adminUsers.details(id);
    }

    @PostMapping("/{id}/approve")
    public UserResponse approve(@PathVariable UUID id) {
        return adminUsers.approve(CurrentUser.require().id(), id);
    }

    @PostMapping("/{id}/reject")
    public UserResponse reject(@PathVariable UUID id, @Valid @RequestBody ReasonRequest req) {
        return adminUsers.reject(CurrentUser.require().id(), id, req.reason());
    }

    @PostMapping("/{id}/suspend")
    public UserResponse suspend(@PathVariable UUID id, @Valid @RequestBody ReasonRequest req) {
        return adminUsers.suspend(CurrentUser.require().id(), id, req.reason());
    }

    @PostMapping("/{id}/reactivate")
    public UserResponse reactivate(@PathVariable UUID id) {
        return adminUsers.reactivate(CurrentUser.require().id(), id);
    }

    @PostMapping("/{id}/kyc/manual-verify")
    public KycStatusResponse manualKyc(@PathVariable UUID id, @Valid @RequestBody ReasonRequest req) {
        return kycService.markVerifiedManually(id, req.reason());
    }
}
