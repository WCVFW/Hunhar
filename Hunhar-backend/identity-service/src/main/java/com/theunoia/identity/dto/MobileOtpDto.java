package com.theunoia.identity.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/** Mobile OTP send (otp empty) and verify requests. */
@Data
public class MobileOtpDto {

    @NotBlank(message = "Mobile number is required")
    // Spaces, dashes and +91 are allowed here; MobileOtpService.normalize() enforces the 10-digit rule
    @Pattern(regexp = "^[+0-9 ()-]{10,18}$", message = "Enter a valid 10-digit Indian mobile number")
    private String mobile;

    @Pattern(regexp = "^([0-9]{6})?$", message = "OTP must be a 6-digit code")
    private String otp;
}
