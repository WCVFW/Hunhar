package com.theunoia.identity.repository;

import com.theunoia.identity.domain.FreelancerProfile;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FreelancerProfileRepository extends JpaRepository<FreelancerProfile, UUID> {

    @Query("SELECT p FROM FreelancerProfile p ORDER BY p.leaderboardScore DESC")
    List<FreelancerProfile> findTopByOrderByLeaderboardScoreDesc(Pageable pageable);

    @Query("SELECT p FROM FreelancerProfile p JOIN FETCH p.user u " +
            "WHERE u.status <> com.theunoia.identity.domain.UserStatus.SUSPENDED " +
            "AND (:search IS NULL OR LOWER(u.fullName) LIKE CONCAT('%', :search, '%') " +
            "     OR LOWER(p.professionalTitle) LIKE CONCAT('%', :search, '%') " +
            "     OR LOWER(p.skills) LIKE CONCAT('%', :search, '%')) " +
            "ORDER BY p.leaderboardScore DESC")
    List<FreelancerProfile> searchLeaderboard(@Param("search") String search, Pageable pageable);

    @Query("SELECT p FROM FreelancerProfile p JOIN FETCH p.user u " +
            "WHERE u.status <> com.theunoia.identity.domain.UserStatus.SUSPENDED " +
            "AND (:excludeId IS NULL OR u.id <> :excludeId) " +
            "AND (:search IS NULL OR LOWER(u.fullName) LIKE CONCAT('%', :search, '%') " +
            "     OR LOWER(p.professionalTitle) LIKE CONCAT('%', :search, '%') " +
            "     OR LOWER(p.skills) LIKE CONCAT('%', :search, '%')) " +
            "AND (:skill IS NULL OR LOWER(p.skills) LIKE CONCAT('%', :skill, '%')) " +
            "ORDER BY p.leaderboardScore DESC")
    List<FreelancerProfile> searchDirectory(@Param("excludeId") UUID excludeId,
                                            @Param("search") String search,
                                            @Param("skill") String skill,
                                            Pageable pageable);

    long countByLeaderboardScoreGreaterThan(double score);
}
