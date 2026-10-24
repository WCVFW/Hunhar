package com.theunoia.messaging.realtime;

import com.theunoia.common.security.SecurityProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;
import java.security.Principal;
import java.util.Map;

/**
 * STOMP over WebSocket at /ws (proxied by the API gateway, which validates the JWT from the
 * access_token query param and forwards X-User-Id + X-Internal-Token on the handshake).
 * Clients subscribe to /user/queue/messages and /user/queue/typing; they send to
 * /app/conversations/{id}/send and /app/conversations/{id}/typing.
 */
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final SecurityProperties security;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/queue", "/topic");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .addInterceptors(new GatewayHandshakeInterceptor(security.getInternalToken()))
                .setHandshakeHandler(new DefaultHandshakeHandler() {
                    @Override
                    protected Principal determineUser(org.springframework.http.server.ServerHttpRequest request,
                                                      WebSocketHandler wsHandler, Map<String, Object> attributes) {
                        String userId = (String) attributes.get("userId");
                        return () -> userId;
                    }
                });
    }

    static class GatewayHandshakeInterceptor implements HandshakeInterceptor {

        private final byte[] token;

        GatewayHandshakeInterceptor(String token) {
            this.token = token.getBytes(StandardCharsets.UTF_8);
        }

        @Override
        public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler,
                                       Map<String, Object> attributes) {
            String internal = request.getHeaders().getFirst("X-Internal-Token");
            String userId = request.getHeaders().getFirst("X-User-Id");
            if (internal == null || userId == null
                    || !MessageDigest.isEqual(token, internal.getBytes(StandardCharsets.UTF_8))) {
                response.setStatusCode(org.springframework.http.HttpStatus.UNAUTHORIZED);
                return false;
            }
            attributes.put("userId", userId);
            return true;
        }

        @Override
        public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler,
                                   Exception exception) {
            // no-op
        }
    }
}
