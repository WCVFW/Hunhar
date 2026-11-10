package com.theunoia.gateway.filter;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.theunoia.gateway.crypto.AesGcm;
import com.theunoia.gateway.crypto.ApiCryptoKeys;
import lombok.extern.slf4j.Slf4j;
import org.reactivestreams.Publisher;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpRequestDecorator;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.http.server.reactive.ServerHttpResponseDecorator;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * End-to-end payload encryption between the browser and the gateway (on top of HTTPS).
 *
 * <pre>
 * Endpoint         all calls go to /api/x; X-Enc-Target = AES-GCM("path?query", aad "T {ts} {nonce}")
 *                  is unwrapped by EncryptedTunnelWebFilter before routing
 * Request headers  X-Enc-Key   browser's ephemeral P-256 public key (base64url, 65 bytes)
 *                  X-Enc-Kid   id of the gateway key the browser used
 *                  X-Enc-Ts    client time in ms (must be within 5 minutes)
 *                  X-Enc-Nonce random one-time value (replays are rejected)
 *                  X-Enc-Auth  AES-GCM tag over "A {method} {path} {ts} {nonce}" (authenticates the request)
 * JSON body        {"data": AES-GCM(original body, aad "B ...")} with X-Encrypted: 1
 * JSON response    {"data": AES-GCM(original body, aad "R ...")} with X-Encrypted: 1
 * </pre>
 *
 * Services behind the gateway keep receiving and returning plain JSON. Errors raised here are plain JSON
 * with an X-Enc-Error header (key | clock | replay | invalid | required) so the browser can recover.
 */
@Slf4j
@Component
public class PayloadEncryptionFilter implements GlobalFilter, Ordered {

    private static final long MAX_SKEW_MS = 5 * 60 * 1000;
    private static final String H_KEY = "X-Enc-Key";
    private static final String H_KID = "X-Enc-Kid";
    private static final String H_TS = "X-Enc-Ts";
    private static final String H_NONCE = "X-Enc-Nonce";
    private static final String H_AUTH = "X-Enc-Auth";
    private static final String H_ENCRYPTED = "X-Encrypted";
    private static final String H_ERROR = "X-Enc-Error";

    /** Paths that never carry encrypted payloads: provider webhooks, the key endpoint and binary downloads. */
    private static final List<String> EXEMPT_PREFIXES = List.of("/api/v1/webhooks/", "/api/v1/crypto/");

    private final ApiCryptoKeys keys;
    private final ObjectMapper mapper = new ObjectMapper();
    private final Map<String, Long> seenNonces = new ConcurrentHashMap<>();
    private final boolean required;
    /** Plain JSON is accepted on requests that reach the gateway directly (SSH tunnel, server itself), not through nginx. */
    private final boolean directPlainAllowed;

    public PayloadEncryptionFilter(ApiCryptoKeys keys,
                                   @Value("${theunoia.gateway.encryption.required:true}") boolean required,
                                   @Value("${theunoia.gateway.encryption.allow-direct-plain:true}") boolean directPlainAllowed) {
        this.keys = keys;
        this.required = required;
        this.directPlainAllowed = directPlainAllowed;
        log.info("API payload encryption: {}{}", required ? "REQUIRED for /api/**" : "optional (plain JSON also accepted)",
                required && directPlainAllowed ? " (plain JSON allowed on direct, non-proxied requests)" : "");
    }

    /** nginx always adds these headers; a request without them came straight to the gateway port, which is not public. */
    private static boolean viaProxy(HttpHeaders h) {
        return h.containsKey("X-Forwarded-For") || h.containsKey("X-Real-IP") || h.containsKey("Forwarded");
    }

