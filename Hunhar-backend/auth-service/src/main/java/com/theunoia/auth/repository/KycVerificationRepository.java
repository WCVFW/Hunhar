package com.theunoia.auth.repository;

import com.theunoia.auth.domain.KycVerification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface KycVerificationRepository extends JpaRepository<KycVerification, UUID> {

    Optional<KycVerification> findFirstByUserIdOrderByCreatedAtDesc(UUID userId);

    List<KycVerification> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
