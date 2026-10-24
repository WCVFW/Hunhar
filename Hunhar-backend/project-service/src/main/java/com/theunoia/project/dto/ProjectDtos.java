package com.theunoia.project.dto;

import com.theunoia.project.domain.Bid;
import com.theunoia.project.domain.Dispute;
import com.theunoia.project.domain.Milestone;
import com.theunoia.project.domain.Project;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public final class ProjectDtos {

    private ProjectDtos() {
    }

    // ------------------------------------------------------------------ projects

    public record ProjectRequest(
            @NotBlank @Size(min = 10, max = 200) String title,
            @NotBlank @Size(min = 30, max = 20000) String description,
            UUID categoryId,
            @NotNull Project.BudgetType budgetType,
            @NotNull @DecimalMin("100.00") BigDecimal budgetMin,
            @NotNull @DecimalMin("100.00") BigDecimal budgetMax,
            LocalDate deadline,
            Project.PaymentMode paymentMode,
            @NotEmpty @Size(max = 15) List<@NotBlank @Size(max = 60) String> skills,
            @Size(max = 10) List<@Valid AttachmentRequest> attachments,
            boolean publish) {
    }

    public record AttachmentRequest(@NotNull UUID fileId, @NotBlank @Size(max = 255) String fileName,
                                    @NotBlank @Size(max = 1000) String url) {
    }

    public record CancelRequest(@Size(max = 500) String reason) {
    }

    public record ProjectSummary(UUID id, UUID clientId, String title, String excerpt, UUID categoryId, String categoryName,
                                 String budgetType, BigDecimal budgetMin, BigDecimal budgetMax, String currency,
                                 LocalDate deadline, String status, String paymentMode, int creditCost, int bidCount,
                                 List<String> skills, Instant publishedAt) {
    }

    public record ProjectResponse(UUID id, UUID clientId, String title, String description, UUID categoryId,
                                  String budgetType, BigDecimal budgetMin, BigDecimal budgetMax, String currency,
                                  LocalDate deadline, String status, String paymentMode, int creditCost, int bidCount,
                                  UUID awardedBidId, UUID freelancerId, List<String> skills, List<Map<String, Object>> attachments,
                                  Instant publishedAt, Instant awardedAt, Instant completedAt, Instant createdAt,
                                  Map<String, Object> myBid) {
        public static ProjectResponse of(Project p, List<Map<String, Object>> attachments, Map<String, Object> myBid) {
            return new ProjectResponse(p.getId(), p.getClientId(), p.getTitle(), p.getDescription(), p.getCategoryId(),
                    p.getBudgetType().name(), p.getBudgetMin(), p.getBudgetMax(), p.getCurrency(), p.getDeadline(),
                    p.getStatus().name(), p.getPaymentMode().name(), p.getCreditCost(), p.getBidCount(), p.getAwardedBidId(),
                    p.getFreelancerId(), List.copyOf(p.getSkills()), attachments, p.getPublishedAt(), p.getAwardedAt(),
                    p.getCompletedAt(), p.getCreatedAt(), myBid);
        }
    }

    // ------------------------------------------------------------------ bids

    public record BidRequest(@NotNull @DecimalMin("100.00") BigDecimal amount,
                             @Min(1) @Max(365) int deliveryDays,
                             @NotBlank @Size(min = 50, max = 5000) String proposal) {
    }

    public record BidResponse(UUID id, UUID projectId, UUID freelancerId, BigDecimal amount, int deliveryDays, String proposal,
                              String status, int creditsSpent, Instant shortlistedAt, Instant createdAt, Instant updatedAt) {
        public static BidResponse of(Bid b) {
            return new BidResponse(b.getId(), b.getProjectId(), b.getFreelancerId(), b.getAmount(), b.getDeliveryDays(),
                    b.getProposal(), b.getStatus().name(), b.getCreditsSpent(), b.getShortlistedAt(), b.getCreatedAt(),
                    b.getUpdatedAt());
        }
    }

    /** Side-by-side comparison for the client's bid management screen. */
    public record BidComparison(int totalBids, BigDecimal lowestAmount, BigDecimal highestAmount, BigDecimal averageAmount,
                                Integer fastestDelivery, List<BidResponse> bids) {
    }

    // ------------------------------------------------------------------ workspace

    public record MilestoneRequest(@NotBlank @Size(max = 200) String title,
                                   @Size(max = 5000) String description,
                                   @NotNull @DecimalMin("100.00") BigDecimal amount,
                                   LocalDate dueDate) {
    }

    public record SubmitWorkRequest(@Size(max = 5000) String note,
                                    @Size(max = 20) List<@Valid AttachmentRequest> attachments) {
    }

    public record ReviewDecisionRequest(@Size(max = 2000) String note) {
    }

    public record ProgressUpdateRequest(@NotBlank @Size(max = 5000) String message,
                                        @Min(0) @Max(100) Short progressPercent) {
    }

    public record MilestoneResponse(UUID id, UUID projectId, String title, String description, BigDecimal amount,
                                    LocalDate dueDate, int position, String status, Instant fundedAt, Instant submittedAt,
                                    Instant approvedAt, Instant paidAt) {
        public static MilestoneResponse of(Milestone m) {
            return new MilestoneResponse(m.getId(), m.getProjectId(), m.getTitle(), m.getDescription(), m.getAmount(),
                    m.getDueDate(), m.getPosition(), m.getStatus().name(), m.getFundedAt(), m.getSubmittedAt(),
                    m.getApprovedAt(), m.getPaidAt());
        }
    }

    public record TeamInviteRequest(@NotNull UUID memberId, @Size(max = 60) String role) {
    }

    // ------------------------------------------------------------------ reviews & disputes

    public record ReviewRequest(@Min(1) @Max(5) int rating, @Size(max = 3000) String comment) {
    }

    public record DisputeRequest(UUID milestoneId,
                                 @NotBlank @Size(max = 50) String reason,
                                 @NotBlank @Size(min = 20, max = 5000) String description) {
    }

    public record DisputeResolution(@NotNull Dispute.Resolution resolution,
                                    @Min(0) @Max(100) Short freelancerSharePercent,
                                    @NotBlank @Size(max = 5000) String note,
                                    Project.Status projectStatusAfter) {
    }

    public record CategoryRequest(@NotBlank @Size(max = 100) String name, UUID parentId, int position, Boolean active) {
    }

    public record StatusChangeRequest(@NotNull Project.Status status, @Size(max = 500) String reason) {
    }
}
