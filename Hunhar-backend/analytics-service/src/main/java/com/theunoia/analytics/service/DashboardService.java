package com.theunoia.analytics.service;

import com.theunoia.common.web.InternalClientFactory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

/**
 * Analytics dashboard: event-derived time series (analytics_db) combined with live, authoritative
 * counters from the owning services (users, projects, escrow). Each live call degrades gracefully.
 */
@Slf4j
@Service
public class DashboardService {

    private final MetricsRepository metrics;
    private final RestClient auth;
    private final RestClient projects;
    private final RestClient payments;
    private final RestClient users;

    public DashboardService(MetricsRepository metrics, InternalClientFactory clients,
                            @Value("${theunoia.services.auth}") String authUrl,
                            @Value("${theunoia.services.project}") String projectUrl,
                            @Value("${theunoia.services.payment}") String paymentUrl,
                            @Value("${theunoia.services.user}") String userUrl) {
        this.metrics = metrics;
        this.auth = clients.create(authUrl);
        this.projects = clients.create(projectUrl);
        this.payments = clients.create(paymentUrl);
        this.users = clients.create(userUrl);
    }

    public Map<String, Object> dashboard() {
        Map<String, Object> d = new LinkedHashMap<>();

        Map<String, Object> userStats = safe(() -> get(auth, "/internal/users/stats"));
        Map<String, Object> u = new LinkedHashMap<>();
        u.put("totalUsers", userStats != null ? userStats.get("totalUsers") : metrics.total("new_registrations"));
        u.put("freelancers", userStats != null ? userStats.get("freelancers") : null);
        u.put("clients", userStats != null ? userStats.get("clients") : null);
        u.put("pendingApproval", userStats != null ? userStats.get("pendingApproval") : null);
        u.put("activeUsersToday", metrics.activeUsers(1));
        u.put("activeUsers7d", metrics.activeUsers(7));
        u.put("activeUsers30d", metrics.activeUsers(30));
        u.put("newRegistrations7d", metrics.totalSince("new_registrations", 7));
        u.put("newRegistrations30d", metrics.totalSince("new_registrations", 30));
        d.put("users", u);

        Map<String, Object> projectStats = safe(() -> get(projects, "/internal/projects/stats"));
        Map<String, Object> p = new LinkedHashMap<>();
        p.put("totalProjects", projectStats != null ? projectStats.get("total") : metrics.total("projects_posted"));
        p.put("openProjects", projectStats != null ? projectStats.get("open") : null);
        p.put("activeProjects", projectStats != null ? projectStats.get("in_progress") : null);
        p.put("completedProjects", projectStats != null ? projectStats.get("completed") : metrics.total("projects_completed"));
        p.put("cancelledProjects", projectStats != null ? projectStats.get("cancelled") : metrics.total("projects_cancelled"));
        p.put("totalBids", projectStats != null ? projectStats.get("totalBids") : metrics.total("bids_submitted"));
        d.put("projects", p);

        Map<String, Object> paymentStats = safe(() -> get(payments, "/internal/payments/summary"));
        BigDecimal commission = metrics.total("commission_revenue");
        BigDecimal credits = metrics.total("credit_revenue");
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("platformRevenue", commission.add(credits));
        r.put("commissionEarnings", paymentStats != null ? paymentStats.get("commissionEarnings") : commission);
        r.put("creditSalesRevenue", credits);
        r.put("grossPaymentVolume", paymentStats != null ? paymentStats.get("totalPaymentsCaptured") : metrics.total("payments_volume"));
        r.put("pendingPaymentsInEscrow", paymentStats != null ? paymentStats.get("pendingPaymentsInEscrow") : null);
        r.put("pendingWithdrawals", paymentStats != null ? paymentStats.get("pendingWithdrawals") : null);
        r.put("revenue30d", metrics.totalSince("commission_revenue", 30).add(metrics.totalSince("credit_revenue", 30)));
        d.put("revenue", r);

        d.put("topFreelancers", safe(() -> users.get().uri("/internal/freelancers/top?limit=5").retrieve()
                .body(new ParameterizedTypeReference<List<Map<String, Object>>>() {
                })));
        d.put("userGrowth30d", metrics.series("new_registrations", 30));
        return d;
    }

    public Map<String, Object> trend(String metric, int days) {
        return Map.of("metric", metric, "days", days, "series", metrics.series(metric, Math.min(Math.max(days, 1), 366)),
                "byDimension", metrics.totalsByDimension(metric));
    }

    public Map<String, Object> monthly(String metric, int months) {
        return Map.of("metric", metric, "months", months, "series", metrics.monthly(metric, Math.min(Math.max(months, 1), 60)));
    }

    public List<String> metricNames() {
        return metrics.metricNames();
    }

    @Scheduled(cron = "0 10 0 * * *", zone = "Asia/Kolkata")
    public void refreshRollups() {
        metrics.refreshMonthly();
        log.info("Refreshed monthly_metrics materialized view");
    }

    private static Map<String, Object> get(RestClient client, String path) {
        return client.get().uri(path).retrieve().body(new ParameterizedTypeReference<>() {
        });
    }

    private static <T> T safe(Supplier<T> call) {
        try {
            return call.get();
        } catch (Exception e) {
            log.warn("Live analytics source unavailable: {}", e.getMessage());
            return null;
        }
    }
}
