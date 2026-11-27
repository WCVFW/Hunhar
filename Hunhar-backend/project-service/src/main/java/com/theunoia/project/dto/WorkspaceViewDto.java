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
        /** 1, 2, 3 ... in the order the phases run */
        private Integer phaseNumber;
        /** DONE (paid), CURRENT (the one being worked on) or LOCKED (opens after the previous phase is paid) */
        private String phaseState;
        /** Sub-tasks of this phase (kanban: TODO, IN_PROGRESS, DONE) */
        private List<com.theunoia.project.service.WorkspaceService.MilestoneTaskItem> tasks;
    }
}
