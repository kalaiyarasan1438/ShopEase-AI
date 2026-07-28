package com.shopeasy.service.impl;

import com.shopeasy.dto.request.LoginRequest;
import com.shopeasy.dto.request.RefreshTokenRequest;
import com.shopeasy.dto.request.RegisterRequest;
import com.shopeasy.dto.response.AuthResponse;
import com.shopeasy.dto.response.UserResponse;
import com.shopeasy.entity.Role;
import com.shopeasy.entity.User;
import com.shopeasy.entity.Vendor;
import com.shopeasy.entity.Vendor.VendorStatus;
import com.shopeasy.exception.ResourceNotFoundException;
import com.shopeasy.exception.UnauthorizedException;
import com.shopeasy.repository.RoleRepository;
import com.shopeasy.repository.UserRepository;
import com.shopeasy.repository.VendorRepository;
import com.shopeasy.security.JwtTokenProvider;
import com.shopeasy.security.UserDetailsServiceImpl;
import com.shopeasy.service.AuthService;
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

    @Override
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered: " + request.getEmail());
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
        Authentication auth = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        SecurityContextHolder.getContext().setAuthentication(auth);

        User user = userRepository.findByEmail(request.getEmail())
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
        userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("No account found with email: " + email));
        // TODO: send reset email via JavaMailSender
        log.info("Password reset requested for: {}", email);
    }

    @Override
    public void resetPassword(String token, String newPassword) {
        // TODO: validate token, find user, update password
        log.info("Password reset with token: {}", token);
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
