package com.theunoia.identity.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PortfolioItemDto {
    private UUID id;

    @NotBlank(message = "Title is required")
    @Size(max = 150)
    private String title;

    @Size(max = 80)
    private String category;

    @Min(value = 1990, message = "Invalid year")
    @Max(value = 2100, message = "Invalid year")
    private Integer year;

    @Size(max = 2000)
    private String description;

    @Size(max = 500)
    private String link;

    @Size(max = 500)
    private String imageUrl;
}
