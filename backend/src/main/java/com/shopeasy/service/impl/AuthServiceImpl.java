package com.shopeasy.service.impl;

import com.shopeasy.dto.request.LoginRequest;
import com.shopeasy.dto.request.OAuthRequest;
import com.shopeasy.dto.request.RefreshTokenRequest;
import com.shopeasy.dto.request.RegisterRequest;
import com.shopeasy.dto.response.AuthResponse;
import com.shopeasy.dto.response.UserResponse;
import com.shopeasy.entity.PasswordResetOtp;
import com.shopeasy.entity.Role;
import com.shopeasy.entity.User;
import com.shopeasy.entity.Vendor;
import com.shopeasy.entity.Vendor.VendorStatus;
import com.shopeasy.exception.ResourceNotFoundException;
import com.shopeasy.exception.UnauthorizedException;
import com.shopeasy.repository.PasswordResetOtpRepository;
import com.shopeasy.repository.RoleRepository;
import com.shopeasy.repository.UserRepository;
import com.shopeasy.repository.VendorRepository;
import com.shopeasy.security.JwtTokenProvider;
import com.shopeasy.security.UserDetailsServiceImpl;
import com.shopeasy.service.AuthService;
import com.shopeasy.util.OAuthTokenVerifier;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AuthServiceImpl implements AuthService {

    private final UserRepository          userRepository;
    private final RoleRepository          roleRepository;
    private final PasswordEncoder         passwordEncoder;
    private final AuthenticationManager   authenticationManager;
    private final JwtTokenProvider        jwtTokenProvider;
    private final UserDetailsServiceImpl  userDetailsService;
    private final VendorRepository        vendorRepository;
    private final OAuthTokenVerifier      oAuthTokenVerifier;
    private final PasswordResetOtpRepository passwordResetOtpRepository;
    private final com.shopeasy.service.EmailService emailService;

    private static final String GMAIL_REGEX = "(?i)^[A-Za-z0-9._%+-]+@gmail\\.com$";
    private static final String ADMIN_EMAIL = "admin@shopeasy.in";

    @Override
    public AuthResponse register(RegisterRequest request) {
        String roleInput = request.getRole() != null ? request.getRole().trim().toUpperCase() : "USER";
        if ("ADMIN".equals(roleInput) || "ROLE_ADMIN".equals(roleInput)) {
            throw new IllegalArgumentException("Admin registration is not allowed.");
        }

        String rawEmail = request.getEmail() != null ? request.getEmail().trim() : "";
        if (!rawEmail.matches(GMAIL_REGEX)) {
            throw new IllegalArgumentException("Only Gmail addresses (@gmail.com) are allowed.");
        }

        if (userRepository.existsByEmail(rawEmail)) {
            throw new IllegalArgumentException("Email already registered: " + rawEmail);
        }

        // Fetch role (default to USER if not specified)
        String roleName = "ROLE_" + (request.getRole() != null ? request.getRole() : "USER");
        Role role = roleRepository.findByName(roleName)
            .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + roleName));

        User user = User.builder()
            .firstName(request.getFirstName())
            .lastName(request.getLastName())
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword()))
            .phone(request.getPhone())
            .roles(Set.of(role))
            .enabled(true)
            .build();

        userRepository.save(user);
        log.info("New user registered: {} ({})", user.getEmail(), roleName);

        if ("ROLE_VENDOR".equals(roleName)) {
            Vendor vendor = Vendor.builder()
                .user(user)
                .businessName(request.getCompanyName())
                .address(request.getBusinessAddress())
                .gstNumber(request.getGstNumber())
                .description(request.getBusinessDescription())
                .status(VendorStatus.PENDING)
                .build();
            vendorRepository.save(vendor);

            UserResponse userResponse = UserResponse.fromEntity(user);
            userResponse.setVendorStatus(VendorStatus.PENDING.name());

            return AuthResponse.builder()
                .accessToken(null)
                .refreshToken(null)
                .user(userResponse)
                .build();
        }

        return buildAuthResponse(user);
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        String rawEmail = request.getEmail() != null ? request.getEmail().trim() : "";
        String emailLower = rawEmail.toLowerCase();

        // 1. Admin email policy
        if (ADMIN_EMAIL.equalsIgnoreCase(rawEmail)) {
            // Valid admin email - proceed to authentication
        } else {
            // Check if user is trying an admin email or is registered as ADMIN
            User existingUser = userRepository.findByEmail(rawEmail).orElse(null);
            boolean isRegisteredAdmin = existingUser != null && existingUser.getRoles().stream()
                .anyMatch(r -> "ROLE_ADMIN".equals(r.getName()));

            boolean isAttemptingAdmin = isRegisteredAdmin || emailLower.startsWith("admin@")
                || emailLower.startsWith("admin1@") || emailLower.startsWith("administrator@")
                || emailLower.endsWith("@shopeasy.in") || emailLower.endsWith("@shopeasy.com");

            if (isAttemptingAdmin) {
                throw new UnauthorizedException("Invalid Admin credentials.");
            }

            // 2. User & Vendor email policy: ONLY Gmail
            if (!rawEmail.matches(GMAIL_REGEX)) {
                throw new UnauthorizedException("Only Gmail addresses (@gmail.com) are allowed.");
            }
        }

        Authentication auth = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(rawEmail, request.getPassword())
        );
        SecurityContextHolder.getContext().setAuthentication(auth);

        User user = userRepository.findByEmail(rawEmail)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_VENDOR"))) {
            Vendor vendor = vendorRepository.findByUser(user)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor profile not found"));
            
            if (vendor.getStatus() == VendorStatus.PENDING) {
                throw new UnauthorizedException("Your vendor account is waiting for admin approval.");
            } else if (vendor.getStatus() == VendorStatus.REJECTED) {
                throw new UnauthorizedException("Your vendor registration has been rejected.");
            } else if (vendor.getStatus() == VendorStatus.BLOCKED) {
                throw new UnauthorizedException("Your vendor account has been blocked.");
            }
        }

        log.info("User logged in: {}", user.getEmail());
        return buildAuthResponse(user);
    }

    @Override
    public AuthResponse refresh(RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }

        String username    = jwtTokenProvider.extractUsername(refreshToken);
        UserDetails user   = userDetailsService.loadUserByUsername(username);
        String accessToken = jwtTokenProvider.generateAccessToken(user);

        return AuthResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .build();
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user    = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        UserResponse response = UserResponse.fromEntity(user);
        if (user.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_VENDOR"))) {
            vendorRepository.findByUser(user).ifPresent(v -> response.setVendorStatus(v.getStatus().name()));
        }
        return response;
    }

    @Override
    public void forgotPassword(String email) {
        String targetEmail = email != null ? email.trim() : "";
        if (!ADMIN_EMAIL.equalsIgnoreCase(targetEmail) && !targetEmail.matches(GMAIL_REGEX)) {
            throw new IllegalArgumentException("Only Gmail addresses (@gmail.com) are allowed.");
        }
        userRepository.findByEmail(targetEmail)
            .orElseThrow(() -> new ResourceNotFoundException("No account found with email: " + targetEmail));
        // TODO: send reset email via JavaMailSender
        log.info("Password reset requested for: {}", targetEmail);
    }

    @Override
    public void resetPassword(String token, String newPassword) {
        // Legacy reset
        log.info("Password reset with token: {}", token);
    }

    // ── 6-Digit OTP Password Reset ─────────────────────────────────────────────

    @Override
    @Transactional
    public void sendForgotPasswordOtp(String email) {
        String targetEmail = email != null ? email.trim().toLowerCase() : "";
        log.info("Forgot password OTP request received for email: {}", targetEmail);

        if (targetEmail.isBlank()) {
            log.warn("Forgot password request failed: email is blank.");
            throw new IllegalArgumentException("Email is required");
        }

        // Strict email policy check
        if (!ADMIN_EMAIL.equals(targetEmail) && !targetEmail.matches(GMAIL_REGEX)) {
            log.warn("Forgot password request failed: email is not a Gmail address: {}", targetEmail);
            throw new IllegalArgumentException("Only Gmail addresses (@gmail.com) are allowed.");
        }

        User user = userRepository.findByEmail(targetEmail)
            .orElseThrow(() -> {
                log.warn("Forgot password request failed: user not found for email: {}", targetEmail);
                return new ResourceNotFoundException("No registered account found with email: " + targetEmail);
            });
        log.info("User found for forgot password request: {}", targetEmail);

        // Generate 6-digit OTP
        java.security.SecureRandom rng = new java.security.SecureRandom();
        String otpCode = String.format("%06d", rng.nextInt(1000000));

        // Expire/delete previous unused OTPs for this email
        passwordResetOtpRepository.deleteByEmail(targetEmail);

        // OTP validity must be exactly 2 minutes (120 seconds)
        PasswordResetOtp otpEntity = PasswordResetOtp.builder()
            .email(targetEmail)
            .otpCode(otpCode)
            .expiryTime(java.time.LocalDateTime.now().plusSeconds(120))
            .used(false)
            .attemptCount(0)
            .build();

        passwordResetOtpRepository.save(otpEntity);
        log.info("OTP generated and stored for email: {} (valid for 120 seconds)", targetEmail);

        // Attempt to send email via EmailService
        try {
            emailService.sendOtpEmail(targetEmail, otpCode);
        } catch (Exception e) {
            log.error("Email sending failed for email: {}", targetEmail);
            passwordResetOtpRepository.deleteByEmail(targetEmail);
            throw e;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public boolean verifyOtp(String email, String otp) {
        String targetEmail = email != null ? email.trim().toLowerCase() : "";
        String code = otp != null ? otp.trim() : "";

        PasswordResetOtp otpToken = passwordResetOtpRepository
            .findTopByEmailAndUsedFalseOrderByCreatedAtDesc(targetEmail)
            .orElseThrow(() -> new ResourceNotFoundException("No active OTP request found for email: " + targetEmail));

        if (otpToken.isExpired() || java.time.LocalDateTime.now().isAfter(otpToken.getExpiryTime())) {
            log.warn("OTP verification failed for {}: OTP has expired", targetEmail);
            throw new IllegalArgumentException("OTP code has expired. Please request a new OTP.");
        }

        if (otpToken.getAttemptCount() >= 5) {
            log.warn("OTP verification failed for {}: too many invalid attempts", targetEmail);
            throw new IllegalArgumentException("Too many invalid attempts. Please request a new OTP.");
        }

        if (!otpToken.getOtpCode().equals(code)) {
            otpToken.setAttemptCount(otpToken.getAttemptCount() + 1);
            passwordResetOtpRepository.save(otpToken);
            log.warn("OTP verification failed for {}: invalid OTP code", targetEmail);
            throw new IllegalArgumentException("Invalid OTP code. Please check and try again.");
        }

        log.info("OTP code verified successfully for email: {}", targetEmail);
        return true;
    }

    @Override
    @Transactional
    public void resetPasswordWithOtp(String email, String otp, String newPassword) {
        String targetEmail = email != null ? email.trim().toLowerCase() : "";
        String code = otp != null ? otp.trim() : "";

        // Verify OTP code first
        verifyOtp(targetEmail, code);

        // Fetch OTP entity
        PasswordResetOtp otpToken = passwordResetOtpRepository
            .findTopByEmailAndUsedFalseOrderByCreatedAtDesc(targetEmail)
            .orElseThrow(() -> new ResourceNotFoundException("No active OTP request found."));

        if (otpToken.isExpired() || java.time.LocalDateTime.now().isAfter(otpToken.getExpiryTime())) {
            throw new IllegalArgumentException("OTP code has expired. Please request a new OTP.");
        }

        // Validate password strength
        if (newPassword == null || newPassword.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters long.");
        }

        User user = userRepository.findByEmail(targetEmail)
            .orElseThrow(() -> new ResourceNotFoundException("User not found for email: " + targetEmail));

        // Update password using BCrypt
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Mark OTP as used and cleanup
        otpToken.setUsed(true);
        passwordResetOtpRepository.save(otpToken);
        passwordResetOtpRepository.deleteByEmail(targetEmail);

        log.info("Password successfully reset for user: {}", targetEmail);
    }

    // ── OAuth ─────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public AuthResponse loginGoogle(OAuthRequest request) {
        OAuthTokenVerifier.OAuthUserInfo info = oAuthTokenVerifier.verifyGoogleToken(request.getIdToken());
        User user = findOrCreateOAuthUser(info.email(), info.firstName(), info.lastName(), info.avatarUrl());
        log.info("Google OAuth login: {}", user.getEmail());
        return buildAuthResponse(user);
    }

    /**
     * Finds an existing user by email, or creates a new USER account.
     * OAuth accounts are NEVER created as ADMIN or VENDOR.
     */
    private User findOrCreateOAuthUser(String email, String firstName, String lastName, String avatarUrl) {
        return userRepository.findByEmail(email).orElseGet(() -> {
            Role userRole = roleRepository.findByName("ROLE_USER")
                .orElseGet(() -> roleRepository.saveAndFlush(Role.builder().name("ROLE_USER").build()));

            // Split firstName if lastName is blank (some providers return full name as firstName)
            String fn = firstName != null && !firstName.isBlank() ? firstName : "User";
            String ln = lastName  != null && !lastName.isBlank()  ? lastName  : "";
            if (ln.isBlank() && fn.contains(" ")) {
                String[] parts = fn.split(" ", 2);
                fn = parts[0];
                ln = parts[1];
            }
            if (ln.isBlank()) ln = "User";

            User newUser = User.builder()
                .firstName(fn)
                .lastName(ln)
                .email(email)
                .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                .avatarUrl(avatarUrl)
                .enabled(true)
                .roles(Set.of(userRole))
                .build();

            User saved = userRepository.save(newUser);
            log.info("New OAuth user created: {} (ROLE_USER)", email);
            return saved;
        });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private AuthResponse buildAuthResponse(User user) {
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String accessToken  = jwtTokenProvider.generateAccessToken(userDetails);
        String refreshToken = jwtTokenProvider.generateRefreshToken(userDetails);

        UserResponse response = UserResponse.fromEntity(user);
        if (user.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_VENDOR"))) {
            vendorRepository.findByUser(user).ifPresent(v -> response.setVendorStatus(v.getStatus().name()));
        }

        return AuthResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .user(response)
            .build();
    }
}
