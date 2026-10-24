package com.theunoia.notification.client;

import com.theunoia.common.web.InternalClientFactory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.UUID;

@Slf4j
@Component
public class UserClient {

    private final RestClient client;

    public UserClient(InternalClientFactory factory, @Value("${theunoia.services.user}") String baseUrl) {
        this.client = factory.create(baseUrl);
    }

    public List<UUID> matchingFreelancers(List<String> skills) {
        if (skills.isEmpty()) return List.of();
        List<UUID> ids = client.get()
                .uri(u -> u.path("/internal/freelancers/matching").queryParam("skills", String.join(",", skills))
                        .queryParam("limit", 200).build())
                .retrieve().body(new ParameterizedTypeReference<>() {
                });
        return ids == null ? List.of() : ids;
    }
}
