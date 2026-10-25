package com.theunoia.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class DeliverableDto {

    @NotBlank(message = "Please describe what you are submitting")
    @Size(max = 5000)
    private String notes;

    @Size(max = 10, message = "At most 10 files per submission")
    private List<@Size(max = 300) String> fileUrls;
}
