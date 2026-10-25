package com.theunoia.project.repository;

import com.theunoia.project.domain.TeamCollaborator;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TeamCollaboratorRepository extends JpaRepository<TeamCollaborator, UUID> {
    List<TeamCollaborator> findByProjectId(UUID projectId);
    List<TeamCollaborator> findByCollaboratorFreelancerId(UUID collaboratorFreelancerId);
    List<TeamCollaborator> findByCollaboratorFreelancerIdOrderByCreatedAtDesc(UUID collaboratorFreelancerId);
    List<TeamCollaborator> findByPrimaryFreelancerIdOrderByCreatedAtDesc(UUID primaryFreelancerId);
    List<TeamCollaborator> findByCollaboratorFreelancerIdAndStatus(UUID collaboratorFreelancerId, String status);
    boolean existsByProjectIdAndCollaboratorFreelancerIdAndStatus(UUID projectId, UUID collaboratorFreelancerId, String status);
    boolean existsByProjectIdAndCollaboratorFreelancerIdAndStatusIn(UUID projectId, UUID collaboratorFreelancerId, java.util.Collection<String> statuses);
}
