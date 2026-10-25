package com.theunoia.identity.service;

import com.theunoia.common.exception.ResourceNotFoundException;
import com.theunoia.identity.domain.FreelancerProfile;
import com.theunoia.identity.dto.LeaderboardEntryDto;
import com.theunoia.identity.repository.FreelancerProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LeaderboardService {

    private final FreelancerProfileRepository freelancerProfileRepository;

    public List<LeaderboardEntryDto> getTopFreelancers(int limit, String search) {
        String q = search == null || search.isBlank() ? null : search.trim().toLowerCase();
        List<FreelancerProfile> profiles = freelancerProfileRepository
                .searchLeaderboard(q, PageRequest.of(0, Math.min(Math.max(limit, 1), 100)));

        List<LeaderboardEntryDto> entries = new ArrayList<>();
        for (FreelancerProfile p : profiles) {
            entries.add(toEntry(p));
        }
        return entries;
    }

    public LeaderboardEntryDto getStanding(UUID userId) {
        return freelancerProfileRepository.findById(userId)
                .map(this::toEntry)
                .orElseThrow(() -> new ResourceNotFoundException("You are not ranked yet"));
    }

    private LeaderboardEntryDto toEntry(FreelancerProfile p) {
        // Global rank, independent of any search filter
        int rank = (int) freelancerProfileRepository.countByLeaderboardScoreGreaterThan(p.getLeaderboardScore()) + 1;
        return LeaderboardEntryDto.builder()
                .rank(rank)
                .userId(p.getUserId())
                .fullName(p.getUser().getFullName())
                .professionalTitle(p.getProfessionalTitle())
                .completedProjects(p.getCompletedProjects())
                .rating(p.getRating())
                .revenueGenerated(p.getRevenueGenerated())
                .responseRate(p.getResponseRate())
                .projectSuccessRate(p.getProjectSuccessRate())
                .leaderboardScore(p.getLeaderboardScore())
                .avatarUrl(p.getUser().getAvatarUrl())
                .skills(FreelancerProfileService.splitSkills(p.getSkills()))
                .location(p.getLocation())
                .build();
    }
}
