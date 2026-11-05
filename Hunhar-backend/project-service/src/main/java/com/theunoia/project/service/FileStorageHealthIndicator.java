package com.theunoia.project.service;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

import java.util.Map;

/** Shows up as "fileStorage" in /actuator/health; DOWN when the S3 bucket (or local uploads folder) cannot be used. */
@Component("fileStorage")
@RequiredArgsConstructor
public class FileStorageHealthIndicator implements HealthIndicator {

    private final FileStorageService fileStorageService;

    @Override
    public Health health() {
        Map<String, Object> d = fileStorageService.health();
        Health.Builder b = Boolean.TRUE.equals(d.get("ok")) ? Health.up() : Health.down();
        d.forEach((k, v) -> {
            if (!"ok".equals(k)) b.withDetail(k, v);
        });
        return b.build();
    }
}
