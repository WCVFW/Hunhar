package com.theunoia.auth.repository;

import com.theunoia.auth.domain.VerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface VerificationTokenRepository extends JpaRepository<VerificationToken, UUID> {

    Optional<VerificationToken> findByTokenHashAndPurpose(String tokenHash, VerificationToken.Purpose purpose);

    @Modifying
    @Query("UPDATE VerificationToken t SET t.usedAt = CURRENT_TIMESTAMP WHERE t.userId = :userId AND t.purpose = :purpose AND t.usedAt IS NULL")
    int invalidateOutstanding(@Param("userId") UUID userId, @Param("purpose") VerificationToken.Purpose purpose);
}
