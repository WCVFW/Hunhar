package com.theunoia.common.security;

import java.util.UUID;

public record AuthUser(
        UUID id,
        String role,
        String status,
        String email
) {
    public boolean hasRole(String targetRole) {
        return role != null && role.equalsIgnoreCase(targetRole);
    }

    public boolean isActive() {
        return "ACTIVE".equalsIgnoreCase(status);
    }
}
