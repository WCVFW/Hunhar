package com.theunoia.project.repository;

import com.theunoia.project.domain.Milestone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MilestoneRepository extends JpaRepository<Milestone, UUID> {
    List<Milestone> findByProjectId(UUID projectId);
    List<Milestone> findByProjectIdOrderByCreatedAtAsc(UUID projectId);
    List<Milestone> findByStatusAndSubmittedAtBefore(com.theunoia.project.domain.MilestoneStatus status, java.time.Instant before);
}
