package com.theunoia.project.domain;

import com.theunoia.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "team_members")
public class TeamMember extends BaseEntity {

    public enum Status { INVITED, ACCEPTED, DECLINED, REMOVED }

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    /** The awarded freelancer who formed the team. */
    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    @Column(name = "member_id", nullable = false)
    private UUID memberId;

    @Column(nullable = false)
    private String role = "COLLABORATOR";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.INVITED;

    @Column(name = "responded_at")
    private Instant respondedAt;
}
