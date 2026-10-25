package com.theunoia.project.dto;

import com.theunoia.project.domain.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/** Everything the project workspace page shows, in one response. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkspaceViewDto {
    private Project project;
    /** CLIENT, OWNER (awarded freelancer), COLLABORATOR or ADMIN */
    private String myRole;
    private BigDecimal agreedAmount;
    private Integer agreedTimelineDays;
    private List<MilestoneView> milestones;
    private List<StoredFile> files;
    private List<TeamCollaborator> team;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MilestoneView {
        private Milestone milestone;
        private List<Deliverable> deliverables;
    }
}
