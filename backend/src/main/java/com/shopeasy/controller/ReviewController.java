package com.shopeasy.controller;

import com.shopeasy.entity.Product;
import com.shopeasy.entity.Review;
import com.shopeasy.entity.User;
import com.shopeasy.exception.ResourceNotFoundException;
import com.shopeasy.repository.ProductRepository;
import com.shopeasy.repository.ReviewRepository;
import com.shopeasy.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;

@RestController
@RequestMapping("/api/products/{productId}/reviews")
@RequiredArgsConstructor
@Tag(name = "Reviews", description = "Product review management")
public class ReviewController {

    private final ReviewRepository  reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository    userRepository;

    @Operation(summary = "Get paginated reviews for a product")
    @GetMapping
    public ResponseEntity<?> getReviews(
        @PathVariable Long productId,
        @RequestParam(defaultValue = "0")  int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Review> reviews = reviewRepository.findByProductIdOrderByCreatedAtDesc(productId, pageable);
        return ResponseEntity.ok(reviews);
    }

    @Operation(summary = "Submit a review", security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping
    @Transactional
    public ResponseEntity<?> submitReview(
        Authentication auth,
        @PathVariable Long productId,
        @Valid @RequestBody ReviewRequest request
    ) {
        if (auth == null || auth.getName() == null) {
            return ResponseEntity.status(401).body("Authentication required");
        }

        User user = userRepository.findByEmail(auth.getName())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + productId));

        Review review = Review.builder()
            .product(product)
            .user(user)
            .rating(request.getRating())
            .title(request.getTitle() != null && !request.getTitle().isBlank() ? request.getTitle() : "Verified Purchase Review")
            .body(request.getBody())
            .isVerified(true)
            .build();

        Review saved = reviewRepository.save(review);

        // Recalculate and update product average rating & count
        Double avgRating = reviewRepository.findAvgRatingByProductId(productId);
        long count = reviewRepository.countByProductId(productId);

        if (avgRating != null) {
            product.setRatingAvg(BigDecimal.valueOf(avgRating).setScale(1, RoundingMode.HALF_UP).doubleValue());
        }
        product.setRatingCount((int) count);
        productRepository.save(product);

        return ResponseEntity.status(201).body(Map.of(
            "id", saved.getId(),
            "rating", saved.getRating(),
            "title", saved.getTitle(),
            "body", saved.getBody() != null ? saved.getBody() : "",
            "productId", productId,
            "productRatingAvg", product.getRatingAvg(),
            "productRatingCount", product.getRatingCount()
        ));
    }

    @Operation(summary = "Delete a review (ADMIN)", security = @SecurityRequirement(name = "bearerAuth"))
    @DeleteMapping("/{reviewId}")
    @Transactional
    public ResponseEntity<Void> deleteReview(
        @PathVariable Long productId,
        @PathVariable Long reviewId
    ) {
        reviewRepository.deleteById(reviewId);
        return ResponseEntity.noContent().build();
    }

    @Data
    public static class ReviewRequest {
        @NotNull @Min(1) @Max(5) private Integer rating;
        @Size(max = 200) private String title;
        private String body;
    }
}
