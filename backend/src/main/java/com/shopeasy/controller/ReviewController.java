package com.shopeasy.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * ReviewController — product review CRUD.
 *
 * GET    /api/products/{id}/reviews       — paginated list
 * POST   /api/products/{id}/reviews       — submit review (USER)
 * DELETE /api/products/{id}/reviews/{rid} — delete (ADMIN)
 */
@RestController
@RequestMapping("/api/products/{productId}/reviews")
@RequiredArgsConstructor
@Tag(name = "Reviews", description = "Product review management")
public class ReviewController {

    @Operation(summary = "Get paginated reviews for a product")
    @GetMapping
    public ResponseEntity<?> getReviews(
        @PathVariable Long productId,
        @RequestParam(defaultValue = "0")  int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Submit a review", security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping
    public ResponseEntity<?> submitReview(
        @PathVariable Long productId,
        @RequestBody ReviewRequest request
    ) {
        return ResponseEntity.status(201).build();
    }

    @Operation(summary = "Delete a review (ADMIN)", security = @SecurityRequirement(name = "bearerAuth"))
    @DeleteMapping("/{reviewId}")
    public ResponseEntity<Void> deleteReview(
        @PathVariable Long productId,
        @PathVariable Long reviewId
    ) {
        return ResponseEntity.noContent().build();
    }

    @Data
    static class ReviewRequest {
        @Min(1) @Max(5) private Integer rating;
        @Size(max = 200) private String title;
        private String body;
    }
}
