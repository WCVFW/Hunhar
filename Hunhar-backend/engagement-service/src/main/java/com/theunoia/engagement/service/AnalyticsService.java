package com.theunoia.engagement.service;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Service
public class AnalyticsService {

    public PlatformAnalyticsDto getPlatformAnalytics() {
        return PlatformAnalyticsDto.builder()
                .totalUsers(1284)
                .activeUsers(942)
                .newRegistrationsThisMonth(168)
                .totalProjects(450)
                .activeProjects(86)
                .completedProjects(342)
                .totalRevenue(new BigDecimal("1250000.00"))
                .commissionEarnings(new BigDecimal("125000.00")) // 10%
                .pendingPayouts(new BigDecimal("45000.00"))
                .monthlyGrowth(List.of(
                        Map.of("month", "Jan", "users", 120, "projects", 35, "revenue", 95000),
                        Map.of("month", "Feb", "users", 210, "projects", 58, "revenue", 145000),
                        Map.of("month", "Mar", "users", 340, "projects", 92, "revenue", 230000),
                        Map.of("month", "Apr", "users", 560, "projects", 145, "revenue", 380000),
                        Map.of("month", "May", "users", 890, "projects", 260, "revenue", 680000),
                        Map.of("month", "Jun", "users", 1284, "projects", 450, "revenue", 1250000)
                ))
                .build();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlatformAnalyticsDto {
        private long totalUsers;
        private long activeUsers;
        private long newRegistrationsThisMonth;
        private long totalProjects;
        private long activeProjects;
        private long completedProjects;
        private BigDecimal totalRevenue;
        private BigDecimal commissionEarnings;
        private BigDecimal pendingPayouts;
        private List<Map<String, Object>> monthlyGrowth;
    }
}
