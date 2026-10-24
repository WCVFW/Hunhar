package com.theunoia.project.web;

import com.theunoia.common.exception.ApiException;
import com.theunoia.project.domain.Milestone;
import com.theunoia.project.domain.Project;
import com.theunoia.project.repository.ProjectRepositories.MilestoneRepository;
import com.theunoia.project.repository.ProjectRepositories.ProjectRepository;
import com.theunoia.project.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/** Endpoints for payment-service (milestone funding checks), messaging-service and analytics-service. */
@RestController
@RequestMapping("/internal")
@RequiredArgsConstructor
public class InternalProjectController {

    private final MilestoneRepository milestones;
    private final ProjectRepository projects;
    private final ProjectService projectService;

    @GetMapping("/milestones/{id}")
    @Transactional(readOnly = true)
    public Map<String, Object> milestone(@PathVariable UUID id) {
        Milestone m = milestones.findById(id).orElseThrow(() -> ApiException.notFound("Milestone"));
        Project p = projects.findById(m.getProjectId()).orElseThrow(() -> ApiException.notFound("Project"));
        Map<String, Object> r = new HashMap<>();
        r.put("milestoneId", m.getId());
        r.put("projectId", p.getId());
        r.put("projectTitle", p.getTitle());
        r.put("clientId", p.getClientId());
        r.put("freelancerId", p.getFreelancerId());
        r.put("amount", m.getAmount());
        r.put("title", m.getTitle());
        r.put("status", m.getStatus().name());
        r.put("projectStatus", p.getStatus().name());
        r.put("paymentMode", p.getPaymentMode().name());
        return r;
    }

    @GetMapping("/projects/{id}")
    @Transactional(readOnly = true)
    public Map<String, Object> project(@PathVariable UUID id) {
        Project p = projects.findById(id).orElseThrow(() -> ApiException.notFound("Project"));
        Map<String, Object> r = new HashMap<>();
        r.put("projectId", p.getId());
        r.put("title", p.getTitle());
        r.put("clientId", p.getClientId());
        r.put("freelancerId", p.getFreelancerId());
        r.put("status", p.getStatus().name());
        r.put("paymentMode", p.getPaymentMode().name());
        return r;
    }

    @GetMapping("/projects/stats")
    public Map<String, Object> stats() {
        return projectService.platformStats();
    }
}
