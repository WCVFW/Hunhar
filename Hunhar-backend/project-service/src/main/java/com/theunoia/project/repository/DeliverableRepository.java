package com.theunoia.project.repository;

import com.theunoia.project.domain.Deliverable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DeliverableRepository extends JpaRepository<Deliverable, UUID> {
    List<Deliverable> findByMilestoneId(UUID milestoneId);
    List<Deliverable> findByProjectId(UUID projectId);
    List<Deliverable> findByProjectIdOrderByCreatedAtDesc(UUID projectId);
}
