package com.theunoia.gateway.filter;

import com.theunoia.gateway.crypto.AesGcm;
import com.theunoia.gateway.crypto.ApiCryptoKeys;
import lombok.RequiredArgsConstructor;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.nio.charset.StandardCharsets;

/**
 * Hides which endpoint is called: the browser sends every API call to {@code /api/x} with the real
 * "path?query" encrypted in X-Enc-Target. This WebFilter runs before route matching and restores the
 * real path, so routing, auth and the services are unchanged. {@link PayloadEncryptionFilter} then
 * handles the body, replay and response encryption.
 */
@Component
@RequiredArgsConstructor
public class EncryptedTunnelWebFilter implements WebFilter, Ordered {

    public static final String TUNNEL_PATH = "/api/x";
    public static final String TUNNELED_ATTR = EncryptedTunnelWebFilter.class.getName() + ".tunneled";

    private final ApiCryptoKeys keys;

    @Override
    public int getOrder() {
        // After CORS (which answers preflight requests), before the gateway's handler mapping
        return Ordered.HIGHEST_PRECEDENCE + 10;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        if (!TUNNEL_PATH.equals(request.getURI().getRawPath()) || request.getMethod() == HttpMethod.OPTIONS) {
            return chain.filter(exchange);
        }
        HttpHeaders h = request.getHeaders();
        String clientKey = h.getFirst("X-Enc-Key");
        String sealedTarget = h.getFirst("X-Enc-Target");
        String ts = h.getFirst("X-Enc-Ts");
        String nonce = h.getFirst("X-Enc-Nonce");
        if (clientKey == null || sealedTarget == null || ts == null || nonce == null) {
            return reject(exchange, "invalid", "Invalid secure request.");
        }
        if (!keys.keyId().equals(h.getFirst("X-Enc-Kid"))) {
            return reject(exchange, "key", "Security key changed. Please retry.");
        }

        String target;
        try {
            target = new String(AesGcm.decrypt(keys.deriveKey(clientKey), sealedTarget, "T " + ts + " " + nonce), StandardCharsets.UTF_8);
        } catch (Exception e) {
            return reject(exchange, "key", "Secure session expired. Please retry.");
        }
        int q = target.indexOf('?');
        String path = q >= 0 ? target.substring(0, q) : target;
        String query = q >= 0 ? target.substring(q + 1) : null;
        if (!path.startsWith("/api/") || path.startsWith(TUNNEL_PATH) || path.contains("..") || path.contains("//")) {
            return reject(exchange, "invalid", "Invalid secure request.");
        }

        URI uri;
        try {
            uri = UriComponentsBuilder.fromUri(request.getURI()).replacePath(path).replaceQuery(query == null || query.isEmpty() ? null : query)
                    .build(true).toUri();
        } catch (IllegalArgumentException e) {
            return reject(exchange, "invalid", "Invalid secure request.");
        }
        ServerHttpRequest real = request.mutate().uri(uri).headers(x -> x.remove("X-Enc-Target")).build();
        ServerWebExchange next = exchange.mutate().request(real).build();
        next.getAttributes().put(TUNNELED_ATTR, Boolean.TRUE);
        return chain.filter(next);
    }

    private Mono<Void> reject(ServerWebExchange exchange, String code, String message) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.BAD_REQUEST);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        response.getHeaders().set("X-Enc-Error", code);
        byte[] body = ("{\"success\":false,\"message\":\"" + message + "\"}").getBytes(StandardCharsets.UTF_8);
        return response.writeWith(Mono.just(response.bufferFactory().wrap(body)));
    }
}
