package com.theunoia.engagement.web;

import com.theunoia.common.dto.ApiResponse;
import com.theunoia.common.exception.ForbiddenException;
import com.theunoia.common.security.AuthUser;
import com.theunoia.common.security.CurrentUser;
import com.theunoia.engagement.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    /** Admin only: live platform numbers (users, projects, money, engagement). */
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAnalyticsSummary(@CurrentUser AuthUser user) {
        if (user == null || !user.hasRole("ADMIN")) throw new ForbiddenException("Admin access required");
        return ResponseEntity.ok(ApiResponse.ok(analyticsService.getPlatformAnalytics()));
    }
}
