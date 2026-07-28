package com.shopeasy.controller;

import com.shopeasy.dto.request.ProductRequest;
import com.shopeasy.dto.response.OrderResponse;
import com.shopeasy.dto.response.ProductResponse;
import com.shopeasy.entity.*;
import com.shopeasy.exception.ResourceNotFoundException;
import com.shopeasy.repository.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/vendor")
@RequiredArgsConstructor
@Tag(name = "Vendor", description = "Vendor portal APIs (VENDOR role only)")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('VENDOR')")
public class VendorController {

    private final VendorRepository   vendorRepository;
    private final ProductRepository  productRepository;
    private final OrderRepository    orderRepository;
    private final CategoryRepository categoryRepository;

    // ── Helper: resolve vendor from auth ────────────────────────────────────
    private Vendor resolveVendor(Authentication auth) {
        String email = auth.getName();
        return vendorRepository.findAll().stream()
            .filter(v -> v.getUser().getEmail().equals(email))
            .findFirst()
            .orElseThrow(() -> new ResourceNotFoundException("Vendor profile not found for: " + email));
    }

    // ── STATS ────────────────────────────────────────────────────────────────

    @Operation(summary = "Vendor dashboard statistics")
    @GetMapping("/stats")
    public ResponseEntity<?> getStats(Authentication auth) {
        Vendor vendor = resolveVendor(auth);
        long productCount = productRepository.countByVendorIdAndIsActiveTrue(vendor.getId());
        Page<Order> ordersPage = orderRepository.findByVendorId(vendor.getId(),
            PageRequest.of(0, Integer.MAX_VALUE));
        long orderCount = ordersPage.getTotalElements();
        BigDecimal revenue = ordersPage.getContent().stream()
            .filter(o -> o.getStatus() == Order.OrderStatus.DELIVERED)
            .map(Order::getTotalAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        return ResponseEntity.ok(Map.of(
            "totalRevenue",  revenue,
            "totalProducts", productCount,
            "totalOrders",   orderCount,
            "ratingAvg",     vendor.getRatingAvg(),
            "businessName",  vendor.getBusinessName(),
            "status",        vendor.getStatus().name()
        ));
    }

    // ── PRODUCTS ─────────────────────────────────────────────────────────────

    @Operation(summary = "Get vendor's own products")
    @GetMapping("/products")
    public ResponseEntity<?> getProducts(
        Authentication auth,
        @RequestParam(defaultValue = "0")  int    page,
        @RequestParam(defaultValue = "20") int    size,
        @RequestParam(required = false)    String search
    ) {
        Vendor vendor = resolveVendor(auth);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Page<ProductResponse> products;
        if (search != null && !search.isBlank()) {
            products = productRepository
                .findByVendorIdAndNameContainingIgnoreCaseAndIsActiveTrue(vendor.getId(), search, pageable)
                .map(ProductResponse::fromEntity);
        } else {
            products = productRepository
                .findByVendorIdAndIsActiveTrue(vendor.getId(), pageable)
                .map(ProductResponse::fromEntity);
        }
        return ResponseEntity.ok(products);
    }

    @Operation(summary = "Create new product")
    @PostMapping("/products")
    public ResponseEntity<?> createProduct(
        Authentication auth,
        @Valid @RequestBody ProductRequest req
    ) {
        Vendor vendor = resolveVendor(auth);
        Category category = categoryRepository.findById(req.getCategoryId())
            .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + req.getCategoryId()));

        Product product = Product.builder()
            .name(req.getName())
            .description(req.getDescription())
            .price(req.getPrice())
            .oldPrice(req.getOldPrice())
            .stockQty(req.getStockQty())
            .badge(req.getBadge())
            .vendor(vendor)
            .category(category)
            .isActive(true)
            .build();

        // Add primary image if provided
        if (req.getImageUrl() != null && !req.getImageUrl().isBlank()) {
            ProductImage img = ProductImage.builder()
                .product(product)
                .imageUrl(req.getImageUrl())
                .isPrimary(true)
                .sortOrder(0)
                .build();
            product.getImages().add(img);
        }

        Product saved = productRepository.save(product);
        return ResponseEntity.ok(ProductResponse.fromEntity(saved));
    }

    @Operation(summary = "Update product")
    @PutMapping("/products/{id}")
    public ResponseEntity<?> updateProduct(
        Authentication auth,
        @PathVariable Long id,
        @Valid @RequestBody ProductRequest req
    ) {
        Vendor vendor = resolveVendor(auth);
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));
        if (!product.getVendor().getId().equals(vendor.getId())) {
            return ResponseEntity.status(403).body("Not your product");
        }

        Category category = categoryRepository.findById(req.getCategoryId())
            .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + req.getCategoryId()));

        product.setName(req.getName());
        product.setDescription(req.getDescription());
        product.setPrice(req.getPrice());
        product.setOldPrice(req.getOldPrice());
        product.setStockQty(req.getStockQty());
        product.setBadge(req.getBadge());
        product.setCategory(category);

        return ResponseEntity.ok(ProductResponse.fromEntity(productRepository.save(product)));
    }

    @Operation(summary = "Delete (soft-deactivate) product")
    @DeleteMapping("/products/{id}")
    public ResponseEntity<?> deleteProduct(
        Authentication auth,
        @PathVariable Long id
    ) {
        Vendor vendor = resolveVendor(auth);
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));
        if (!product.getVendor().getId().equals(vendor.getId())) {
            return ResponseEntity.status(403).body("Not your product");
        }
        product.setActive(false);
        productRepository.save(product);
        return ResponseEntity.ok(Map.of("message", "Product deactivated successfully"));
    }

    // ── ORDERS ───────────────────────────────────────────────────────────────

    @Operation(summary = "Get vendor's orders")
    @GetMapping("/orders")
    public ResponseEntity<?> getOrders(
        Authentication auth,
        @RequestParam(defaultValue = "0")  int    page,
        @RequestParam(defaultValue = "20") int    size,
        @RequestParam(required = false)    String status
    ) {
        Vendor vendor = resolveVendor(auth);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Page<Order> ordersPage;
        if (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL")) {
            ordersPage = orderRepository.findByVendorIdAndStatus(
                vendor.getId(), Order.OrderStatus.valueOf(status.toUpperCase()), pageable);
        } else {
            ordersPage = orderRepository.findByVendorId(vendor.getId(), pageable);
        }
        return ResponseEntity.ok(ordersPage.map(OrderResponse::fromEntity));
    }

    @Operation(summary = "Update order status")
    @PatchMapping("/orders/{id}/status")
    public ResponseEntity<?> updateOrderStatus(
        Authentication auth,
        @PathVariable Long id,
        @RequestParam String status
    ) {
        resolveVendor(auth); // ensure caller is a vendor
        Order order = orderRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + id));
        order.setStatus(Order.OrderStatus.valueOf(status.toUpperCase()));
        orderRepository.save(order);
        return ResponseEntity.ok(OrderResponse.fromEntity(order));
    }
}
