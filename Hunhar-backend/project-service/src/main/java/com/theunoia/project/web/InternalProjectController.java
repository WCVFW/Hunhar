package com.theunoia.project.web;

import com.theunoia.project.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** Service-to-service endpoints (protected by the internal key, not routed by the gateway). */
@RestController
@RequestMapping("/internal")
@RequiredArgsConstructor
public class InternalProjectController {

    private final ProjectService projectService;

    @GetMapping("/stats")
    public Map<String, Object> stats() {
        return projectService.stats();
    }
}
