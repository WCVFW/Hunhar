package com.theunoia.project.service;

import com.theunoia.common.exception.BadRequestException;
import com.theunoia.common.exception.ResourceNotFoundException;
import com.theunoia.common.internal.NotificationPublisher;
import com.theunoia.common.internal.UserDirectoryClient;
import com.theunoia.common.security.AuthUser;
import com.theunoia.project.domain.Dispute;
import com.theunoia.project.domain.Project;
import com.theunoia.project.dto.CreateDisputeDto;
import com.theunoia.project.repository.DisputeRepository;
import com.theunoia.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class DisputeService {

    private final DisputeRepository disputeRepository;
    private final ProjectRepository projectRepository;
    private final ProjectAccessService access;
    private final UserDirectoryClient userDirectory;
    private final NotificationPublisher notifications;

    /** The client or the hired freelancer raises an issue on a project; admins resolve it. */
    @Transactional
    public Dispute raiseDispute(UUID projectId, AuthUser user, CreateDisputeDto dto) {
        Project project = access.requireParticipant(projectId, user);
        if (!access.isClient(project, user.id()) && !access.isAwardedFreelancer(project, user.id())) {
            throw new BadRequestException("Only the client and the hired freelancer can raise a dispute");
        }
        if (project.getAwardedFreelancerId() == null) {
            throw new BadRequestException("Disputes can be raised only after a freelancer is hired");
        }
        if (disputeRepository.existsByProjectIdAndRaisedByIdAndStatus(projectId, user.id(), "OPEN")) {
            throw new BadRequestException("You already have an open dispute on this project");
        }
        String reason = dto.getReason().trim();
        if (reason.length() < 20) throw new BadRequestException("Please describe the problem in at least 20 characters");

        Dispute dispute = disputeRepository.save(Dispute.builder()
                .projectId(projectId)
                .raisedById(user.id())
                .reason(reason.length() > 4000 ? reason.substring(0, 4000) : reason)
                .status("OPEN")
                .build());

        UUID other = access.isClient(project, user.id()) ? project.getAwardedFreelancerId() : project.getClientId();
        String link = other.equals(project.getClientId()) ? "/client/projects/" + projectId : "/freelancer/projects/" + projectId;
        notifications.notify(other, "DISPUTE_RAISED", "A dispute was raised",
                "A dispute was opened on \"" + project.getTitle() + "\". Hunhar support will review it and contact both of you.", link);
        return enrich(List.of(dispute)).get(0);
    }

    @Transactional(readOnly = true)
    public List<Dispute> getProjectDisputes(UUID projectId, AuthUser user) {
        access.requireParticipant(projectId, user);
        return enrich(disputeRepository.findByProjectId(projectId));
    }

    @Transactional(readOnly = true)
    public List<Dispute> getAllDisputes(String status) {
        List<Dispute> list = disputeRepository.findAllByOrderByCreatedAtDesc();
        if (status != null && !status.isBlank()) list = list.stream().filter(d -> d.getStatus().equalsIgnoreCase(status)).toList();
        return enrich(new ArrayList<>(list));
    }

    @Transactional
    public Dispute resolveDispute(UUID disputeId, String resolutionNotes, String status) {
        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new ResourceNotFoundException("Dispute not found"));
        if (!"OPEN".equals(dispute.getStatus())) throw new BadRequestException("This dispute is already closed");
        String st = status == null ? "" : status.trim().toUpperCase();
        if (!st.equals("RESOLVED") && !st.equals("DISMISSED")) throw new BadRequestException("Status must be RESOLVED or DISMISSED");
        if (resolutionNotes == null || resolutionNotes.trim().length() < 10) {
            throw new BadRequestException("Please write the decision (at least 10 characters) — both parties will see it");
        }
        dispute.setResolutionNotes(resolutionNotes.trim());
        dispute.setStatus(st);
        dispute.setResolvedAt(Instant.now());
        disputeRepository.save(dispute);

        projectRepository.findById(dispute.getProjectId()).ifPresent(p -> {
            String msg = "Dispute on \"" + p.getTitle() + "\" was " + st.toLowerCase() + ": " + resolutionNotes.trim();
            notifications.notify(p.getClientId(), "DISPUTE_" + st, "Dispute " + st.toLowerCase(), msg, "/client/projects/" + p.getId());
            if (p.getAwardedFreelancerId() != null) {
                notifications.notify(p.getAwardedFreelancerId(), "DISPUTE_" + st, "Dispute " + st.toLowerCase(), msg, "/freelancer/projects/" + p.getId());
            }
        });
        return enrich(List.of(dispute)).get(0);
    }

    private List<Dispute> enrich(List<Dispute> disputes) {
        if (disputes.isEmpty()) return disputes;
        Map<UUID, Project> projects = projectRepository.findAllById(disputes.stream().map(Dispute::getProjectId).collect(Collectors.toSet()))
                .stream().collect(Collectors.toMap(Project::getId, Function.identity()));
        Set<UUID> userIds = new HashSet<>();
        disputes.forEach(d -> userIds.add(d.getRaisedById()));
        projects.values().forEach(p -> Stream.of(p.getClientId(), p.getAwardedFreelancerId()).filter(Objects::nonNull).forEach(userIds::add));
        Map<UUID, UserDirectoryClient.UserInfo> users = userDirectory.lookup(userIds);

        for (Dispute d : disputes) {
            Project p = projects.get(d.getProjectId());
            if (p != null) {
                d.setProjectTitle(p.getTitle());
                d.setProjectBudget(p.getBudget());
                d.setClientId(p.getClientId());
                d.setFreelancerId(p.getAwardedFreelancerId());
                Optional.ofNullable(users.get(p.getClientId())).ifPresent(u -> d.setClientName(u.fullName()));
                Optional.ofNullable(users.get(p.getAwardedFreelancerId())).ifPresent(u -> d.setFreelancerName(u.fullName()));
            }
            UserDirectoryClient.UserInfo raiser = users.get(d.getRaisedById());
            if (raiser != null) {
                d.setRaisedByName(raiser.fullName());
                d.setRaisedByRole(raiser.role());
            }
        }
        return disputes;
    }
}
