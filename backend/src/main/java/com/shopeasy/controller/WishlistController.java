package com.shopeasy.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * WishlistController
 *
 * GET    /api/wishlist              — list wishlisted products
 * POST   /api/wishlist/{productId}  — add to wishlist
 * DELETE /api/wishlist/{productId}  — remove from wishlist
 */
@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
@Tag(name = "Wishlist", description = "User wishlist management")
@SecurityRequirement(name = "bearerAuth")
public class WishlistController {

    @Operation(summary = "Get user's wishlist")
    @GetMapping
    public ResponseEntity<?> getWishlist() {
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Add product to wishlist")
    @PostMapping("/{productId}")
    public ResponseEntity<?> addToWishlist(@PathVariable Long productId) {
        return ResponseEntity.status(201).build();
    }

    @Operation(summary = "Remove product from wishlist")
    @DeleteMapping("/{productId}")
    public ResponseEntity<Void> removeFromWishlist(@PathVariable Long productId) {
        return ResponseEntity.noContent().build();
    }
}
