package com.shopeasy.dto.response;

import com.shopeasy.entity.Role;
import com.shopeasy.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private Long            id;
    private String          firstName;
    private String          lastName;
    private String          email;
    private String          phone;
    private String          avatarUrl;
    private Set<String>     roles;
    private LocalDateTime   createdAt;
    private String          vendorStatus; // Can be null for SHOPPERS
    private boolean         enabled;

    public static UserResponse fromEntity(User user) {
        return UserResponse.builder()
            .id(user.getId())
            .firstName(user.getFirstName())
            .lastName(user.getLastName())
            .email(user.getEmail())
            .phone(user.getPhone())
            .avatarUrl(user.getAvatarUrl())
            .enabled(user.isEnabled())
            .roles(user.getRoles().stream()
                .map(Role::getName)
                .map(r -> r.replace("ROLE_", ""))
                .collect(Collectors.toSet()))
            .createdAt(user.getCreatedAt())
            .build();
    }
}
