package com.theunoia.gateway.security;

import com.theunoia.gateway.config.GatewayProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.UUID;

/**
 * Edge authentication for every request (routed or handled locally by the gateway):
 * <ol>
 *   <li>strips any client-supplied identity/internal headers (header spoofing protection)</li>
 *   <li>blocks /internal/** service-to-service endpoints from the internet</li>
 *   <li>validates the access JWT (HS256) and rejects suspended accounts (Redis deny-list)</li>
 *   <li>forwards identity as X-User-Id / X-User-Role / X-User-Status / X-User-Email plus X-Internal-Token</li>
 * </ol>
 */
@Slf4j
@Component
public class JwtAuthenticationFilter implements WebFilter, Ordered {

    private static final AntPathMatcher MATCHER = new AntPathMatcher();
    public static final String SUSPENDED_KEY_PREFIX = "auth:suspended:";

    private final GatewayProperties props;
    private final ReactiveStringRedisTemplate redis;
    private final SecretKey key;

    public JwtAuthenticationFilter(GatewayProperties props, ReactiveStringRedisTemplate redis) {
        this.props = props;
        this.redis = redis;
        this.key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(props.getJwtSecret()));
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 10;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getPath().value();

        if (path.startsWith("/internal") || path.contains("/internal/")) {
            return reject(exchange, HttpStatus.NOT_FOUND, "NOT_FOUND", "Endpoint not found");
        }
        if (path.startsWith("/actuator") || path.startsWith("/fallback") || request.getMethod() == HttpMethod.OPTIONS) {
            return chain.filter(exchange);
        }

        String requestId = request.getHeaders().getFirst("X-Request-Id");
        String effectiveRequestId = requestId != null ? requestId : UUID.randomUUID().toString();
        boolean isPublic = isPublic(request.getMethod(), path);
        String token = extractToken(request, path);

        if (token == null) {
            if (!isPublic) return reject(exchange, HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Missing access token");
            return chain.filter(forward(exchange, null, effectiveRequestId));
        }

        Claims claims;
        try {
            claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
            if (!"access".equals(claims.get("typ", String.class))) throw new JwtException("Not an access token");
        } catch (JwtException | IllegalArgumentException e) {
            if (isPublic) return chain.filter(forward(exchange, null, effectiveRequestId));
            return reject(exchange, HttpStatus.UNAUTHORIZED, "INVALID_TOKEN", "Access token is invalid or expired");
        }

        return redis.hasKey(SUSPENDED_KEY_PREFIX + claims.getSubject())
                .onErrorResume(e -> {
                    log.warn("Redis unavailable for suspension check, failing open: {}", e.getMessage());
                    return Mono.just(false);
                })
                .flatMap(suspended -> suspended
                        ? reject(exchange, HttpStatus.FORBIDDEN, "ACCOUNT_SUSPENDED", "This account has been suspended")
                        : chain.filter(forward(exchange, claims, effectiveRequestId)));
    }

    private ServerWebExchange forward(ServerWebExchange exchange, Claims claims, String requestId) {
        ServerHttpRequest mutated = exchange.getRequest().mutate().headers(h -> {
            h.remove("X-User-Id");
            h.remove("X-User-Role");
            h.remove("X-User-Status");
            h.remove("X-User-Email");
            h.remove("X-Internal-Token");
            h.set("X-Internal-Token", props.getInternalToken());
            h.set("X-Request-Id", requestId);
            if (claims != null) {
                h.set("X-User-Id", claims.getSubject());
                h.set("X-User-Role", claims.get("role", String.class));
                h.set("X-User-Status", claims.get("status", String.class));
                String email = claims.get("email", String.class);
                if (email != null) h.set("X-User-Email", email);
            }
        }).build();
        exchange.getResponse().getHeaders().set("X-Request-Id", requestId);
        return exchange.mutate().request(mutated).build();
    }

    private String extractToken(ServerHttpRequest request, String path) {
        String header = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith("Bearer ")) return header.substring(7).trim();
        // Browsers cannot set headers on WebSocket handshakes, so the token travels as a query param there.
        if (path.startsWith("/ws")) return request.getQueryParams().getFirst("access_token");
        return null;
    }

    private boolean isPublic(HttpMethod method, String path) {
        for (String rule : props.getPublicRoutes()) {
            String[] parts = rule.trim().split("\\s+", 2);
            if (parts.length == 2) {
                if (parts[0].equalsIgnoreCase(method.name()) && MATCHER.match(parts[1], path)) return true;
            } else if (MATCHER.match(parts[0], path)) {
                return true;
            }
        }
        return false;
    }

    private Mono<Void> reject(ServerWebExchange exchange, HttpStatus status, String code, String message) {
        var response = exchange.getResponse();
        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        String body = "{\"timestamp\":\"%s\",\"status\":%d,\"code\":\"%s\",\"message\":\"%s\",\"path\":\"%s\"}"
                .formatted(Instant.now(), status.value(), code, message, exchange.getRequest().getPath().value());
        DataBuffer buffer = response.bufferFactory().wrap(body.getBytes(StandardCharsets.UTF_8));
        return response.writeWith(Mono.just(buffer));
    }
}
