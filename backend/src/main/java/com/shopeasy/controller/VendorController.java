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
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
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
    // Uses a JOIN FETCH query to load the User eagerly — avoids LazyInitializationException
    // that the old vendorRepository.findAll().stream().filter() pattern could cause.
    private Vendor resolveVendor(Authentication auth) {
        String email = auth.getName();
        return vendorRepository.findByUserEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("Vendor profile not found for: " + email));
    }

    // ── STATS ────────────────────────────────────────────────────────────────

    @Operation(summary = "Vendor dashboard statistics")
    @GetMapping("/stats")
    @Transactional(readOnly = true)
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
    @Transactional(readOnly = true)
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
    @Transactional
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
    @Transactional
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
    @Transactional
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
    @Transactional(readOnly = true)
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

    // ── BUG FIX: Added @Transactional so the JPA session stays open when
    // OrderResponse.fromEntity(order) accesses the lazy-loaded `items` collection.
    // Also fixed resolveVendor (uses findByUserEmail JPQL instead of findAll+stream),
    // and now stamps updatedAt on every status change.
    @Operation(summary = "Update order status (enforces next-valid-state)")
    @PatchMapping("/orders/{id}/status")
    @Transactional
    public ResponseEntity<?> updateOrderStatus(
        Authentication auth,
        @PathVariable Long id,
        @RequestParam String status
    ) {
        resolveVendor(auth); // ensure caller is an approved vendor
        Order order = orderRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + id));

        Order.OrderStatus newStatus;
        try {
            newStatus = Order.OrderStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Invalid status value: " + status));
        }

        Order.OrderStatus current = order.getStatus();

        // Validate allowed forward transitions
        boolean allowed = switch (current) {
            case ORDER_PLACED      -> newStatus == Order.OrderStatus.CONFIRMED   || newStatus == Order.OrderStatus.CANCELLED;
            case CONFIRMED         -> newStatus == Order.OrderStatus.PROCESSING  || newStatus == Order.OrderStatus.CANCELLED;
            case PROCESSING        -> newStatus == Order.OrderStatus.OUT_FOR_DELIVERY || newStatus == Order.OrderStatus.CANCELLED;
            case OUT_FOR_DELIVERY  -> newStatus == Order.OrderStatus.DELIVERED;
            case DELIVERED         -> newStatus == Order.OrderStatus.REFUNDED;   // approve refund directly
            case REFUND_REQUESTED  -> newStatus == Order.OrderStatus.REFUNDED    || newStatus == Order.OrderStatus.REFUND_REJECTED;
            default                -> false;
        };

        if (!allowed) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Cannot transition from " + current + " to " + newStatus));
        }

        // If rejecting refund → revert to DELIVERED
        if (newStatus == Order.OrderStatus.REFUND_REJECTED) {
            order.setStatus(Order.OrderStatus.DELIVERED);
            order.setUpdatedAt(LocalDateTime.now());
            Order saved = orderRepository.save(order);
            return ResponseEntity.ok(OrderResponse.fromEntity(saved));
        }

        // If approving refund → restore stock AND update payment status
        if (newStatus == Order.OrderStatus.REFUNDED) {
            order.setPaymentStatus(Order.PaymentStatus.REFUNDED);
            restoreStock(order);
        }

        // COD: mark as paid when delivered
        if (newStatus == Order.OrderStatus.DELIVERED && order.getPaymentMethod() == Order.PaymentMethod.COD) {
            order.setPaymentStatus(Order.PaymentStatus.PAID);
        }

        // Restore stock on cancel
        if (newStatus == Order.OrderStatus.CANCELLED && current != Order.OrderStatus.CANCELLED) {
            restoreStock(order);
        }

        order.setStatus(newStatus);
        order.setUpdatedAt(LocalDateTime.now());
        Order saved = orderRepository.save(order);
        return ResponseEntity.ok(OrderResponse.fromEntity(saved));
    }

    // ── Helper: restore product stock from order items ────────────────────────
    private void restoreStock(Order order) {
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                Product product = item.getProduct();
                if (product != null) {
                    product.setStockQty(product.getStockQty() + item.getQuantity());
                    productRepository.save(product);
                }
            }
        }
    }

    @Operation(summary = "Reject a refund request (reverts order to DELIVERED and sets status REFUND_REJECTED)")
    @PatchMapping("/orders/{id}/refund/reject")
    @Transactional
    public ResponseEntity<?> rejectRefund(
        Authentication auth,
        @PathVariable Long id
    ) {
        resolveVendor(auth);
        Order order = orderRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + id));

        if (order.getStatus() != Order.OrderStatus.REFUND_REQUESTED) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Order is not in REFUND_REQUESTED status"));
        }

        order.setStatus(Order.OrderStatus.REFUND_REJECTED);
        order.setUpdatedAt(LocalDateTime.now());
        Order saved = orderRepository.save(order);
        return ResponseEntity.ok(OrderResponse.fromEntity(saved));
    }
}
