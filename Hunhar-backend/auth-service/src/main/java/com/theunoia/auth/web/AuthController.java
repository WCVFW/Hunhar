package com.theunoia.auth.web;

import com.theunoia.auth.dto.AuthDtos.ChangePasswordRequest;
import com.theunoia.auth.dto.AuthDtos.ClientRegistration;
import com.theunoia.auth.dto.AuthDtos.EmailRequest;
import com.theunoia.auth.dto.AuthDtos.FreelancerRegistration;
import com.theunoia.auth.dto.AuthDtos.KycInitResponse;
import com.theunoia.auth.dto.AuthDtos.KycStatusResponse;
import com.theunoia.auth.dto.AuthDtos.LoginRequest;
import com.theunoia.auth.dto.AuthDtos.RefreshRequest;
import com.theunoia.auth.dto.AuthDtos.RegistrationResponse;
import com.theunoia.auth.dto.AuthDtos.ResetPasswordRequest;
import com.theunoia.auth.dto.AuthDtos.TokenRequest;
import com.theunoia.auth.dto.AuthDtos.TokenResponse;
import com.theunoia.auth.dto.AuthDtos.UserResponse;
import com.theunoia.auth.service.AuthService;
import com.theunoia.auth.service.KycService;
import com.theunoia.common.security.CurrentUser;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final KycService kycService;

    @PostMapping("/register/freelancer")
    @ResponseStatus(HttpStatus.CREATED)
    public RegistrationResponse registerFreelancer(@Valid @RequestBody FreelancerRegistration req) {
        return authService.registerFreelancer(req);
    }

    @PostMapping("/register/client")
    @ResponseStatus(HttpStatus.CREATED)
    public RegistrationResponse registerClient(@Valid @RequestBody ClientRegistration req) {
        return authService.registerClient(req);
    }

    @PostMapping("/login")
    public TokenResponse login(@Valid @RequestBody LoginRequest req, HttpServletRequest http) {
        return authService.login(req.email(), req.password(), http.getHeader("User-Agent"), clientIp(http));
    }

    @PostMapping("/refresh")
    public TokenResponse refresh(@Valid @RequestBody RefreshRequest req, HttpServletRequest http) {
        return authService.refresh(req.refreshToken(), http.getHeader("User-Agent"), clientIp(http));
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@Valid @RequestBody RefreshRequest req) {
        authService.logout(req.refreshToken());
    }

    @PostMapping("/logout-all")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logoutAll() {
        authService.logoutEverywhere(CurrentUser.require().id());
    }

    @GetMapping("/me")
    public UserResponse me() {
        return authService.me(CurrentUser.require().id());
    }

    @PostMapping("/verify-email")
    public UserResponse verifyEmail(@Valid @RequestBody TokenRequest req) {
        return authService.verifyEmail(req.token());
    }

    @PostMapping("/resend-verification")
    public Map<String, String> resendVerification() {
        authService.resendVerification(CurrentUser.require().id());
        return Map.of("message", "Verification email sent");
    }

    @PostMapping("/forgot-password")
    public Map<String, String> forgotPassword(@Valid @RequestBody EmailRequest req) {
        authService.forgotPassword(req.email());
        return Map.of("message", "If the email is registered, a reset link has been sent");
    }

    @PostMapping("/reset-password")
    public Map<String, String> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        authService.resetPassword(req.token(), req.newPassword());
        return Map.of("message", "Password updated. Please sign in again.");
    }

    @PostMapping("/change-password")
    public Map<String, String> changePassword(@Valid @RequestBody ChangePasswordRequest req) {
        authService.changePassword(CurrentUser.require().id(), req.currentPassword(), req.newPassword());
        return Map.of("message", "Password changed. Other sessions were signed out.");
    }

    // ------------------------------------------------------------- Aadhaar KYC (DigiLocker)

    @PostMapping("/kyc/aadhaar/initiate")
    public KycInitResponse initiateKyc() {
        return kycService.initiate(CurrentUser.require().id());
    }

    @GetMapping("/kyc/aadhaar/status")
    public KycStatusResponse kycStatus() {
        return kycService.refreshStatus(CurrentUser.require().id());
    }

    private static String clientIp(HttpServletRequest http) {
        String forwarded = http.getHeader("X-Forwarded-For");
        return forwarded != null ? forwarded.split(",")[0].trim() : http.getRemoteAddr();
    }
}
