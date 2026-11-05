package com.theunoia.common.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/** Warns at startup when a service still runs with the built-in development secrets. */
@Slf4j
@Component
public class SecretsCheck {

    static final String DEV_INTERNAL_KEY = "hunhar-internal-dev-key-change-me";
    static final String DEV_JWT_SECRET = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";

    @Value("${spring.application.name:service}")
    private String service;

    @Value("${theunoia.internal.key:" + DEV_INTERNAL_KEY + "}")
    private String internalKey;

    @Value("${JWT_SECRET:" + DEV_JWT_SECRET + "}")
    private String jwtSecret;

    @EventListener(ApplicationReadyEvent.class)
    public void check() {
        if (DEV_INTERNAL_KEY.equals(internalKey)) {
            log.warn("[{}] INTERNAL_API_KEY is not set - using the development key. Set it in Hunhar-backend/.env before going live.", service);
        }
        if (DEV_JWT_SECRET.equals(jwtSecret)) {
            log.warn("[{}] JWT_SECRET is not set - using the development secret. Set it in Hunhar-backend/.env before going live.", service);
        } else if (jwtSecret.length() < 32) {
            log.error("[{}] JWT_SECRET is shorter than 32 characters - logins will fail. Use a long random value.", service);
        }
    }
}
