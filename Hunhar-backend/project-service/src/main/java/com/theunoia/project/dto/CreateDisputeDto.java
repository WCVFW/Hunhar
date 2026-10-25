package com.theunoia.project.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateDisputeDto {

    @NotBlank(message = "Reason is required")
    private String reason;
}
