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
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    @NotBlank(message = "Category is required")
    private String category;

    @NotNull(message = "Budget is required")
    @DecimalMin(value = "100.0", message = "Budget must be at least ₹100")
    private BigDecimal budget;

    @NotNull(message = "Timeline in days is required")
    private Integer timelineDays;

    private List<String> skills;

    private List<String> attachmentUrls;
}
