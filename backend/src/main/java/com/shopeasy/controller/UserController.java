package com.shopeasy.controller;

import com.shopeasy.dto.response.UserStatsResponse;
import com.shopeasy.entity.User;
import com.shopeasy.exception.ResourceNotFoundException;
import com.shopeasy.repository.OrderRepository;
import com.shopeasy.repository.ReviewRepository;
import com.shopeasy.repository.UserRepository;
import com.shopeasy.repository.WishlistItemRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "User Management", description = "User profile and user statistics")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final WishlistItemRepository wishlistItemRepository;
    private final ReviewRepository reviewRepository;

    @Operation(summary = "Get stats for currently authenticated user")
    @GetMapping("/me/stats")
    @Transactional(readOnly = true)
    public ResponseEntity<UserStatsResponse> getMyStats(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userRepository.findByEmail(auth.getName())
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + auth.getName()));

        long ordersCount = orderRepository.countByUserId(user.getId());
        long wishlistCount = wishlistItemRepository.countByUserId(user.getId());
        long reviewsCount = reviewRepository.countByUserId(user.getId());
        BigDecimal totalSpent = orderRepository.calculateTotalSpentByUserId(user.getId());
        if (totalSpent == null) {
            totalSpent = BigDecimal.ZERO;
        }

        UserStatsResponse response = UserStatsResponse.builder()
            .ordersCount(ordersCount)
            .wishlistCount(wishlistCount)
            .reviewsCount(reviewsCount)
            .totalSpent(totalSpent)
            .build();

        return ResponseEntity.ok(response);
    }
}
