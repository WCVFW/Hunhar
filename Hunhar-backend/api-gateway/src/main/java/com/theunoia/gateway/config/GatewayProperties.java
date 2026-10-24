package com.theunoia.gateway.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@ConfigurationProperties(prefix = "theunoia.gateway")
public class GatewayProperties {

    /** Base64 HS256 secret shared with auth-service (which signs the tokens). */
    private String jwtSecret;

    /** Added to every forwarded request; services reject calls without it. */
    private String internalToken;

    /** Downstream base URIs keyed by service name (auth, user, project, ...). */
    private Map<String, String> services = new HashMap<>();

    /** Routes where authentication is optional, as "METHOD /ant/pattern" or "/ant/pattern" (any method). */
    private List<String> publicRoutes = new ArrayList<>();

    private List<String> allowedOrigins = new ArrayList<>(List.of("http://localhost:3000"));

    public String service(String name) {
        String uri = services.get(name);
        if (uri == null) throw new IllegalStateException("No URI configured for service " + name);
        return uri;
    }
}
