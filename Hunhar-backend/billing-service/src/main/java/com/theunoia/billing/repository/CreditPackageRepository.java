package com.theunoia.billing.repository;

import com.theunoia.billing.domain.CreditPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CreditPackageRepository extends JpaRepository<CreditPackage, UUID> {
    List<CreditPackage> findByIsActiveTrue();
}
