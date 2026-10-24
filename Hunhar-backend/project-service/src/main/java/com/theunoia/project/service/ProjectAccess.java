package com.theunoia.project.service;

import com.theunoia.common.exception.ApiException;
import com.theunoia.common.security.AuthUser;
import com.theunoia.project.domain.Project;
import com.theunoia.project.domain.TeamMember;
import com.theunoia.project.repository.ProjectRepositories.ProjectRepository;
import com.theunoia.project.repository.ProjectRepositories.TeamMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

/** Central authorization rules for project resources. */
@Component
@RequiredArgsConstructor
public class ProjectAccess {

    private final ProjectRepository projects;
    private final TeamMemberRepository team;

    public Project load(UUID projectId) {
        return projects.findById(projectId).orElseThrow(() -> ApiException.notFound("Project"));
    }

    public Project loadForUpdate(UUID projectId) {
        return projects.findByIdForUpdate(projectId).orElseThrow(() -> ApiException.notFound("Project"));
    }

    public Project requireOwner(UUID projectId, AuthUser user) {
        Project p = loadForUpdate(projectId);
        if (!p.isOwnedBy(user.id()) && !user.isAdmin()) throw ApiException.forbidden("Only the project owner can do this");
        return p;
    }

    /** Client owner, awarded freelancer, accepted collaborator or admin. */
    public Project requireParticipant(UUID projectId, AuthUser user) {
        Project p = load(projectId);
        if (!isParticipant(p, user)) throw ApiException.forbidden("You are not a participant of this project");
        return p;
    }

    /** Awarded freelancer or accepted collaborator (the people doing the work). */
    public Project requireWorker(UUID projectId, AuthUser user) {
        Project p = load(projectId);
        boolean worker = p.isAssignedTo(user.id())
                || team.existsByProjectIdAndMemberIdAndStatus(projectId, user.id(), TeamMember.Status.ACCEPTED);
        if (!worker) throw ApiException.forbidden("Only the assigned freelancer or team members can do this");
        return p;
    }

    public boolean isParticipant(Project p, AuthUser user) {
        return user.isAdmin() || p.isOwnedBy(user.id()) || p.isAssignedTo(user.id())
                || team.existsByProjectIdAndMemberIdAndStatus(p.getId(), user.id(), TeamMember.Status.ACCEPTED);
    }

    public static void requireStatus(Project p, Project.Status... allowed) {
        for (Project.Status s : allowed) {
            if (p.getStatus() == s) return;
        }
        throw ApiException.unprocessable("INVALID_PROJECT_STATE", "Action not allowed while project is " + p.getStatus());
    }
}
