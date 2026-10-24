package com.theunoia.gateway.web;

import com.theunoia.gateway.config.GatewayProperties;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * API composition (Backend-for-Frontend): one call returns the whole dashboard by fanning
 * out to several services in parallel. A slow/failed section degrades to an error marker
 * instead of failing the entire dashboard.
 */
@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

    private static final ParameterizedTypeReference<Object> ANY = new ParameterizedTypeReference<>() {
    };

    private final WebClient webClient;
    private final GatewayProperties props;

    public DashboardController(WebClient.Builder builder, GatewayProperties props) {
        this.webClient = builder.build();
        this.props = props;
    }

    @GetMapping("/freelancer")
    public Mono<Map<String, Object>> freelancer(ServerHttpRequest request) {
        requireRole(request, "FREELANCER");
        return Mono.zip(
                call(request, "project", "/api/v1/projects/dashboard/freelancer"),
                call(request, "payment", "/api/v1/payments/wallet"),
                call(request, "credit", "/api/v1/credits/me"),
                call(request, "notification", "/api/v1/notifications/unread-count"),
                call(request, "user", "/api/v1/users/me/stats")
        ).map(t -> {
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("projects", t.getT1());
            result.put("earnings", t.getT2());
            result.put("credits", t.getT3());
            result.put("notifications", t.getT4());
            result.put("ranking", t.getT5());
            return result;
        });
    }

    @GetMapping("/client")
    public Mono<Map<String, Object>> client(ServerHttpRequest request) {
        requireRole(request, "CLIENT");
        return Mono.zip(
                call(request, "project", "/api/v1/projects/dashboard/client"),
                call(request, "payment", "/api/v1/payments/wallet"),
                call(request, "notification", "/api/v1/notifications/unread-count"),
                call(request, "notification", "/api/v1/calendar/events/upcoming")
        ).map(t -> {
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("projects", t.getT1());
            result.put("payments", t.getT2());
            result.put("notifications", t.getT3());
            result.put("calendar", t.getT4());
            return result;
        });
    }

    private void requireRole(ServerHttpRequest request, String role) {
        String actual = request.getHeaders().getFirst("X-User-Role");
        if (!role.equals(actual)) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Dashboard available to " + role + " only");
    }

    private Mono<Object> call(ServerHttpRequest request, String service, String path) {
        return webClient.get()
                .uri(props.service(service) + path)
                .headers(h -> {
                    for (String name : new String[]{"X-User-Id", "X-User-Role", "X-User-Status", "X-User-Email",
                            "X-Internal-Token", "X-Request-Id"}) {
                        String v = request.getHeaders().getFirst(name);
                        if (v != null) h.set(name, v);
                    }
                })
                .retrieve()
                .bodyToMono(ANY)
                .timeout(Duration.ofSeconds(5))
                .onErrorResume(e -> Mono.just(Map.of("error", service + " unavailable")));
    }
}
