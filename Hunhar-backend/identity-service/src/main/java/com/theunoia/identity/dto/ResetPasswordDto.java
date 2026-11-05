package com.theunoia.identity.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResetPasswordDto {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Verification code is required")
    @Pattern(regexp = "^[0-9]{6}$", message = "Enter the 6-digit code from your email")
    private String otp;

    @NotBlank(message = "New password is required")
    @Size(min = 8, max = 100, message = "Password must be at least 8 characters")
    private String newPassword;
}
