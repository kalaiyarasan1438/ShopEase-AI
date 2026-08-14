package com.shopeasy.controller;

import com.shopeasy.dto.request.ForgotPasswordRequest;
import com.shopeasy.dto.request.LoginRequest;
import com.shopeasy.dto.request.OAuthRequest;
import com.shopeasy.dto.request.RegisterRequest;
import com.shopeasy.dto.request.RefreshTokenRequest;
import com.shopeasy.dto.request.ResetPasswordWithOtpRequest;
import com.shopeasy.dto.request.VerifyOtpRequest;
import com.shopeasy.dto.response.AuthResponse;
import com.shopeasy.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Register, login, and token management")
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "Register a new user")
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @Operation(summary = "Authenticate user and get JWT tokens")
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @Operation(summary = "Refresh access token using refresh token")
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refresh(request));
    }

    @Operation(summary = "Get current authenticated user")
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        return ResponseEntity.ok(authService.getCurrentUser());
    }

    @Operation(summary = "Request 6-digit OTP for password reset")
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.sendForgotPasswordOtp(request.getEmail());
        return ResponseEntity.ok().body(java.util.Map.of("message", "A 6-digit OTP has been sent to your email address. It is valid for 5 minutes."));
    }

    @Operation(summary = "Verify 6-digit OTP for password reset")
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        boolean valid = authService.verifyOtp(request.getEmail(), request.getOtp());
        return ResponseEntity.ok().body(java.util.Map.of("valid", valid, "message", "OTP verified successfully"));
    }

    @Operation(summary = "Reset password using 6-digit OTP")
    @PostMapping("/reset-password-otp")
    public ResponseEntity<?> resetPasswordWithOtp(@Valid @RequestBody ResetPasswordWithOtpRequest request) {
        authService.resetPasswordWithOtp(request.getEmail(), request.getOtp(), request.getNewPassword());
        return ResponseEntity.ok().body(java.util.Map.of("message", "Password has been successfully reset. You can now log in with your new password."));
    }

    @Operation(summary = "Reset password with token (legacy)")
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(
        @RequestBody(required = false) java.util.Map<String, String> body,
        @RequestParam(required = false) String token,
        @RequestParam(required = false) String newPassword
    ) {
        String t = (body != null && body.containsKey("token")) ? body.get("token") : token;
        String p = (body != null && body.containsKey("newPassword")) ? body.get("newPassword") : newPassword;
        if (t == null || p == null) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "Token and newPassword are required"));
        }
        authService.resetPassword(t, p);
        return ResponseEntity.ok().body(java.util.Map.of("message", "Password reset successful"));
    }

    @Operation(summary = "Sign in or register with Google OAuth")
    @PostMapping("/oauth/google")
    public ResponseEntity<AuthResponse> oauthGoogle(@Valid @RequestBody OAuthRequest request) {
        return ResponseEntity.ok(authService.loginGoogle(request));
    }
}
