package com.theunoia.project.domain;

import com.theunoia.common.model.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "disputes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Dispute extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID projectId;

    @Column(nullable = false)
    private UUID raisedById;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Builder.Default
    private String status = "OPEN"; // OPEN, RESOLVED, DISMISSED

    @Column(columnDefinition = "TEXT")
    private String resolutionNotes;
}
