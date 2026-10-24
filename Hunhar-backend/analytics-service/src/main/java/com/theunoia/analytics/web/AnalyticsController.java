package com.theunoia.analytics.web;

import com.theunoia.analytics.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/** Admin panel - Analytics & Reporting. */
@RestController
@RequestMapping("/api/v1/admin/analytics")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AnalyticsController {

    private final DashboardService dashboard;

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard() {
        return dashboard.dashboard();
    }

    /** e.g. metric=new_registrations | projects_posted | payments_volume | commission_revenue | active ... */
    @GetMapping("/trends")
    public Map<String, Object> trend(@RequestParam String metric, @RequestParam(defaultValue = "30") int days) {
        return dashboard.trend(metric, days);
    }

    @GetMapping("/monthly")
    public Map<String, Object> monthly(@RequestParam String metric, @RequestParam(defaultValue = "12") int months) {
        return dashboard.monthly(metric, months);
    }

    @GetMapping("/metrics")
    public List<String> metrics() {
        return dashboard.metricNames();
    }

    @PostMapping("/rollups/refresh")
    public Map<String, String> refresh() {
        dashboard.refreshRollups();
        return Map.of("status", "refreshed");
    }
}
