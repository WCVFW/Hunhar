package com.theunoia.project.domain;

import com.theunoia.common.model.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "team_collaborators")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamCollaborator extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID projectId;

    @Column(nullable = false)
    private UUID primaryFreelancerId;

    @Column(nullable = false)
    private UUID collaboratorFreelancerId;

    private String role; // e.g., "UI Designer", "QA Tester", "Backend Developer"

    @Builder.Default
    private String status = "INVITED"; // INVITED, ACCEPTED, DECLINED

    @Column(columnDefinition = "TEXT")
    private String message;

    // ----- Read-only view fields (not persisted) -----

    @Transient
    private String projectTitle;

    @Transient
    private String primaryFreelancerName;

    @Transient
    private String collaboratorName;

    @Transient
    private String collaboratorAvatarUrl;
}
