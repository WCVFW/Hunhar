package com.theunoia.project.service;

import com.theunoia.common.exception.BadRequestException;
import com.theunoia.common.exception.ForbiddenException;
import com.theunoia.common.exception.ResourceNotFoundException;
import com.theunoia.common.internal.NotificationPublisher;
import com.theunoia.common.security.AuthUser;
import com.theunoia.project.domain.Project;
import com.theunoia.project.domain.ProjectStatus;
import com.theunoia.project.domain.TeamCollaborator;
import com.theunoia.project.dto.InviteCollaboratorDto;
import com.theunoia.project.repository.TeamCollaboratorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CollaborationService {

    private final TeamCollaboratorRepository collaboratorRepository;
    private final ProjectAccessService access;
    private final ProjectViewEnricher enricher;
    private final NotificationPublisher notifications;

    /** The awarded (lead) freelancer invites another freelancer to help on an active project. */
    @Transactional
    public TeamCollaborator inviteCollaborator(UUID projectId, AuthUser inviter, InviteCollaboratorDto dto) {
        Project project = access.load(projectId);
        if (!access.isAwardedFreelancer(project, inviter.id())) {
            throw new ForbiddenException("Only the freelancer leading this project can invite teammates");
        }
        if (project.getStatus() != ProjectStatus.ACTIVE) {
            throw new BadRequestException("You can only build a team on an active project");
        }
        if (dto.getCollaboratorFreelancerId().equals(inviter.id())) {
            throw new BadRequestException("You cannot invite yourself");
        }
        if (collaboratorRepository.existsByProjectIdAndCollaboratorFreelancerIdAndStatusIn(
                projectId, dto.getCollaboratorFreelancerId(), List.of("INVITED", "ACCEPTED"))) {
            throw new BadRequestException("This freelancer is already invited to this project");
        }

        TeamCollaborator collaborator = collaboratorRepository.save(TeamCollaborator.builder()
                .projectId(projectId)
                .primaryFreelancerId(inviter.id())
                .collaboratorFreelancerId(dto.getCollaboratorFreelancerId())
                .role(dto.getRole().trim())
                .message(dto.getMessage())
                .status("INVITED")
                .build());

        notifications.notify(dto.getCollaboratorFreelancerId(), "TEAM_INVITE",
                "Team invitation",
                "You were invited to join \"" + project.getTitle() + "\" as " + dto.getRole().trim() + ".",
                "/freelancer/team");
        return enricher.team(List.of(collaborator)).get(0);
    }

    @Transactional(readOnly = true)
    public List<TeamCollaborator> getProjectTeam(UUID projectId, AuthUser user) {
        access.requireParticipant(projectId, user);
        return enricher.team(collaboratorRepository.findByProjectId(projectId));
    }

    @Transactional(readOnly = true)
    public List<TeamCollaborator> getMyInvites(UUID freelancerId) {
        return enricher.team(collaboratorRepository.findByCollaboratorFreelancerIdOrderByCreatedAtDesc(freelancerId));
    }

    @Transactional(readOnly = true)
    public List<TeamCollaborator> getSentInvites(UUID freelancerId) {
        return enricher.team(collaboratorRepository.findByPrimaryFreelancerIdOrderByCreatedAtDesc(freelancerId));
    }

    @Transactional
    public TeamCollaborator respondToInvite(UUID inviteId, boolean accept, AuthUser user) {
        TeamCollaborator tc = collaboratorRepository.findById(inviteId)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation not found"));
        if (!tc.getCollaboratorFreelancerId().equals(user.id())) {
            throw new ForbiddenException("This invitation is not addressed to you");
        }
        if (!"INVITED".equals(tc.getStatus())) {
            throw new BadRequestException("You already responded to this invitation");
        }
        tc.setStatus(accept ? "ACCEPTED" : "DECLINED");
        collaboratorRepository.save(tc);

        Project project = access.load(tc.getProjectId());
        notifications.notify(tc.getPrimaryFreelancerId(), accept ? "TEAM_INVITE_ACCEPTED" : "TEAM_INVITE_DECLINED",
                accept ? "Invitation accepted" : "Invitation declined",
                "Your teammate invitation for \"" + project.getTitle() + "\" was " + (accept ? "accepted." : "declined."),
                "/freelancer/projects/" + project.getId());
        return enricher.team(List.of(tc)).get(0);
    }

    /** Lead freelancer removes a teammate (or cancels a pending invite). */
    @Transactional
    public void removeCollaborator(UUID inviteId, AuthUser user) {
        TeamCollaborator tc = collaboratorRepository.findById(inviteId)
                .orElseThrow(() -> new ResourceNotFoundException("Team member not found"));
        if (!tc.getPrimaryFreelancerId().equals(user.id())) {
            throw new ForbiddenException("Only the lead freelancer can remove teammates");
        }
        collaboratorRepository.delete(tc);
    }
}
