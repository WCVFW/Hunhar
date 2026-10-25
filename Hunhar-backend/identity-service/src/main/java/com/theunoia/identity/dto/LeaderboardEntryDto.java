package com.theunoia.identity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardEntryDto {
    private int rank;
    private UUID userId;
    private String fullName;
    private String professionalTitle;
    private int completedProjects;
    private double rating;
    private BigDecimal revenueGenerated;
    private double responseRate;
    private double projectSuccessRate;
    private double leaderboardScore;
    private String avatarUrl;
    private List<String> skills;
    private String location;
}
