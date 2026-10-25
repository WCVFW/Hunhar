package com.theunoia.identity.web;

import com.theunoia.common.dto.ApiResponse;
import com.theunoia.common.security.AuthUser;
import com.theunoia.common.security.CurrentUser;
import com.theunoia.identity.dto.AuthResponseDto;
import com.theunoia.identity.dto.LoginDto;
import com.theunoia.identity.dto.RegisterClientDto;
import com.theunoia.identity.dto.RegisterFreelancerDto;
import com.theunoia.identity.dto.SendOtpDto;
import com.theunoia.identity.dto.VerifyOtpDto;
import com.theunoia.identity.dto.UserSummaryDto;
import com.theunoia.identity.service.AuthService;
import com.theunoia.identity.service.EmailOtpService;
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
