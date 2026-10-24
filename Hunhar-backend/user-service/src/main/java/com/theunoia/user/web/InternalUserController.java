package com.theunoia.user.web;

import com.theunoia.user.dto.UserDtos.FreelancerCard;
import com.theunoia.user.repository.StatsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/internal/freelancers")
@RequiredArgsConstructor
public class InternalUserController {

    private final StatsRepository stats;

    /** Used by notification-service for "new project matches" WhatsApp alerts. */
    @GetMapping("/matching")
    public List<UUID> matching(@RequestParam List<String> skills, @RequestParam(defaultValue = "200") int limit) {
        return stats.matchingFreelancers(skills, Math.min(limit, 500));
    }

    /** Used by analytics-service for the "Top Freelancers" widget. */
    @GetMapping("/top")
    public List<FreelancerCard> top(@RequestParam(defaultValue = "10") int limit) {
        return stats.leaderboard(Math.min(limit, 100));
    }
}
