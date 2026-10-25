package com.theunoia.identity.dto;

import com.theunoia.identity.domain.KycStatus;
import com.theunoia.identity.domain.UserRole;
import com.theunoia.identity.domain.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSummaryDto {
    private UUID id;
    private String email;
    private String fullName;
    private String mobile;
    private UserRole role;
    private UserStatus status;
    private KycStatus kycStatus;
    private boolean emailVerified;
    private String avatarUrl;
    private Object profile;
}
