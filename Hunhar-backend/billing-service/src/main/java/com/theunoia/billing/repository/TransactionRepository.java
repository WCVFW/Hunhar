package com.theunoia.billing.repository;

import com.theunoia.billing.domain.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {
    List<Transaction> findByUserIdOrderByCreatedAtDesc(UUID userId);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.type = :type AND t.status = com.theunoia.billing.domain.TransactionStatus.COMPLETED")
    java.math.BigDecimal sumByType(@org.springframework.data.repository.query.Param("type") com.theunoia.billing.domain.TransactionType type);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.type = :type AND t.status = com.theunoia.billing.domain.TransactionStatus.COMPLETED AND t.createdAt >= :from AND t.createdAt < :to")
    java.math.BigDecimal sumByTypeBetween(@org.springframework.data.repository.query.Param("type") com.theunoia.billing.domain.TransactionType type,
                                         @org.springframework.data.repository.query.Param("from") java.time.Instant from,
                                         @org.springframework.data.repository.query.Param("to") java.time.Instant to);

    List<Transaction> findTop500ByOrderByCreatedAtDesc();

    List<Transaction> findTop500ByTypeOrderByCreatedAtDesc(com.theunoia.billing.domain.TransactionType type);
}
