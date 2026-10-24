package com.theunoia.credit.repository;

import com.theunoia.credit.domain.CreditPackage;
import com.theunoia.credit.domain.CreditPurchase;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public final class CreditRepositories {

    private CreditRepositories() {
    }

    public interface CreditPackageRepository extends JpaRepository<CreditPackage, UUID> {
        List<CreditPackage> findByActiveTrueOrderByPositionAsc();
    }

    public interface CreditPurchaseRepository extends JpaRepository<CreditPurchase, UUID> {
    }
}
