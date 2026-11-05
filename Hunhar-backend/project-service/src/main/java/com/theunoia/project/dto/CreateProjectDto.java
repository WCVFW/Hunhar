package com.theunoia.project.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class CreateProjectDto {

    @NotBlank(message = "Title is required")
    @jakarta.validation.constraints.Size(min = 5, max = 150, message = "Title must be 5-150 characters")
    private String title;

    @NotBlank(message = "Description is required")
    @jakarta.validation.constraints.Size(min = 30, max = 8000, message = "Description must be 30-8000 characters")
    private String description;

    @NotBlank(message = "Category is required")
    private String category;

    @NotNull(message = "Budget is required")
    @DecimalMin(value = "100.0", message = "Budget must be at least ₹100")
    private BigDecimal budget;

    @NotNull(message = "Timeline in days is required")
    @jakarta.validation.constraints.Min(value = 1, message = "Timeline must be at least 1 day")
    @jakarta.validation.constraints.Max(value = 365, message = "Timeline can be at most 365 days")
    private Integer timelineDays;

    private List<String> skills;

    private List<String> attachmentUrls;

    /** false = save as a draft (not visible to freelancers until published). Defaults to publishing. */
    private Boolean publish;
}
