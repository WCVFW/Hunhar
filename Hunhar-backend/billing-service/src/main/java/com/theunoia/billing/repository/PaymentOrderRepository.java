package com.theunoia.billing.repository;

import com.theunoia.billing.domain.PaymentOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentOrderRepository extends JpaRepository<PaymentOrder, UUID> {
    Optional<PaymentOrder> findByGatewayOrderId(String gatewayOrderId);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(o.amount), 0) FROM PaymentOrder o WHERE o.purpose = :purpose AND o.status = :status")
    java.math.BigDecimal sumByPurposeAndStatus(@org.springframework.data.repository.query.Param("purpose") PaymentOrder.Purpose purpose, @org.springframework.data.repository.query.Param("status") PaymentOrder.Status status);
}
