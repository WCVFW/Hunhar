package com.theunoia.project.service;

import com.theunoia.common.exception.ForbiddenException;
import com.theunoia.common.exception.ResourceNotFoundException;
import com.theunoia.common.exception.UnauthorizedException;
import com.theunoia.common.security.AuthUser;
import com.theunoia.project.domain.Project;
import com.theunoia.project.repository.ProjectRepository;
import com.theunoia.project.repository.TeamCollaboratorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Who may see or act on a project workspace: the client who owns it, the awarded freelancer,
 * freelancers who accepted a team invite, and admins.
 */
@Service
@RequiredArgsConstructor
public class ProjectAccessService {

    private final ProjectRepository projectRepository;
    private final TeamCollaboratorRepository collaboratorRepository;

    public Project load(UUID projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
    }

    public static AuthUser requireUser(AuthUser user) {
        if (user == null) throw new UnauthorizedException("Authentication required");
        return user;
    }

    public boolean isClient(Project p, UUID userId) {
        return p.getClientId().equals(userId);
    }

    public boolean isAwardedFreelancer(Project p, UUID userId) {
        return userId.equals(p.getAwardedFreelancerId());
    }

    public boolean isCollaborator(Project p, UUID userId) {
        return collaboratorRepository.existsByProjectIdAndCollaboratorFreelancerIdAndStatus(p.getId(), userId, "ACCEPTED");
    }

    public boolean isParticipant(Project p, AuthUser user) {
        return user.hasRole("ADMIN") || isClient(p, user.id()) || isAwardedFreelancer(p, user.id()) || isCollaborator(p, user.id());
    }

    public Project requireParticipant(UUID projectId, AuthUser user) {
        Project p = load(projectId);
        if (!isParticipant(p, requireUser(user))) {
            throw new ForbiddenException("You are not part of this project");
        }
        return p;
    }

    public Project requireClient(UUID projectId, AuthUser user) {
        Project p = load(projectId);
        if (!isClient(p, requireUser(user).id()) && !user.hasRole("ADMIN")) {
            throw new ForbiddenException("Only the client who posted this project can do this");
        }
        return p;
    }

    /** The awarded freelancer or an accepted team member. */
    public Project requireDeliveryMember(UUID projectId, AuthUser user) {
        Project p = load(projectId);
        UUID id = requireUser(user).id();
        if (!isAwardedFreelancer(p, id) && !isCollaborator(p, id)) {
            throw new ForbiddenException("Only freelancers working on this project can do this");
        }
        return p;
    }
}
