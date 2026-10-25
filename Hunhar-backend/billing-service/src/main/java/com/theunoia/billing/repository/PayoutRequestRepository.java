package com.theunoia.billing.repository;

import com.theunoia.billing.domain.PayoutRequest;
import com.theunoia.billing.domain.PayoutStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PayoutRequestRepository extends JpaRepository<PayoutRequest, UUID> {
    List<PayoutRequest> findByFreelancerIdOrderByCreatedAtDesc(UUID freelancerId);
    List<PayoutRequest> findByStatus(PayoutStatus status);
}
