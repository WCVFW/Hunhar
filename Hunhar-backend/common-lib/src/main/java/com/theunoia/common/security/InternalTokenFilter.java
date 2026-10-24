package com.theunoia.common.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.theunoia.common.exception.ErrorResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/**
 * Zero-trust guard: every request must carry the shared internal token, i.e. it must come
 * from the API gateway or a peer service. Combined with Kubernetes NetworkPolicies this
 * prevents anyone from bypassing gateway authentication by calling a pod directly.
 */
public class InternalTokenFilter extends OncePerRequestFilter {

    public static final String HEADER = "X-Internal-Token";

    private final byte[] expected;
    private final ObjectMapper objectMapper;

    public InternalTokenFilter(String internalToken, ObjectMapper objectMapper) {
        this.expected = internalToken.getBytes(StandardCharsets.UTF_8);
        this.objectMapper = objectMapper;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/actuator") || path.startsWith("/v3/api-docs") || path.startsWith("/swagger-ui");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String provided = request.getHeader(HEADER);
        if (provided == null || !MessageDigest.isEqual(expected, provided.getBytes(StandardCharsets.UTF_8))) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            objectMapper.writeValue(response.getOutputStream(), ErrorResponse.of(401, "UNTRUSTED_CALLER",
                    "Requests must be routed through the API gateway", request.getRequestURI(), null));
            return;
        }
        chain.doFilter(request, response);
    }
}
