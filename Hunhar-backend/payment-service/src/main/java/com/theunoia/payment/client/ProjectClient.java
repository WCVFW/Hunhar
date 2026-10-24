package com.theunoia.payment.client;

import com.theunoia.common.web.InternalClientFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;
import java.util.UUID;

@Component
public class ProjectClient {

    private final RestClient client;

    public ProjectClient(InternalClientFactory factory, @Value("${theunoia.services.project}") String baseUrl) {
        this.client = factory.create(baseUrl);
    }

    /** {milestoneId, projectId, clientId, freelancerId, amount, status, projectStatus, paymentMode, title, projectTitle} */
    public Map<String, Object> milestone(UUID milestoneId) {
        return client.get().uri("/internal/milestones/{id}", milestoneId).retrieve()
                .body(new ParameterizedTypeReference<>() {
                });
    }

    public Map<String, Object> project(UUID projectId) {
        return client.get().uri("/internal/projects/{id}", projectId).retrieve()
                .body(new ParameterizedTypeReference<>() {
                });
    }
}
