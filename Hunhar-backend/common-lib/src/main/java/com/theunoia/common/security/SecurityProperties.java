package com.theunoia.common.security;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@ConfigurationProperties(prefix = "theunoia.security")
public class SecurityProperties {

    /** Shared secret the gateway (and peer services) send in X-Internal-Token. */
    private String internalToken = "dev-internal-token-change-me";

    /** Ant patterns reachable without an authenticated user (still require the internal token). */
    private List<String> publicPaths = new ArrayList<>();
}
