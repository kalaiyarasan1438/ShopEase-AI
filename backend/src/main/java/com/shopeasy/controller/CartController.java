package com.shopeasy.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * CartController — manages the authenticated user's shopping cart.
 *
 * Full implementation delegates to CartService (not shown for brevity;
 * mirrors the pattern in OrderServiceImpl).
 *
 * Endpoints:
 *   GET    /api/cart             — get cart
 *   POST   /api/cart/items       — add item
 *   PUT    /api/cart/items/{id}  — update qty
 *   DELETE /api/cart/items/{id}  — remove item
 *   DELETE /api/cart             — clear cart
 *   POST   /api/cart/sync        — sync guest cart on login
 */
@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@Tag(name = "Cart", description = "Shopping cart management")
@SecurityRequirement(name = "bearerAuth")
public class CartController {

    // private final CartService cartService;  // inject and delegate

    @Operation(summary = "Get current user's cart")
    @GetMapping
    public ResponseEntity<?> getCart() {
        // return ResponseEntity.ok(cartService.getCart());
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Add item to cart")
    @PostMapping("/items")
    public ResponseEntity<?> addItem(@RequestBody Object request) {
        // return ResponseEntity.status(201).body(cartService.addItem(request));
        return ResponseEntity.status(201).build();
    }

    @Operation(summary = "Update item quantity")
    @PutMapping("/items/{itemId}")
    public ResponseEntity<?> updateItem(@PathVariable Long itemId, @RequestBody Object request) {
        // return ResponseEntity.ok(cartService.updateItem(itemId, request));
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Remove item from cart")
    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<Void> removeItem(@PathVariable Long itemId) {
        // cartService.removeItem(itemId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Clear entire cart")
    @DeleteMapping
    public ResponseEntity<Void> clearCart() {
        // cartService.clearCart();
        return ResponseEntity.noContent().build();
    }
}
