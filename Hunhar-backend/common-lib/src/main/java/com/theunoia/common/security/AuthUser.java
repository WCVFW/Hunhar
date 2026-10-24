package com.theunoia.common.security;

import java.util.UUID;

/**
 * Identity of the caller, established by the API gateway (which validates the JWT) and
 * forwarded to services in trusted X-User-* headers.
 */
public record AuthUser(UUID id, String role, String status, String email) {

    public static final String ADMIN = "ADMIN";
    public static final String FREELANCER = "FREELANCER";
    public static final String CLIENT = "CLIENT";

    public boolean isAdmin() {
        return ADMIN.equals(role);
    }

    public boolean isFreelancer() {
        return FREELANCER.equals(role);
    }

    public boolean isClient() {
        return CLIENT.equals(role);
    }

    public boolean isActive() {
        return "ACTIVE".equals(status);
    }
}