    @Override
    public int getOrder() {
        // Before JwtAuthenticationFilter (-100) so its 401 responses are encrypted too
        return -200;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getRawPath();
        HttpMethod method = request.getMethod();

        if (method == HttpMethod.OPTIONS || !path.startsWith("/api/") || isExempt(path, method)) {
            return chain.filter(exchange);
        }

        HttpHeaders h = request.getHeaders();
        String clientKey = h.getFirst(H_KEY);
        if (clientKey == null) {
            boolean plainOk = !required || (directPlainAllowed && !viaProxy(h));
            return plainOk ? chain.filter(exchange)
                    : reject(exchange, HttpStatus.BAD_REQUEST, "required", "Encrypted connection required. Please refresh the page.");
        }

        String ts = h.getFirst(H_TS);
        String nonce = h.getFirst(H_NONCE);
        String auth = h.getFirst(H_AUTH);
        if (!keys.keyId().equals(h.getFirst(H_KID))) {
            return reject(exchange, HttpStatus.BAD_REQUEST, "key", "Security key changed. Please retry.");
        }
        if (ts == null || nonce == null || auth == null || nonce.length() < 16 || nonce.length() > 64) {
            return reject(exchange, HttpStatus.BAD_REQUEST, "invalid", "Invalid secure request.");
        }
        long sentAt;
        try {
            sentAt = Long.parseLong(ts);
        } catch (NumberFormatException e) {
            return reject(exchange, HttpStatus.BAD_REQUEST, "invalid", "Invalid secure request.");
        }
        if (Math.abs(System.currentTimeMillis() - sentAt) > MAX_SKEW_MS) {
            return reject(exchange, HttpStatus.BAD_REQUEST, "clock", "Your device clock is wrong. Please correct the date and time and retry.");
        }

        boolean tunneled = Boolean.TRUE.equals(exchange.getAttribute(EncryptedTunnelWebFilter.TUNNELED_ATTR));
        if (required && !tunneled) {
            // Direct /api/v1/... calls would expose the endpoint and query in the URL
            return reject(exchange, HttpStatus.BAD_REQUEST, "required", "Encrypted connection required. Please refresh the page.");
        }

        SecretKey key;
        String aad = method.name() + " " + path + " " + ts + " " + nonce;
        try {
            key = keys.deriveKey(clientKey);
            AesGcm.decrypt(key, auth, "A " + aad);
        } catch (GeneralSecurityException | IllegalArgumentException e) {
            return reject(exchange, HttpStatus.BAD_REQUEST, "key", "Secure session expired. Please retry.");
        }
        if (seenNonces.putIfAbsent(clientKey + ":" + nonce, sentAt) != null) {
            return reject(exchange, HttpStatus.BAD_REQUEST, "replay", "This request was already processed.");
        }

        ServerHttpRequest decoded = request.mutate().headers(x -> {
            x.remove(H_KEY);
            x.remove(H_KID);
            x.remove(H_TS);
            x.remove(H_NONCE);
            x.remove(H_AUTH);
        }).build();
        ServerHttpResponse encryptingResponse = new EncryptingResponse(exchange.getResponse(), key, "R " + aad);

        boolean encryptedBody = "1".equals(h.getFirst(H_ENCRYPTED));
        MediaType type = h.getContentType();
        boolean multipart = type != null && MediaType.MULTIPART_FORM_DATA.isCompatibleWith(type);
        if (!encryptedBody) {
            ServerHttpRequest plain = decoded.mutate().headers(x -> x.remove(H_ENCRYPTED)).build();
            if (!required || multipart || method == HttpMethod.GET || h.getContentLength() == 0) {
                // File uploads stay multipart (the response is still encrypted)
                return chain.filter(exchange.mutate().request(plain).response(encryptingResponse).build());
            }
            // Required mode: only an empty body may be sent in plain text
            return DataBufferUtils.join(request.getBody())
                    .map(buf -> {
                        int n = buf.readableByteCount();
                        DataBufferUtils.release(buf);
                        return n;
                    })
                    .defaultIfEmpty(0)
                    .flatMap(n -> n > 0
                            ? reject(exchange, HttpStatus.BAD_REQUEST, "required", "Encrypted connection required. Please refresh the page.")
                            : chain.filter(exchange.mutate().request(new ServerHttpRequestDecorator(plain) {
                                @Override
                                public Flux<DataBuffer> getBody() {
                                    return Flux.empty();
                                }
                            }).response(encryptingResponse).build()));
        }

        return DataBufferUtils.join(request.getBody())
                .map(buf -> {
                    byte[] bytes = new byte[buf.readableByteCount()];
                    buf.read(bytes);
                    DataBufferUtils.release(buf);
                    return bytes;
                })
                .defaultIfEmpty(new byte[0])
                .flatMap(bytes -> {
                    byte[] plain;
                    try {
                        JsonNode node = mapper.readTree(bytes);
                        if (node == null || !node.hasNonNull("data")) throw new GeneralSecurityException("missing data");
                        plain = AesGcm.decrypt(key, node.get("data").asText(), "B " + aad);
                    } catch (Exception e) {
                        return reject(exchange, HttpStatus.BAD_REQUEST, "key", "Secure session expired. Please retry.");
                    }
                    ServerHttpRequest withBody = new ServerHttpRequestDecorator(decoded.mutate().headers(x -> {
                        x.remove(H_ENCRYPTED);
                        x.setContentLength(plain.length);
                    }).build()) {
                        @Override
                        public Flux<DataBuffer> getBody() {
                            return Flux.just(exchange.getResponse().bufferFactory().wrap(plain));
                        }
                    };
                    return chain.filter(exchange.mutate().request(withBody).response(encryptingResponse).build());
                });
    }

