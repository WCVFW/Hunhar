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
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class GatewayHeaderAuthFilter extends OncePerRequestFilter {

    private final com.theunoia.common.internal.InternalClient internalClient;

    public GatewayHeaderAuthFilter(com.theunoia.common.internal.InternalClient internalClient) {
        this.internalClient = internalClient;
    }

    public static final String USER_ID = "X-User-Id";
    public static final String USER_ROLE = "X-User-Role";
    public static final String USER_STATUS = "X-User-Status";
    public static final String USER_EMAIL = "X-User-Email";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        // Service-to-service endpoints: never exposed through the gateway, and require the shared key
        if (request.getRequestURI().startsWith("/internal/")) {
            if (!internalClient.isValidKey(request.getHeader(com.theunoia.common.internal.InternalClient.INTERNAL_KEY_HEADER))) {
                response.sendError(HttpServletResponse.SC_FORBIDDEN, "Forbidden");
                return;
            }
            chain.doFilter(request, response);
            return;
        }
        String id = request.getHeader(USER_ID);
        if (id != null && !id.isBlank()) {
            try {
                String role = request.getHeader(USER_ROLE);
                String status = request.getHeader(USER_STATUS);
                String email = request.getHeader(USER_EMAIL);

                AuthUser user = new AuthUser(UUID.fromString(id), role, status, email);
                List<SimpleGrantedAuthority> authorities = new ArrayList<>();
                if (role != null) {
                    authorities.add(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()));
                }
                if (status != null) {
                    authorities.add(new SimpleGrantedAuthority("STATUS_" + status.toUpperCase()));
                }

                var authToken = new UsernamePasswordAuthenticationToken(user, null, authorities);
                SecurityContextHolder.getContext().setAuthentication(authToken);
            } catch (IllegalArgumentException ignored) {
                // Malformed UUID -> anonymous
            }
        }
        chain.doFilter(request, response);
    }
}
