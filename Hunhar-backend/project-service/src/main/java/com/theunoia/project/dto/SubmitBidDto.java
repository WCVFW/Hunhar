package com.theunoia.project.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class SubmitBidDto {

    @NotNull(message = "Proposed cost is required")
    @DecimalMin(value = "50.0", message = "Proposed cost must be at least ₹50")
    @DecimalMax(value = "10000000", message = "Proposed cost is too high")
    private BigDecimal proposedCost;

    @NotNull(message = "Delivery timeline is required")
    @Min(value = 1, message = "Delivery time must be at least 1 day")
    @Max(value = 365, message = "Delivery time can be at most 365 days")
    private Integer deliveryTimelineDays;

    @NotBlank(message = "Proposal message is required")
    @Size(min = 30, max = 5000, message = "Cover letter must be 30-5000 characters")
    private String proposalMessage;

    @Size(max = 5, message = "At most 5 attachments")
    private List<@Size(max = 300) String> attachmentUrls;
}
