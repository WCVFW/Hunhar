package com.theunoia.project.service;

import com.theunoia.common.internal.UserDirectoryClient;
import com.theunoia.project.domain.Bid;
import com.theunoia.project.domain.Project;
import com.theunoia.project.domain.StoredFile;
import com.theunoia.project.domain.TeamCollaborator;
import com.theunoia.project.repository.BidRepository;
import com.theunoia.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/** Fills the non-persisted display fields (names, titles) on project-service responses. */
@Component
@RequiredArgsConstructor
public class ProjectViewEnricher {

    private final UserDirectoryClient userDirectory;
    private final BidRepository bidRepository;
    private final ProjectRepository projectRepository;

    public <T extends Collection<Project>> T projects(T projects, UUID viewerId) {
        if (projects.isEmpty()) return projects;
        Map<UUID, UserDirectoryClient.UserInfo> users = userDirectory.lookup(projects.stream()
                .flatMap(p -> Stream.of(p.getClientId(), p.getAwardedFreelancerId()))
                .filter(Objects::nonNull)
                .collect(Collectors.toSet()));

        Map<UUID, Bid> myBids = viewerId == null ? Map.of() : bidRepository
                .findByFreelancerIdAndProjectIdIn(viewerId, projects.stream().map(Project::getId).toList())
                .stream().collect(Collectors.toMap(Bid::getProjectId, Function.identity(), (a, b) -> a));

        for (Project p : projects) {
            UserDirectoryClient.UserInfo client = users.get(p.getClientId());
            if (client != null) {
                // Show the company name for business clients when they have one
                p.setClientName(client.professionalTitle() != null && "CLIENT".equals(client.role())
                        ? client.professionalTitle() : client.fullName());
                p.setClientAvatarUrl(client.avatarUrl());
            }
            UserDirectoryClient.UserInfo freelancer = users.get(p.getAwardedFreelancerId());
            if (freelancer != null) p.setFreelancerName(freelancer.fullName());
            Bid mine = myBids.get(p.getId());
            if (mine != null) p.setMyBidStatus(mine.getStatus());
            if (viewerId != null && viewerId.equals(p.getAwardedFreelancerId())) p.setMyRole("OWNER");
        }
        return projects;
    }

    public Project project(Project p, UUID viewerId) {
        projects(List.of(p), viewerId);
        return p;
    }

    public List<Bid> bids(List<Bid> bids) {
        if (bids.isEmpty()) return bids;
        Map<UUID, Project> projects = projectRepository.findAllById(bids.stream().map(Bid::getProjectId).collect(Collectors.toSet()))
                .stream().collect(Collectors.toMap(Project::getId, Function.identity()));
        Set<UUID> userIds = new HashSet<>();
        bids.forEach(b -> userIds.add(b.getFreelancerId()));
        projects.values().forEach(p -> userIds.add(p.getClientId()));
        Map<UUID, UserDirectoryClient.UserInfo> users = userDirectory.lookup(userIds);

        for (Bid b : bids) {
            Project p = projects.get(b.getProjectId());
            if (p != null) {
                b.setProjectTitle(p.getTitle());
                b.setProjectCategory(p.getCategory());
                b.setProjectStatus(p.getStatus());
                b.setProjectBudget(p.getBudget());
                b.setClientId(p.getClientId());
                UserDirectoryClient.UserInfo client = users.get(p.getClientId());
                if (client != null) b.setClientName(client.fullName());
            }
            UserDirectoryClient.UserInfo freelancer = users.get(b.getFreelancerId());
            if (freelancer != null) {
                b.setFreelancerName(freelancer.fullName());
                b.setFreelancerAvatarUrl(freelancer.avatarUrl());
            }
        }
        return bids;
    }

    public List<TeamCollaborator> team(List<TeamCollaborator> team) {
        if (team.isEmpty()) return team;
        Map<UUID, Project> projects = projectRepository.findAllById(team.stream().map(TeamCollaborator::getProjectId).collect(Collectors.toSet()))
                .stream().collect(Collectors.toMap(Project::getId, Function.identity()));
        Map<UUID, UserDirectoryClient.UserInfo> users = userDirectory.lookup(team.stream()
                .flatMap(t -> Stream.of(t.getPrimaryFreelancerId(), t.getCollaboratorFreelancerId()))
                .collect(Collectors.toSet()));
        for (TeamCollaborator t : team) {
            Project p = projects.get(t.getProjectId());
            if (p != null) t.setProjectTitle(p.getTitle());
            UserDirectoryClient.UserInfo inviter = users.get(t.getPrimaryFreelancerId());
            if (inviter != null) t.setPrimaryFreelancerName(inviter.fullName());
            UserDirectoryClient.UserInfo collab = users.get(t.getCollaboratorFreelancerId());
            if (collab != null) {
                t.setCollaboratorName(collab.fullName());
                t.setCollaboratorAvatarUrl(collab.avatarUrl());
            }
        }
        return team;
    }

    public List<StoredFile> files(List<StoredFile> files) {
        Map<UUID, UserDirectoryClient.UserInfo> users = userDirectory.lookup(
                files.stream().map(StoredFile::getOwnerId).collect(Collectors.toSet()));
        files.forEach(f -> {
            UserDirectoryClient.UserInfo u = users.get(f.getOwnerId());
            if (u != null) f.setOwnerName(u.fullName());
        });
        return files;
    }
}
