package com.theunoia.auth.service;

import com.theunoia.auth.domain.AdminAuditLog;
import com.theunoia.auth.domain.Role;
import com.theunoia.auth.domain.User;
import com.theunoia.auth.domain.UserStatus;
import com.theunoia.auth.dto.AuthDtos.UserResponse;
import com.theunoia.auth.dto.AuthDtos.UserStatsResponse;
import com.theunoia.auth.repository.AdminAuditLogRepository;
import com.theunoia.auth.repository.RefreshTokenRepository;
import com.theunoia.auth.repository.UserRepository;
import com.theunoia.common.event.EventPublisher;
import com.theunoia.common.exception.ApiException;
import com.theunoia.common.web.PageResponse;
import com.theunoia.common.web.Pagination;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Admin panel - user management: approvals, rejections, suspensions. Every action is audited. */
@Service
@RequiredArgsConstructor
public class AdminUserService {

    /** Read by the API gateway to block suspended users' still-valid access tokens immediately. */
    public static final String SUSPENDED_KEY_PREFIX = "auth:suspended:";

    private final UserRepository users;
    private final RefreshTokenRepository refreshTokens;
    private final AdminAuditLogRepository auditLogs;
    private final EventPublisher events;
    private final StringRedisTemplate redis;

    @Transactional(readOnly = true)
    public PageResponse<UserResponse> search(Role role, UserStatus status, String q, int page, int size) {
        return PageResponse.of(users.search(role, status, q == null || q.isBlank() ? null : q.trim(),
                Pagination.newestFirst(page, size)), UserResponse::from);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> details(UUID userId) {
        User user = load(userId);
        Map<String, Object> result = new HashMap<>();
        result.put("user", UserResponse.from(user));
        result.put("auditTrail", auditLogs.findByTargetUserIdOrderByCreatedAtDesc(userId));
        return result;
    }

    @Transactional
    public UserResponse approve(UUID adminId, UUID userId) {
        User user = load(userId);
        if (user.getStatus() != UserStatus.PENDING_APPROVAL) {
            throw ApiException.unprocessable("INVALID_STATE",
                    "Only accounts that completed verification can be approved (current: " + user.getStatus() + ")");
        }
        user.setStatus(UserStatus.ACTIVE);
        user.setApprovedAt(Instant.now());
        user.setApprovedBy(adminId);
        user.setStatusReason(null);
        audit(adminId, "APPROVE", userId, null);
        publishStatus("user.approved", user, null);
        return UserResponse.from(user);
    }

    @Transactional
    public UserResponse reject(UUID adminId, UUID userId, String reason) {
        User user = load(userId);
        if (user.getStatus() == UserStatus.ACTIVE) throw ApiException.unprocessable("INVALID_STATE", "Suspend active accounts instead");
        user.setStatus(UserStatus.REJECTED);
        user.setStatusReason(reason);
        refreshTokens.revokeAllForUser(userId);
        audit(adminId, "REJECT", userId, reason);
        publishStatus("user.rejected", user, reason);
        return UserResponse.from(user);
    }

    @Transactional
    public UserResponse suspend(UUID adminId, UUID userId, String reason) {
        User user = load(userId);
        if (user.getRole() == Role.ADMIN) throw ApiException.forbidden("Administrators cannot be suspended here");
        user.setStatus(UserStatus.SUSPENDED);
        user.setStatusReason(reason);
        refreshTokens.revokeAllForUser(userId);
        audit(adminId, "SUSPEND", userId, reason);
        publishStatus("user.suspended", user, reason);
        afterCommit(() -> redis.opsForValue().set(SUSPENDED_KEY_PREFIX + userId, reason == null ? "suspended" : reason));
        return UserResponse.from(user);
    }

    @Transactional
    public UserResponse reactivate(UUID adminId, UUID userId) {
        User user = load(userId);
        if (user.getStatus() != UserStatus.SUSPENDED) throw ApiException.unprocessable("INVALID_STATE", "Account is not suspended");
        user.setStatus(user.getApprovedAt() != null ? UserStatus.ACTIVE : UserStatus.PENDING_APPROVAL);
        user.setStatusReason(null);
        audit(adminId, "REACTIVATE", userId, null);
        publishStatus("user.reactivated", user, null);
        afterCommit(() -> redis.delete(SUSPENDED_KEY_PREFIX + userId));
        return UserResponse.from(user);
    }

    @Transactional(readOnly = true)
    public UserStatsResponse stats() {
        return new UserStatsResponse(users.count(), users.countByRole(Role.FREELANCER), users.countByRole(Role.CLIENT),
                users.countByStatus(UserStatus.PENDING_APPROVAL), users.countByStatus(UserStatus.ACTIVE),
                users.countByStatus(UserStatus.SUSPENDED));
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> contacts(List<UUID> ids) {
        return users.findAllById(ids).stream().map(u -> Map.<String, Object>of(
                "userId", u.getId(), "email", u.getEmail(), "mobile", u.getMobile(),
                "displayName", u.getDisplayName(), "role", u.getRole().name())).toList();
    }

    private User load(UUID userId) {
        return users.findById(userId).orElseThrow(() -> ApiException.notFound("User"));
    }

    private void audit(UUID adminId, String action, UUID target, String reason) {
        auditLogs.save(new AdminAuditLog(adminId, action, target, reason));
    }

    private void publishStatus(String type, User user, String reason) {
        Map<String, Object> data = new HashMap<>();
        data.put("userId", user.getId());
        data.put("role", user.getRole().name());
        data.put("status", user.getStatus().name());
        data.put("email", user.getEmail());
        data.put("displayName", user.getDisplayName());
        if (reason != null) data.put("reason", reason);
        events.publish(type, data);
    }

    private static void afterCommit(Runnable action) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                action.run();
            }
        });
    }
}
