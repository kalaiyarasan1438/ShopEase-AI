package com.shopeasy.controller;

import com.shopeasy.dto.response.OrderResponse;
import com.shopeasy.dto.response.ProductResponse;
import com.shopeasy.dto.response.UserResponse;
import com.shopeasy.dto.response.VendorAdminResponse;
import com.shopeasy.entity.Order;
import com.shopeasy.entity.Product;
import com.shopeasy.entity.User;
import com.shopeasy.entity.Vendor;
import com.shopeasy.exception.ResourceNotFoundException;
import com.shopeasy.repository.OrderRepository;
import com.shopeasy.repository.ProductRepository;
import com.shopeasy.repository.UserRepository;
import com.shopeasy.repository.VendorRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "Platform administration (ADMIN role only)")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final VendorRepository vendorRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;

    @Operation(summary = "Platform statistics for admin dashboard")
    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        BigDecimal totalRevenue = orderRepository.getTotalRevenue();
        if (totalRevenue == null) {
            totalRevenue = BigDecimal.ZERO;
        }

        return ResponseEntity.ok(Map.of(
            "totalRevenue",  totalRevenue,
            "totalOrders",   orderRepository.count(),
            "activeVendors", vendorRepository.countByStatus(Vendor.VendorStatus.APPROVED),
            "pendingVendors",vendorRepository.countByStatus(Vendor.VendorStatus.PENDING),
            "rejectedVendors", vendorRepository.countByStatus(Vendor.VendorStatus.REJECTED),
            "totalVendors",  vendorRepository.count(),
            "totalProducts", productRepository.count(),
            "totalUsers",    userRepository.count()
        ));
    }

    // ── VENDORS ─────────────────────────────────────────────────────────────

    @Operation(summary = "List all vendors")
    @GetMapping("/vendors")
    public ResponseEntity<?> getVendors(
        @RequestParam(defaultValue = "0")  int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        Page<VendorAdminResponse> vendors = vendorRepository
            .findAll(PageRequest.of(page, size, Sort.by("createdAt").descending()))
            .map(v -> VendorAdminResponse.builder()
                .id(v.getId())
                .userId(v.getUser().getId())
                .name(v.getUser().getFullName())
                .email(v.getUser().getEmail())
                .companyName(v.getBusinessName())
                .phone(v.getUser().getPhone())
                .registrationDate(v.getCreatedAt())
                .currentStatus(v.getStatus().name())
                .build());
        return ResponseEntity.ok(vendors);
    }

    @Operation(summary = "Approve vendor")
    @PutMapping("/vendors/{id}/approve")
    public ResponseEntity<?> approveVendor(@PathVariable Long id) {
        return updateVendorStatus(id, Vendor.VendorStatus.APPROVED);
    }

    @Operation(summary = "Reject vendor")
    @PutMapping("/vendors/{id}/reject")
    public ResponseEntity<?> rejectVendor(@PathVariable Long id) {
        return updateVendorStatus(id, Vendor.VendorStatus.REJECTED);
    }

    private ResponseEntity<?> updateVendorStatus(Long id, Vendor.VendorStatus status) {
        Vendor vendor = vendorRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Vendor not found: " + id));
        vendor.setStatus(status);
        vendorRepository.save(vendor);
        return ResponseEntity.ok(VendorAdminResponse.builder()
            .id(vendor.getId())
            .userId(vendor.getUser().getId())
            .name(vendor.getUser().getFullName())
            .email(vendor.getUser().getEmail())
            .companyName(vendor.getBusinessName())
            .phone(vendor.getUser().getPhone())
            .registrationDate(vendor.getCreatedAt())
            .currentStatus(vendor.getStatus().name())
            .build());
    }

    // ── USERS ─────────────────────────────────────────────────────────────

    @Operation(summary = "Get all users (admin)")
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(
        @RequestParam(defaultValue = "0")  int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        Page<UserResponse> users = userRepository
            .findAll(PageRequest.of(page, size, Sort.by("createdAt").descending()))
            .map(UserResponse::fromEntity);
        return ResponseEntity.ok(users);
    }

    @Operation(summary = "Block user")
    @PutMapping("/users/{id}/block")
    public ResponseEntity<?> blockUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        user.setEnabled(false);
        userRepository.save(user);
        return ResponseEntity.ok(UserResponse.fromEntity(user));
    }

    @Operation(summary = "Unblock user")
    @PutMapping("/users/{id}/unblock")
    public ResponseEntity<?> unblockUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        user.setEnabled(true);
        userRepository.save(user);
        return ResponseEntity.ok(UserResponse.fromEntity(user));
    }

    // ── ORDERS ─────────────────────────────────────────────────────────────

    @Operation(summary = "Get all orders (admin)")
    @GetMapping("/orders")
    public ResponseEntity<?> getAllOrders(
        @RequestParam(defaultValue = "0")  int    page,
        @RequestParam(defaultValue = "20") int    size,
        @RequestParam(required = false)    String status
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Order> ordersPage;
        if (status != null && !status.isEmpty() && !status.equalsIgnoreCase("ALL")) {
            ordersPage = orderRepository.findAllWithStatus(Order.OrderStatus.valueOf(status.toUpperCase()), pageable);
        } else {
            ordersPage = orderRepository.findAll(pageable);
        }
        return ResponseEntity.ok(ordersPage.map(OrderResponse::fromEntity));
    }

    @Operation(summary = "Update any order's status")
    @PatchMapping("/orders/{id}/status")
    public ResponseEntity<?> updateOrderStatus(
        @PathVariable Long id,
        @RequestParam String status
    ) {
        Order order = orderRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + id));
        order.setStatus(Order.OrderStatus.valueOf(status.toUpperCase()));
        orderRepository.save(order);
        return ResponseEntity.ok(OrderResponse.fromEntity(order));
    }

    // ── PRODUCTS ─────────────────────────────────────────────────────────────

    @Operation(summary = "Get all products across platform")
    @GetMapping("/products")
    public ResponseEntity<?> getAllProducts(
        @RequestParam(defaultValue = "0")  int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        Page<ProductResponse> products = productRepository
            .findAll(PageRequest.of(page, size, Sort.by("createdAt").descending()))
            .map(ProductResponse::fromEntity);
        return ResponseEntity.ok(products);
    }
}
