package com.theunoia.gateway.config;

import org.springframework.cloud.gateway.filter.factory.RetryGatewayFilterFactory;
import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.cloud.gateway.filter.ratelimit.RedisRateLimiter;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.GatewayFilterSpec;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;
import reactor.core.publisher.Mono;

import java.util.List;

/**
 * Route table: path prefix -> microservice. Every HTTP route gets Redis token-bucket rate
 * limiting, a Resilience4j circuit breaker with a JSON fallback, and safe retries for GETs.
 */
@Configuration
public class RouteConfig {

    @Bean
    @Primary
    public RedisRateLimiter defaultRateLimiter() {
        return new RedisRateLimiter(20, 40, 1); // 20 req/s sustained, bursts of 40, per user/IP
    }

    @Bean
    public RedisRateLimiter authRateLimiter() {
        return new RedisRateLimiter(1, 10, 1); // brute-force protection for login/registration
    }

    @Bean
    @Primary
    public KeyResolver userOrIpKeyResolver() {
        return exchange -> {
            String userId = exchange.getRequest().getHeaders().getFirst("X-User-Id");
            if (userId != null) return Mono.just("user:" + userId);
            String forwarded = exchange.getRequest().getHeaders().getFirst("X-Forwarded-For");
            if (forwarded != null && !forwarded.isBlank()) return Mono.just("ip:" + forwarded.split(",")[0].trim());
            var address = exchange.getRequest().getRemoteAddress();
            String ip = address == null ? "unknown"
                    : address.getAddress() != null ? address.getAddress().getHostAddress() : address.getHostString();
            return Mono.just("ip:" + ip);
        };
    }

    @Bean
    public RouteLocator routes(RouteLocatorBuilder builder, GatewayProperties props) {
        return builder.routes()
                .route("auth-public", r -> r.path("/api/v1/auth/login", "/api/v1/auth/register/**", "/api/v1/auth/forgot-password")
                        .filters(f -> standard(f, "auth", authRateLimiter()))
                        .uri(props.service("auth")))
                .route("auth", r -> r.path("/api/v1/auth/**", "/api/v1/admin/users/**")
                        .filters(f -> standard(f, "auth", defaultRateLimiter()))
                        .uri(props.service("auth")))
                .route("user", r -> r.path("/api/v1/users/**")
                        .filters(f -> standard(f, "user", defaultRateLimiter()))
                        .uri(props.service("user")))
                .route("project", r -> r.path("/api/v1/projects/**", "/api/v1/bids/**", "/api/v1/categories/**",
                                "/api/v1/reviews/**", "/api/v1/team-invitations/**", "/api/v1/disputes/**", "/api/v1/milestones/**",
                                "/api/v1/admin/projects/**", "/api/v1/admin/bids/**", "/api/v1/admin/disputes/**",
                                "/api/v1/admin/categories/**")
                        .filters(f -> standard(f, "project", defaultRateLimiter()))
                        .uri(props.service("project")))
                .route("credit", r -> r.path("/api/v1/credits/**", "/api/v1/admin/credits/**")
                        .filters(f -> standard(f, "credit", defaultRateLimiter()))
                        .uri(props.service("credit")))
                .route("payment", r -> r.path("/api/v1/payments/**", "/api/v1/webhooks/**", "/api/v1/admin/payments/**")
                        .filters(f -> standard(f, "payment", defaultRateLimiter()))
                        .uri(props.service("payment")))
                .route("messaging", r -> r.path("/api/v1/conversations/**")
                        .filters(f -> standard(f, "messaging", defaultRateLimiter()))
                        .uri(props.service("messaging")))
                .route("messaging-ws", r -> r.path("/ws/**")
                        .uri(props.service("messaging").replaceFirst("^http", "ws")))
                .route("notification", r -> r.path("/api/v1/notifications/**", "/api/v1/calendar/**", "/api/v1/admin/notifications/**")
                        .filters(f -> standard(f, "notification", defaultRateLimiter()))
                        .uri(props.service("notification")))
                .route("community", r -> r.path("/api/v1/community/**", "/api/v1/admin/community/**")
                        .filters(f -> standard(f, "community", defaultRateLimiter()))
                        .uri(props.service("community")))
                .route("content", r -> r.path("/api/v1/content/**", "/api/v1/admin/content/**", "/sitemap.xml")
                        .filters(f -> standard(f, "content", defaultRateLimiter()))
                        .uri(props.service("content")))
                .route("analytics", r -> r.path("/api/v1/admin/analytics/**")
                        .filters(f -> standard(f, "analytics", defaultRateLimiter()))
                        .uri(props.service("analytics")))
                .route("file", r -> r.path("/api/v1/files/**")
                        .filters(f -> standard(f, "file", defaultRateLimiter()))
                        .uri(props.service("file")))
                .build();
    }

    private GatewayFilterSpec standard(GatewayFilterSpec f, String name, RedisRateLimiter limiter) {
        return f.requestRateLimiter(c -> c.setRateLimiter(limiter).setKeyResolver(userOrIpKeyResolver()))
                .circuitBreaker(c -> c.setName(name).setFallbackUri("forward:/fallback/" + name))
                .retry(c -> {
                    RetryGatewayFilterFactory.RetryConfig cfg = c;
                    cfg.setRetries(2);
                    cfg.setMethods(HttpMethod.GET);
                    cfg.setStatuses(HttpStatus.BAD_GATEWAY, HttpStatus.SERVICE_UNAVAILABLE);
                });
    }

    @Bean
    public CorsWebFilter corsWebFilter(GatewayProperties props) {
        CorsConfiguration cors = new CorsConfiguration();
        cors.setAllowedOrigins(props.getAllowedOrigins());
        cors.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        cors.setAllowedHeaders(List.of("*"));
        cors.setExposedHeaders(List.of("X-Request-Id", "X-RateLimit-Remaining"));
        cors.setAllowCredentials(true);
        cors.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cors);
        return new CorsWebFilter(source);
    }
}
