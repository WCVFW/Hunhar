package com.theunoia.common.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI serviceOpenApi(@Value("${spring.application.name}") String name) {
        return new OpenAPI().info(new Info()
                .title("THEUNOiA " + name)
                .version("v1")
                .description("Called through the API gateway at /api/v1/**. Identity is supplied by the gateway "
                        + "in X-User-* headers after JWT validation."));
    }
}
