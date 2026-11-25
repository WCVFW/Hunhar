package com.theunoia.project.repository;

import com.theunoia.project.domain.MilestonePlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface MilestonePlanRepository extends JpaRepository<MilestonePlan, UUID> {

    Optional<MilestonePlan> findByProjectId(UUID projectId);
}
