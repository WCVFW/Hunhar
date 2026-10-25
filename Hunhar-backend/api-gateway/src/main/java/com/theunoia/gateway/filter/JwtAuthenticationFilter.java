package com.theunoia.gateway.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Component
public class JwtAuthenticationFilter implements GlobalFilter, Ordered {

    private static final List<String> TRUSTED_HEADERS = List.of(
            "X-User-Id", "X-User-Role", "X-User-Status", "X-User-Email", "X-Internal-Key"
    );

    private final SecretKey key;

    private static final List<String> PUBLIC_PATH_PREFIXES = List.of(
            "/api/v1/auth/",
            "/api/v1/content/",
            "/api/v1/webhooks/",
            "/api/v1/projects/public",
            // Uploaded files are served by unguessable UUID so <img src> works without a token
            "/api/v1/projects/files/",
            "/actuator/",
            "/swagger-ui",
            "/v3/api-docs"
    );

    public JwtAuthenticationFilter(@Value("${theunoia.gateway.jwt-secret:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}") String secret) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        // Never trust identity headers coming from the browser: only this filter may set them.
        ServerHttpRequest request = exchange.getRequest().mutate()
                .headers(h -> TRUSTED_HEADERS.forEach(h::remove))
                .build();
        String path = request.getURI().getPath();

        if (request.getMethod() == HttpMethod.OPTIONS) {
            return chain.filter(exchange.mutate().request(request).build());
        }

        boolean isPublic = PUBLIC_PATH_PREFIXES.stream().anyMatch(path::startsWith)
                || (path.equals("/api/v1/projects/files") && request.getMethod() == HttpMethod.GET);

        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            if (isPublic) {
                return chain.filter(exchange.mutate().request(request).build());
            }
            return unauthorized(exchange, "Authentication required");
        }

        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(authHeader.substring(7))
                    .getPayload();

            if ("REFRESH".equals(claims.get("type", String.class))) {
                return unauthorized(exchange, "Refresh token cannot be used for API access");
            }

            String userId = claims.getSubject();
            String role = claims.get("role", String.class);
            String status = claims.get("status", String.class);
            String email = claims.get("email", String.class);

            ServerHttpRequest mutatedRequest = request.mutate()
                    .header("X-User-Id", userId != null ? userId : "")
                    .header("X-User-Role", role != null ? role : "")
                    .header("X-User-Status", status != null ? status : "")
                    .header("X-User-Email", email != null ? email : "")
                    .build();

            return chain.filter(exchange.mutate().request(mutatedRequest).build());

        } catch (Exception e) {
            if (isPublic) {
                return chain.filter(exchange.mutate().request(request).build());
            }
            return unauthorized(exchange, "Session expired. Please log in again.");
        }
    }

    private Mono<Void> unauthorized(ServerWebExchange exchange, String message) {
        var response = exchange.getResponse();
        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        byte[] body = ("{\"success\":false,\"message\":\"" + message + "\"}").getBytes(StandardCharsets.UTF_8);
        return response.writeWith(Mono.just(response.bufferFactory().wrap(body)));
    }

    @Override
    public int getOrder() {
        return -100;
    }
}
