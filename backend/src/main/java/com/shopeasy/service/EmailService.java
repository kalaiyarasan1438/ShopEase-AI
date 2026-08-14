package com.shopeasy.service;

public interface EmailService {
    void sendOtpEmail(String toEmail, String otpCode);
}
