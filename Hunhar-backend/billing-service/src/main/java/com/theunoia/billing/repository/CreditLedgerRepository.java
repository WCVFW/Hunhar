package com.theunoia.billing.repository;

import com.theunoia.billing.domain.CreditLedger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CreditLedgerRepository extends JpaRepository<CreditLedger, UUID> {
    List<CreditLedger> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
