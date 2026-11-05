package com.theunoia.identity.web;

import com.theunoia.common.dto.ApiResponse;
import com.theunoia.common.exception.ForbiddenException;
import com.theunoia.common.exception.UnauthorizedException;
import com.theunoia.common.security.AuthUser;
import com.theunoia.common.security.CurrentUser;
import com.theunoia.identity.domain.KycStatus;
import com.theunoia.identity.dto.KycRequestDto;
import com.theunoia.identity.service.KycService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/kyc")
@RequiredArgsConstructor
public class KycController {

    private final KycService kycService;

    /** Submit Aadhaar number + card photo for manual review. */
    @PostMapping("/aadhaar")
    public ResponseEntity<ApiResponse<Map<String, Object>>> submitAadhaar(@CurrentUser AuthUser currentUser, @Valid @RequestBody KycRequestDto dto) {
        return ResponseEntity.ok(ApiResponse.ok("KYC submitted for review", kycService.submit(requireUser(currentUser).id(), dto)));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Map<String, Object>>> myStatus(@CurrentUser AuthUser currentUser) {
        return ResponseEntity.ok(ApiResponse.ok(kycService.getStatus(requireUser(currentUser).id())));
    }

    /** Admin: KYC applications, optionally filtered by status (default: everything that was submitted). */
    @GetMapping("/admin")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> list(@CurrentUser AuthUser currentUser,
                                                                       @RequestParam(required = false) KycStatus status) {
        requireAdmin(currentUser);
        return ResponseEntity.ok(ApiResponse.ok(kycService.list(status)));
    }

    @PostMapping("/{userId}/approve")
    public ResponseEntity<ApiResponse<Void>> review(
            @CurrentUser AuthUser currentUser,
            @PathVariable UUID userId,
            @RequestParam boolean approved,
            @RequestParam(required = false) String reason
    ) {
        requireAdmin(currentUser);
        kycService.review(userId, approved, reason);
        return ResponseEntity.ok(ApiResponse.ok(approved ? "KYC approved" : "KYC rejected", null));
    }

    private static AuthUser requireUser(AuthUser user) {
        if (user == null) throw new UnauthorizedException("Authentication required");
        return user;
    }

    private static void requireAdmin(AuthUser user) {
        if (!requireUser(user).hasRole("ADMIN")) throw new ForbiddenException("Admin access required");
    }
}
