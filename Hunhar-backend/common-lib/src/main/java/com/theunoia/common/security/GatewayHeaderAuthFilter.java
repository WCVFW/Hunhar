package com.theunoia.common.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

/**
 * Builds the Spring Security context from identity headers set by the API gateway after
 * JWT validation. Authorities: ROLE_{role} and STATUS_{status} so controllers can use
 * {@code @PreAuthorize("hasRole('CLIENT') and hasAuthority('STATUS_ACTIVE')")}.
 */
public class GatewayHeaderAuthFilter extends OncePerRequestFilter {

    public static final String USER_ID = "X-User-Id";
    public static final String USER_ROLE = "X-User-Role";
    public static final String USER_STATUS = "X-User-Status";
    public static final String USER_EMAIL = "X-User-Email";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String id = request.getHeader(USER_ID);
        if (id != null && !id.isBlank()) {
            try {
                AuthUser user = new AuthUser(UUID.fromString(id), request.getHeader(USER_ROLE),
                        request.getHeader(USER_STATUS), request.getHeader(USER_EMAIL));
                var authorities = List.of(
                        new SimpleGrantedAuthority("ROLE_" + user.role()),
                        new SimpleGrantedAuthority("STATUS_" + user.status()));
                SecurityContextHolder.getContext()
                        .setAuthentication(new UsernamePasswordAuthenticationToken(user, null, authorities));
            } catch (IllegalArgumentException ignored) {
                // malformed id header: treat as anonymous
            }
        }
        chain.doFilter(request, response);
    }
}
