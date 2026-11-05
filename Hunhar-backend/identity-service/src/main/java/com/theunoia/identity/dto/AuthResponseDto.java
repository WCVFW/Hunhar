package com.theunoia.identity.dto;

import com.theunoia.identity.domain.KycStatus;
import com.theunoia.identity.domain.UserRole;
import com.theunoia.identity.domain.UserStatus;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponseDto {
    private String token;
    private String refreshToken;
    private UUID userId;
    private String email;
    private String fullName;
    private UserRole role;
    private UserStatus status;
    private KycStatus kycStatus;
    private String avatarUrl;

    /** Google sign-in for an email with no account yet: the client must choose FREELANCER or CLIENT and retry. */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Boolean needsRole;
}
