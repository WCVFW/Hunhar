package com.theunoia.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

@Data
public class InviteCollaboratorDto {

    @NotNull(message = "Collaborator Freelancer ID is required")
    private UUID collaboratorFreelancerId;

    @NotBlank(message = "Role is required")
    @Size(max = 80)
    private String role;

    @Size(max = 1000)
    private String message;
}
