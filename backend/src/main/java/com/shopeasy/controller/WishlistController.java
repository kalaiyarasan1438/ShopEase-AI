package com.shopeasy.controller;

import com.shopeasy.dto.response.ProductResponse;
import com.shopeasy.entity.Product;
import com.shopeasy.entity.User;
import com.shopeasy.entity.WishlistItem;
import com.shopeasy.exception.ResourceNotFoundException;
import com.shopeasy.repository.ProductRepository;
import com.shopeasy.repository.UserRepository;
import com.shopeasy.repository.WishlistItemRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
@Tag(name = "Wishlist", description = "User wishlist management")
@SecurityRequirement(name = "bearerAuth")
public class WishlistController {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final WishlistItemRepository wishlistItemRepository;

    private User getUser(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + auth.getName()));
    }

    @Operation(summary = "Get user's wishlist")
    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<ProductResponse>> getWishlist(Authentication auth) {
        User user = getUser(auth);
        List<WishlistItem> items = wishlistItemRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        List<ProductResponse> response = items.stream()
            .map(item -> ProductResponse.fromEntity(item.getProduct()))
            .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Add product to wishlist")
    @PostMapping("/{productId}")
    @Transactional
    public ResponseEntity<?> addToWishlist(Authentication auth, @PathVariable Long productId) {
        User user = getUser(auth);
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + productId));
        if (!wishlistItemRepository.existsByUserIdAndProductId(user.getId(), productId)) {
            WishlistItem item = WishlistItem.builder()
                .user(user)
                .product(product)
                .build();
            wishlistItemRepository.save(item);
        }
        return ResponseEntity.status(201).body(ProductResponse.fromEntity(product));
    }

    @Operation(summary = "Remove product from wishlist")
    @DeleteMapping("/{productId}")
    @Transactional
    public ResponseEntity<Void> removeFromWishlist(Authentication auth, @PathVariable Long productId) {
        User user = getUser(auth);
        wishlistItemRepository.deleteByUserIdAndProductId(user.getId(), productId);
        return ResponseEntity.noContent().build();
    }
}
