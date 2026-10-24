package com.theunoia.common.security;

import com.theunoia.common.exception.ApiException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

public final class CurrentUser {

    private CurrentUser() {
    }

    public static Optional<AuthUser> get() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof AuthUser user) {
            return Optional.of(user);
        }
        return Optional.empty();
    }

    public static AuthUser require() {
        return get().orElseThrow(() -> ApiException.unauthorized("Authentication required"));
    }

    /** Requires an authenticated user whose account has been approved (status ACTIVE). */
    public static AuthUser requireActive() {
        AuthUser user = require();
        if (!user.isActive() && !user.isAdmin()) {
            throw ApiException.forbidden("Your account must be verified and approved before performing this action");
        }
        return user;
    }
}
