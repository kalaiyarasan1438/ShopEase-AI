package com.shopeasy.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorAdminResponse {
    private Long id; // Vendor ID
    private Long userId; // User ID
    private String name;
    private String email;
    private String companyName;
    private String phone;
    private LocalDateTime registrationDate;
    private String currentStatus;
}
