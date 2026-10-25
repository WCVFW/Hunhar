package com.theunoia.billing.repository;

import com.theunoia.billing.domain.Wallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface WalletRepository extends JpaRepository<Wallet, UUID> {

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("SELECT w FROM Wallet w WHERE w.userId = :userId")
    java.util.Optional<Wallet> findByIdForUpdate(@org.springframework.data.repository.query.Param("userId") UUID userId);
}
