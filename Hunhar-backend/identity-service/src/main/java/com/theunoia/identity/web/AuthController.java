package com.theunoia.identity.web;

import com.theunoia.common.dto.ApiResponse;
import com.theunoia.common.security.AuthUser;
import com.theunoia.common.security.CurrentUser;
import com.theunoia.identity.dto.AuthResponseDto;
import com.theunoia.identity.dto.GoogleAuthDto;
import com.theunoia.identity.dto.LoginDto;
import com.theunoia.identity.dto.MobileOtpDto;
import com.theunoia.identity.dto.RegisterClientDto;
import com.theunoia.identity.dto.RegisterFreelancerDto;
import com.theunoia.identity.dto.ResetPasswordDto;
import com.theunoia.identity.dto.SendOtpDto;
import com.theunoia.identity.dto.VerifyOtpDto;
import com.theunoia.identity.dto.UserSummaryDto;
import com.theunoia.identity.service.AuthService;
import com.theunoia.identity.service.EmailOtpService;
import com.theunoia.identity.service.MobileOtpService;
import com.theunoia.identity.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserService userService;
    private final EmailOtpService emailOtpService;
    private final MobileOtpService mobileOtpService;

    @PostMapping("/otp/send")
    public ResponseEntity<ApiResponse<Void>> sendSignupOtp(@Valid @RequestBody SendOtpDto dto) {
        emailOtpService.sendSignupOtp(dto.getEmail());
        return ResponseEntity.ok(ApiResponse.ok("Verification code sent to " + dto.getEmail().trim(), null));
    }

    @PostMapping("/otp/verify")
    public ResponseEntity<ApiResponse<Void>> verifySignupOtp(@Valid @RequestBody VerifyOtpDto dto) {
        emailOtpService.verifySignupOtp(dto.getEmail(), dto.getOtp());
        return ResponseEntity.ok(ApiResponse.ok("Email verified successfully", null));
    }

    /** Signup step: sends a 6-digit code by SMS to an unregistered Indian mobile number. */
    @PostMapping("/mobile-otp/send")
    public ResponseEntity<ApiResponse<Void>> sendMobileOtp(@Valid @RequestBody MobileOtpDto dto) {
        String mobile = mobileOtpService.send(dto.getMobile());
        return ResponseEntity.ok(ApiResponse.ok("Verification code sent by SMS to +91 " + mobile.substring(0, 5) + " " + mobile.substring(5), null));
    }

    @PostMapping("/mobile-otp/verify")
    public ResponseEntity<ApiResponse<Void>> verifyMobileOtp(@Valid @RequestBody MobileOtpDto dto) {
        mobileOtpService.verify(dto.getMobile(), dto.getOtp());
        return ResponseEntity.ok(ApiResponse.ok("Mobile number verified successfully", null));
    }

    @PostMapping("/register/freelancer")
    public ResponseEntity<ApiResponse<AuthResponseDto>> registerFreelancer(@Valid @RequestBody RegisterFreelancerDto dto) {
        AuthResponseDto response = authService.registerFreelancer(dto);
        return ResponseEntity.ok(ApiResponse.ok("Freelancer registered successfully", response));
    }

    @PostMapping("/register/client")
    public ResponseEntity<ApiResponse<AuthResponseDto>> registerClient(@Valid @RequestBody RegisterClientDto dto) {
        AuthResponseDto response = authService.registerClient(dto);
        return ResponseEntity.ok(ApiResponse.ok("Client registered successfully", response));
    }

    /** Public: the Google OAuth client id the web app should use (null when Google sign-in is not configured). */
    @GetMapping("/google/config")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> googleConfig() {
        String id = authService.googleClientId();
        java.util.Map<String, Object> body = new java.util.HashMap<>();
        body.put("enabled", id != null);
        body.put("clientId", id);
        return ResponseEntity.ok(ApiResponse.ok(body));
    }

    /** Sign in / sign up with a Google ID token. New emails must send a role (FREELANCER or CLIENT). */
    @PostMapping("/google")
    public ResponseEntity<ApiResponse<AuthResponseDto>> google(@Valid @RequestBody GoogleAuthDto dto) {
        AuthResponseDto response = authService.googleAuth(dto);
        String msg = Boolean.TRUE.equals(response.getNeedsRole()) ? "Choose how you want to use Hunhar" : "Login successful";
        return ResponseEntity.ok(ApiResponse.ok(msg, response));
    }

    /** Forgot password step 1: emails a 6-digit reset code (same response whether or not the email exists). */
    @PostMapping("/password/forgot")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody SendOtpDto dto) {
        emailOtpService.sendPasswordResetOtp(dto.getEmail());
        return ResponseEntity.ok(ApiResponse.ok("If an account exists for " + dto.getEmail().trim() + ", a reset code has been sent.", null));
    }

    /** Forgot password step 2: checks the code and sets the new password. */
    @PostMapping("/password/reset")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordDto dto) {
        authService.resetPassword(dto.getEmail(), dto.getOtp(), dto.getNewPassword());
        return ResponseEntity.ok(ApiResponse.ok("Password updated. You can now log in with your new password.", null));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponseDto>> login(@Valid @RequestBody LoginDto dto) {
        AuthResponseDto response = authService.login(dto);
        return ResponseEntity.ok(ApiResponse.ok("Login successful", response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserSummaryDto>> getAuthenticatedUser(@CurrentUser AuthUser currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        }
        UserSummaryDto user = userService.getUserSummary(currentUser.id(), true);
        return ResponseEntity.ok(ApiResponse.ok(user));
    }
}
