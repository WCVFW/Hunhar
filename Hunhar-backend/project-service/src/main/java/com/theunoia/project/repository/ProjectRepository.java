package com.theunoia.project.repository;

import com.theunoia.project.domain.Project;
import com.theunoia.project.domain.ProjectStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID>, org.springframework.data.jpa.repository.JpaSpecificationExecutor<Project> {
    List<Project> findByClientId(UUID clientId);
    List<Project> findByAwardedFreelancerId(UUID freelancerId);
    List<Project> findByStatus(ProjectStatus status);
    long countByStatus(ProjectStatus status);
    long countByCreatedAtBetween(java.time.Instant from, java.time.Instant to);
    List<Project> findByClientIdOrderByCreatedAtDesc(UUID clientId);

    @Query("SELECT p FROM Project p WHERE p.status = 'OPEN' AND " +
            "(:category IS NULL OR p.category = :category) AND " +
            "(:search IS NULL OR LOWER(p.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Project> searchProjects(String category, String search, Pageable pageable);
}
