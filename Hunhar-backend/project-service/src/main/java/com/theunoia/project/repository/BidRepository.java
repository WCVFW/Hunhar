package com.theunoia.project.repository;

import com.theunoia.project.domain.Bid;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BidRepository extends JpaRepository<Bid, UUID> {
    List<Bid> findByProjectId(UUID projectId);
    List<Bid> findByFreelancerId(UUID freelancerId);
    Optional<Bid> findByProjectIdAndFreelancerId(UUID projectId, UUID freelancerId);
    List<Bid> findByFreelancerIdAndProjectIdIn(UUID freelancerId, java.util.Collection<UUID> projectIds);
    List<Bid> findByFreelancerIdOrderByCreatedAtDesc(UUID freelancerId);
    List<Bid> findByProjectIdOrderByCreatedAtDesc(UUID projectId);
    List<Bid> findTop20ByProjectIdInOrderByCreatedAtDesc(java.util.Collection<UUID> projectIds);
    long countByCreatedAtBetween(java.time.Instant from, java.time.Instant to);
}
