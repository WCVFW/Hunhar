package com.theunoia.identity.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class KycRequestDto {

    @NotBlank(message = "Aadhaar number is required")
    @Pattern(regexp = "^[0-9]{12}$", message = "Aadhaar must be a 12-digit number")
    private String aadhaarNumber;

    @NotBlank(message = "Please upload a photo of your Aadhaar card")
    @jakarta.validation.constraints.Size(max = 500)
    private String documentUrl;
}
