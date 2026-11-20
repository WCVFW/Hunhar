package com.theunoia.identity.repository;

import com.theunoia.identity.domain.KycVerification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface KycVerificationRepository extends JpaRepository<KycVerification, UUID> {
}
