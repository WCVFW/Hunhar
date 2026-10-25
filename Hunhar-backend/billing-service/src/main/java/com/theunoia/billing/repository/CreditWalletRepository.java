package com.theunoia.billing.repository;

import com.theunoia.billing.domain.CreditWallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CreditWalletRepository extends JpaRepository<CreditWallet, UUID> {

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("SELECT w FROM CreditWallet w WHERE w.userId = :userId")
    java.util.Optional<CreditWallet> findByIdForUpdate(@org.springframework.data.repository.query.Param("userId") UUID userId);
}