    private boolean isExempt(String path, HttpMethod method) {
        if (EXEMPT_PREFIXES.stream().anyMatch(path::startsWith)) return true;
        // <img src> / downloads cannot send headers: uploaded files (by unguessable id) and invoice PDFs
        return method == HttpMethod.GET && (path.startsWith("/api/v1/projects/files/") || path.matches("^/api/v1/invoices/[^/]+/pdf$"));
    }

    private Mono<Void> reject(ServerWebExchange exchange, HttpStatus status, String code, String message) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        response.getHeaders().set(H_ERROR, code);
        byte[] body = ("{\"success\":false,\"message\":\"" + message + "\"}").getBytes(StandardCharsets.UTF_8);
        return response.writeWith(Mono.just(response.bufferFactory().wrap(body)));
    }

    @Scheduled(fixedDelay = 60_000)
    void purgeNonces() {
        long cutoff = System.currentTimeMillis() - 2 * MAX_SKEW_MS;
        seenNonces.values().removeIf(t -> t < cutoff);
    }

    /** Encrypts JSON response bodies; binary and empty bodies pass through unchanged. */
    private static final class EncryptingResponse extends ServerHttpResponseDecorator {
        private final SecretKey key;
        private final String aad;

        EncryptingResponse(ServerHttpResponse delegate, SecretKey key, String aad) {
            super(delegate);
            this.key = key;
            this.aad = aad;
        }

        @Override
        public Mono<Void> writeWith(Publisher<? extends DataBuffer> body) {
            MediaType type = getHeaders().getContentType();
            if (type == null || !MediaType.APPLICATION_JSON.isCompatibleWith(type)) {
                return super.writeWith(body);
            }
            return DataBufferUtils.join(Flux.from(body))
                    .map(buf -> {
                        byte[] bytes = new byte[buf.readableByteCount()];
                        buf.read(bytes);
                        DataBufferUtils.release(buf);
                        return bytes;
                    })
                    .defaultIfEmpty(new byte[0])
                    .flatMap(bytes -> {
                        if (bytes.length == 0) return super.writeWith(Mono.empty());
                        byte[] out;
                        try {
                            out = ("{\"data\":\"" + AesGcm.encrypt(key, bytes, aad) + "\"}").getBytes(StandardCharsets.UTF_8);
                        } catch (GeneralSecurityException e) {
                            return Mono.error(e);
                        }
                        getHeaders().setContentLength(out.length);
                        getHeaders().set(H_ENCRYPTED, "1");
                        return super.writeWith(Mono.just(bufferFactory().wrap(out)));
                    });
        }

        @Override
        public Mono<Void> writeAndFlushWith(Publisher<? extends Publisher<? extends DataBuffer>> body) {
            return writeWith(Flux.from(body).flatMapSequential(p -> p));
        }
    }
}
