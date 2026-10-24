package com.theunoia.user.repository;

import com.theunoia.user.domain.Certification;
import com.theunoia.user.domain.ClientProfile;
import com.theunoia.user.domain.Experience;
import com.theunoia.user.domain.FreelancerProfile;
import com.theunoia.user.domain.PortfolioItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Spring Data repositories of the user-service, grouped for readability. */
public final class ProfileRepositories {

    private ProfileRepositories() {
    }

    public interface FreelancerProfileRepository extends JpaRepository<FreelancerProfile, UUID> {
        @Modifying
        @Query("UPDATE FreelancerProfile p SET p.verificationStatus = :status WHERE p.userId = :userId")
        int updateStatus(@Param("userId") UUID userId, @Param("status") String status);
    }

    public interface ClientProfileRepository extends JpaRepository<ClientProfile, UUID> {
        @Modifying
        @Query("UPDATE ClientProfile p SET p.verificationStatus = :status WHERE p.userId = :userId")
        int updateStatus(@Param("userId") UUID userId, @Param("status") String status);
    }

    public interface PortfolioItemRepository extends JpaRepository<PortfolioItem, UUID> {
        List<PortfolioItem> findByUserIdOrderByCreatedAtDesc(UUID userId);

        Optional<PortfolioItem> findByIdAndUserId(UUID id, UUID userId);

        long countByUserId(UUID userId);
    }

    public interface ExperienceRepository extends JpaRepository<Experience, UUID> {
        List<Experience> findByUserIdOrderByStartDateDesc(UUID userId);

        Optional<Experience> findByIdAndUserId(UUID id, UUID userId);
    }

    public interface CertificationRepository extends JpaRepository<Certification, UUID> {
        List<Certification> findByUserIdOrderByIssuedOnDesc(UUID userId);

        Optional<Certification> findByIdAndUserId(UUID id, UUID userId);
    }
}
