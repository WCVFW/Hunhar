package com.theunoia.identity.web;

import com.theunoia.common.dto.ApiResponse;
import com.theunoia.common.security.AuthUser;
import com.theunoia.common.security.CurrentUser;
import com.theunoia.identity.dto.KycRequestDto;
import com.theunoia.identity.kyc.KycProvider;
import com.theunoia.identity.service.KycService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/kyc")
@RequiredArgsConstructor
public class KycController {

    private final KycService kycService;

    @PostMapping("/aadhaar")
    public ResponseEntity<ApiResponse<KycProvider.KycResult>> submitAadhaar(
            @CurrentUser AuthUser currentUser,
            @Valid @RequestBody KycRequestDto dto
    ) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        KycProvider.KycResult result = kycService.submitAadhaarVerification(currentUser.id(), dto);
        return ResponseEntity.ok(ApiResponse.ok("KYC verification processed", result));
    }

    @PostMapping("/{userId}/approve")
    public ResponseEntity<ApiResponse<Void>> adminApprove(
            @CurrentUser AuthUser currentUser,
            @PathVariable UUID userId,
            @RequestParam boolean approved
    ) {
        if (currentUser == null || !currentUser.hasRole("ADMIN")) {
            throw new com.theunoia.common.exception.ForbiddenException("Admin access required");
        }
        kycService.adminApproveKyc(userId, approved);
        return ResponseEntity.ok(ApiResponse.ok("KYC status updated", null));
    }
}
