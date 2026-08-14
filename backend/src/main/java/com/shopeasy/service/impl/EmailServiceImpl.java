package com.shopeasy.service.impl;

import com.shopeasy.service.EmailService;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    @Override
    public void sendOtpEmail(String toEmail, String otpCode) {
        log.info("Attempting to send OTP email to: {}", toEmail);

        if (fromEmail == null || fromEmail.isBlank()) {
            log.error("Email sending failure: MAIL_USERNAME environment variable is not configured.");
            throw new IllegalStateException("Gmail SMTP username is missing. Please set MAIL_USERNAME and MAIL_PASSWORD in backend/.env or environment variables.");
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "ShopEasy Security");
            helper.setTo(toEmail);
            helper.setSubject("🛍️ Your ShopEasy Password Reset OTP");

            String htmlBody = """
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="UTF-8">
                  <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0f; color: #e2e8f0; margin: 0; padding: 20px; }
                    .card { max-width: 480px; margin: 0 auto; background: #12121a; border: 1px solid #232333; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); text-align: center; }
                    .logo { font-size: 32px; margin-bottom: 12px; }
                    .title { font-size: 22px; font-weight: 700; color: #ffffff; margin-bottom: 8px; }
                    .subtitle { font-size: 14px; color: #94a3b8; margin-bottom: 24px; }
                    .otp-box { background: #1a1a26; border: 2px dashed #6366f1; border-radius: 12px; padding: 20px; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #818cf8; margin: 20px 0; }
                    .badge { display: inline-block; background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 20px; }
                    .footer { font-size: 11px; color: #64748b; margin-top: 24px; border-top: 1px solid #1e1e2d; padding-top: 16px; }
                  </style>
                </head>
                <body>
                  <div class="card">
                    <div class="logo">🛍️</div>
                    <div class="title">ShopEasy Password Reset</div>
                    <div class="subtitle">Use the verification code below to reset your password</div>
                    <div class="otp-box">%s</div>
                    <div class="badge">⏱️ OTP expires in exactly 2 minutes</div>
                    <p style="font-size: 13px; color: #cbd5e1; line-height: 1.5;">
                      If you did not request a password reset, please ignore this email or contact support immediately. Do not share this OTP with anyone.
                    </p>
                    <div class="footer">
                      © %d ShopEasy Marketplace. All rights reserved.
                    </div>
                  </div>
                </body>
                </html>
                """.formatted(otpCode, java.time.Year.now().getValue());

            helper.setText(htmlBody, true);
            mailSender.send(message);

            log.info("Email sent successfully to: {}", toEmail);
        } catch (Exception e) {
            log.error("Email sending failure for email: {}", toEmail);
            throw new IllegalStateException("Failed to send OTP email via SMTP: " + e.getMessage() + ". Please check MAIL_USERNAME and MAIL_PASSWORD.");
        }
    }
}
