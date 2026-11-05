package com.theunoia.gateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig {

    // First, so every response (including the encryption filters' errors) carries CORS headers
    // Production site (https://www.hunhar.in), its subdomains and local dev. Override with CORS_ALLOWED_ORIGINS.
    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE)
    public CorsWebFilter corsWebFilter(@Value("${theunoia.cors.allowed-origins}") List<String> allowedOrigins) {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.setAllowedOriginPatterns(allowedOrigins.stream().map(String::trim).filter(s -> !s.isEmpty()).toList());
        config.setAllowedHeaders(Arrays.asList("Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With",
                "X-Enc-Key", "X-Enc-Kid", "X-Enc-Ts", "X-Enc-Nonce", "X-Enc-Auth", "X-Enc-Target", "X-Encrypted"));
        config.setExposedHeaders(Arrays.asList("X-Encrypted", "X-Enc-Error", "Content-Disposition"));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return new CorsWebFilter(source);
    }
}
