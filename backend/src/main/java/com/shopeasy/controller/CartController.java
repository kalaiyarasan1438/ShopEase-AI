package com.shopeasy.controller;

import com.shopeasy.entity.*;
import com.shopeasy.exception.ResourceNotFoundException;
import com.shopeasy.repository.CartRepository;
import com.shopeasy.repository.ProductRepository;
import com.shopeasy.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@Tag(name = "Cart", description = "Shopping cart management")
@SecurityRequirement(name = "bearerAuth")
public class CartController {

    private final CartRepository cartRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    private Cart getOrCreateCart(Authentication auth) {
        User user = userRepository.findByEmail(auth.getName())
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + auth.getName()));
        return cartRepository.findByUserId(user.getId())
            .orElseGet(() -> cartRepository.save(Cart.builder().user(user).items(new ArrayList<>()).build()));
    }

    private Map<String, Object> formatCartResponse(Cart cart) {
        List<Map<String, Object>> itemsList = cart.getItems().stream().map(item -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", item.getId());
            m.put("productId", item.getProduct().getId());
            m.put("productName", item.getProduct().getName());
            m.put("productImage", item.getProduct().getImages().stream()
                .filter(ProductImage::isPrimary).findFirst()
                .map(ProductImage::getImageUrl).orElse(null));
            m.put("quantity", item.getQuantity());
            m.put("unitPrice", item.getPriceAtAdd());
            m.put("subtotal", item.getSubtotal());
            return m;
        }).collect(Collectors.toList());

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("id", cart.getId());
        res.put("items", itemsList);
        res.put("itemCount", cart.getItemCount());
        res.put("subtotal", cart.getSubtotal());
        return res;
    }

    @Operation(summary = "Get current user's cart")
    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<?> getCart(Authentication auth) {
        Cart cart = getOrCreateCart(auth);
        return ResponseEntity.ok(formatCartResponse(cart));
    }

    @Operation(summary = "Add item to cart")
    @PostMapping("/items")
    @Transactional
    public ResponseEntity<?> addItem(Authentication auth, @RequestBody Map<String, Object> body) {
        Long productId = Long.valueOf(body.get("productId").toString());
        Integer quantity = body.containsKey("quantity") ? Integer.valueOf(body.get("quantity").toString()) : 1;

        Cart cart = getOrCreateCart(auth);
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + productId));

        Optional<CartItem> existingItem = cart.getItems().stream()
            .filter(i -> i.getProduct().getId().equals(productId))
            .findFirst();

        if (existingItem.isPresent()) {
            CartItem item = existingItem.get();
            item.setQuantity(item.getQuantity() + quantity);
        } else {
            CartItem newItem = CartItem.builder()
                .cart(cart)
                .product(product)
                .quantity(quantity)
                .priceAtAdd(product.getPrice())
                .build();
            cart.getItems().add(newItem);
        }

        Cart updated = cartRepository.save(cart);
        return ResponseEntity.status(201).body(formatCartResponse(updated));
    }

    @Operation(summary = "Update item quantity")
    @PutMapping("/items/{itemId}")
    @Transactional
    public ResponseEntity<?> updateItem(Authentication auth, @PathVariable Long itemId, @RequestBody Map<String, Object> body) {
        Integer quantity = Integer.valueOf(body.get("quantity").toString());
        Cart cart = getOrCreateCart(auth);

        Optional<CartItem> itemOpt = cart.getItems().stream()
            .filter(i -> i.getId().equals(itemId) || i.getProduct().getId().equals(itemId))
            .findFirst();

        if (itemOpt.isPresent()) {
            CartItem item = itemOpt.get();
            if (quantity <= 0) {
                cart.getItems().remove(item);
            } else {
                item.setQuantity(quantity);
            }
        }

        Cart updated = cartRepository.save(cart);
        return ResponseEntity.ok(formatCartResponse(updated));
    }

    @Operation(summary = "Remove item from cart")
    @DeleteMapping("/items/{itemId}")
    @Transactional
    public ResponseEntity<?> removeItem(Authentication auth, @PathVariable Long itemId) {
        Cart cart = getOrCreateCart(auth);
        cart.getItems().removeIf(i -> i.getId().equals(itemId) || i.getProduct().getId().equals(itemId));
        Cart updated = cartRepository.save(cart);
        return ResponseEntity.ok(formatCartResponse(updated));
    }

    @Operation(summary = "Clear entire cart")
    @DeleteMapping
    @Transactional
    public ResponseEntity<?> clearCart(Authentication auth) {
        Cart cart = getOrCreateCart(auth);
        cart.getItems().clear();
        Cart updated = cartRepository.save(cart);
        return ResponseEntity.ok(formatCartResponse(updated));
    }

    @Operation(summary = "Sync local cart items on login")
    @PostMapping("/sync")
    @Transactional
    public ResponseEntity<?> syncCart(Authentication auth, @RequestBody Map<String, List<Map<String, Object>>> body) {
        Cart cart = getOrCreateCart(auth);
        List<Map<String, Object>> items = body.get("items");

        if (items != null) {
            for (Map<String, Object> itemData : items) {
                Long productId = Long.valueOf(itemData.get("productId").toString());
                Integer quantity = Integer.valueOf(itemData.get("quantity").toString());
                Product product = productRepository.findById(productId).orElse(null);
                if (product != null) {
                    Optional<CartItem> existing = cart.getItems().stream()
                        .filter(i -> i.getProduct().getId().equals(productId))
                        .findFirst();
                    if (existing.isPresent()) {
                        existing.get().setQuantity(existing.get().getQuantity() + quantity);
                    } else {
                        cart.getItems().add(CartItem.builder()
                            .cart(cart)
                            .product(product)
                            .quantity(quantity)
                            .priceAtAdd(product.getPrice())
                            .build());
                    }
                }
            }
        }
        Cart updated = cartRepository.save(cart);
        return ResponseEntity.ok(formatCartResponse(updated));
    }
}
