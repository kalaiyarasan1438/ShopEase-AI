package com.shopeasy.service;

import com.shopeasy.dto.request.LoginRequest;
import com.shopeasy.dto.request.RefreshTokenRequest;
import com.shopeasy.dto.request.RegisterRequest;
import com.shopeasy.dto.response.AuthResponse;
import com.shopeasy.dto.response.UserResponse;

public interface AuthService {
    AuthResponse  register(RegisterRequest request);
    AuthResponse  login(LoginRequest request);
    AuthResponse  refresh(RefreshTokenRequest request);
    UserResponse  getCurrentUser();
    void          forgotPassword(String email);
    void          resetPassword(String token, String newPassword);
}
