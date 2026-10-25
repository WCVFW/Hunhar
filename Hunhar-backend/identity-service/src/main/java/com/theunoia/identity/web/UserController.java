package com.theunoia.identity.web;

import com.theunoia.common.dto.ApiResponse;
import com.theunoia.common.exception.ForbiddenException;
import com.theunoia.common.exception.UnauthorizedException;
import com.theunoia.common.security.AuthUser;
import com.theunoia.common.security.CurrentUser;
import com.theunoia.identity.domain.UserStatus;
import com.theunoia.identity.dto.*;
import com.theunoia.identity.service.FreelancerProfileService;
import com.theunoia.identity.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final FreelancerProfileService profileService;

    // ------------------------------------------------------------ own freelancer profile

    @GetMapping("/me/profile")
    public ResponseEntity<ApiResponse<FreelancerProfileDto>> getMyProfile(@CurrentUser AuthUser user) {
        return ResponseEntity.ok(ApiResponse.ok(profileService.getOwnProfile(requireUser(user).id())));
    }

    @PutMapping("/me/profile")
    public ResponseEntity<ApiResponse<FreelancerProfileDto>> updateMyProfile(
            @CurrentUser AuthUser user, @Valid @RequestBody UpdateFreelancerProfileDto dto) {
        return ResponseEntity.ok(ApiResponse.ok("Profile updated",
                profileService.updateProfile(requireUser(user).id(), dto)));
    }

    @PutMapping("/me/payout")
    public ResponseEntity<ApiResponse<FreelancerProfileDto>> updateMyPayout(
            @CurrentUser AuthUser user, @Valid @RequestBody UpdatePayoutDto dto) {
        return ResponseEntity.ok(ApiResponse.ok("Payout details saved",
                profileService.updatePayout(requireUser(user).id(), dto)));
    }

    @PutMapping("/me/notification-prefs")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> updateMyNotificationPrefs(
            @CurrentUser AuthUser user, @RequestBody Map<String, Boolean> prefs) {
        return ResponseEntity.ok(ApiResponse.ok("Notification preferences saved",
                profileService.updateNotificationPrefs(requireUser(user).id(), prefs)));
    }

    @PostMapping("/me/password")
    public ResponseEntity<ApiResponse<Void>> changeMyPassword(
            @CurrentUser AuthUser user, @Valid @RequestBody ChangePasswordDto dto) {
        profileService.changePassword(requireUser(user).id(), dto);
        return ResponseEntity.ok(ApiResponse.ok("Password changed successfully", null));
    }

    @PostMapping("/me/portfolio")
    public ResponseEntity<ApiResponse<PortfolioItemDto>> addPortfolioItem(
            @CurrentUser AuthUser user, @Valid @RequestBody PortfolioItemDto dto) {
        return ResponseEntity.ok(ApiResponse.ok("Portfolio item added",
                profileService.addPortfolioItem(requireUser(user).id(), dto)));
    }

    @PutMapping("/me/portfolio/{itemId}")
    public ResponseEntity<ApiResponse<PortfolioItemDto>> updatePortfolioItem(
            @CurrentUser AuthUser user, @PathVariable UUID itemId, @Valid @RequestBody PortfolioItemDto dto) {
        return ResponseEntity.ok(ApiResponse.ok("Portfolio item updated",
                profileService.updatePortfolioItem(requireUser(user).id(), itemId, dto)));
    }

    @DeleteMapping("/me/portfolio/{itemId}")
    public ResponseEntity<ApiResponse<Void>> deletePortfolioItem(@CurrentUser AuthUser user, @PathVariable UUID itemId) {
        profileService.deletePortfolioItem(requireUser(user).id(), itemId);
        return ResponseEntity.ok(ApiResponse.ok("Portfolio item removed", null));
    }

    // ------------------------------------------------------------ directory & public profiles

    @GetMapping("/freelancers")
    public ResponseEntity<ApiResponse<List<FreelancerProfileDto>>> searchFreelancers(
            @CurrentUser AuthUser user,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String skill,
            @RequestParam(defaultValue = "24") int limit) {
        return ResponseEntity.ok(ApiResponse.ok(
                profileService.searchFreelancers(requireUser(user).id(), search, skill, limit)));
    }

    @GetMapping("/{id}/profile")
    public ResponseEntity<ApiResponse<FreelancerProfileDto>> getFreelancerProfile(
            @CurrentUser AuthUser user, @PathVariable UUID id) {
        requireUser(user);
        return ResponseEntity.ok(ApiResponse.ok(profileService.getPublicProfile(id)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserSummaryDto>> getUserById(@CurrentUser AuthUser user, @PathVariable UUID id) {
        AuthUser viewer = requireUser(user);
        boolean includePrivate = viewer.id().equals(id) || viewer.hasRole("ADMIN");
        return ResponseEntity.ok(ApiResponse.ok(userService.getUserSummary(id, includePrivate)));
    }

    // ------------------------------------------------------------ admin

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserSummaryDto>>> getAllUsers(@CurrentUser AuthUser user) {
        requireAdmin(user);
        return ResponseEntity.ok(ApiResponse.ok(userService.getAllUsers()));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Void>> updateUserStatus(
            @CurrentUser AuthUser user,
            @PathVariable UUID id,
            @RequestParam UserStatus status
    ) {
        requireAdmin(user);
        userService.updateUserStatus(id, status);
        return ResponseEntity.ok(ApiResponse.ok("User status updated to " + status, null));
    }

    private static AuthUser requireUser(AuthUser user) {
        if (user == null) throw new UnauthorizedException("Authentication required");
        return user;
    }

    private static void requireAdmin(AuthUser user) {
        if (!requireUser(user).hasRole("ADMIN")) throw new ForbiddenException("Admin access required");
    }
}
