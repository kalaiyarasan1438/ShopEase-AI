package com.shopeasy.controller;

import com.shopeasy.dto.response.OrderResponse;
import com.shopeasy.dto.response.ProductResponse;
import com.shopeasy.dto.response.UserResponse;
import com.shopeasy.dto.response.VendorAdminResponse;
import com.shopeasy.entity.*;
import com.shopeasy.exception.ResourceNotFoundException;
import com.shopeasy.repository.*;
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
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.lang.management.ManagementFactory;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.*;
import java.util.stream.Collectors;

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
    private final CategoryRepository categoryRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    // ── DASHBOARD STATS ─────────────────────────────────────────────────────

    @Operation(summary = "Platform statistics for admin dashboard")
    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        BigDecimal totalRevenue = orderRepository.getTotalRevenue();
        if (totalRevenue == null) totalRevenue = BigDecimal.ZERO;

        long pendingRefunds = orderRepository.countByStatus(Order.OrderStatus.REFUND_REQUESTED);
        long lowStockCount = productRepository.findLowStockAll(5).size();

        // Recent orders (5)
        List<OrderResponse> recentOrders = orderRepository
            .findAll(PageRequest.of(0, 5, Sort.by("createdAt").descending()))
            .map(OrderResponse::fromEntity)
            .getContent();

        // Low stock products (10)
        List<Map<String, Object>> lowStockProducts = productRepository.findLowStockAll(5).stream()
            .limit(10)
            .map(p -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", p.getId());
                m.put("name", p.getName());
                m.put("stockQty", p.getStockQty());
                m.put("price", p.getPrice());
                m.put("imageUrl", p.getImages().stream().filter(ProductImage::isPrimary).findFirst().map(ProductImage::getImageUrl).orElse(null));
                return m;
            })
            .collect(Collectors.toList());

        // Latest vendors (5)
        List<VendorAdminResponse> latestVendors = vendorRepository
            .findAll(PageRequest.of(0, 5, Sort.by("createdAt").descending()))
            .map(v -> VendorAdminResponse.builder()
                .id(v.getId())
                .userId(v.getUser().getId())
                .name(v.getUser().getFullName())
                .email(v.getUser().getEmail())
                .companyName(v.getBusinessName())
                .phone(v.getUser().getPhone())
                .registrationDate(v.getCreatedAt())
                .currentStatus(v.getStatus().name())
                .build())
            .getContent();

        // Top selling products (5)
        List<Map<String, Object>> topProducts = orderRepository
            .getTopSellingProducts(PageRequest.of(0, 5))
            .stream()
            .map(row -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("name", row[0]);
                m.put("unitsSold", ((Number) row[1]).longValue());
                m.put("revenue", row[2]);
                return m;
            })
            .collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalRevenue", totalRevenue);
        result.put("totalOrders", orderRepository.count());
        result.put("totalProducts", productRepository.count());
        result.put("activeProducts", productRepository.countByIsActiveTrue());
        result.put("hiddenProducts", productRepository.countByIsActiveFalse());
        result.put("totalUsers", userRepository.count());
        result.put("totalVendors", vendorRepository.count());
        result.put("activeVendors", vendorRepository.countByStatus(Vendor.VendorStatus.APPROVED));
        result.put("pendingVendors", vendorRepository.countByStatus(Vendor.VendorStatus.PENDING));
        result.put("rejectedVendors", vendorRepository.countByStatus(Vendor.VendorStatus.REJECTED));
        result.put("pendingRefunds", pendingRefunds);
        result.put("lowStockCount", lowStockCount);
        result.put("recentOrders", recentOrders);
        result.put("lowStockProducts", lowStockProducts);
        result.put("latestVendors", latestVendors);
        result.put("topSellingProducts", topProducts);

        return ResponseEntity.ok(result);
    }

    // ── ANALYTICS ─────────────────────────────────────────────────────────────

    @Operation(summary = "Live analytics data for admin analytics page")
    @GetMapping("/analytics")
    public ResponseEntity<?> getAnalytics(@RequestParam(defaultValue = "0") int year) {
        int targetYear = year > 0 ? year : Year.now().getValue();
        String[] monthNames = {"Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"};

        // Monthly revenue
        Map<Integer, BigDecimal> revenueMap = new HashMap<>();
        orderRepository.getMonthlyRevenue(targetYear).forEach(row ->
            revenueMap.put(((Number)row[0]).intValue(), (BigDecimal) row[1])
        );

        // Monthly orders
        Map<Integer, Long> ordersMap = new HashMap<>();
        orderRepository.getMonthlyOrders(targetYear).forEach(row ->
            ordersMap.put(((Number)row[0]).intValue(), ((Number)row[1]).longValue())
        );

        List<Map<String, Object>> monthlyData = new ArrayList<>();
        for (int m = 1; m <= 12; m++) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("month", monthNames[m - 1]);
            entry.put("revenue", revenueMap.getOrDefault(m, BigDecimal.ZERO));
            entry.put("orders", ordersMap.getOrDefault(m, 0L));
            monthlyData.add(entry);
        }

        // Category revenue
        List<Map<String, Object>> categoryRevenue = orderRepository.getCategoryRevenue().stream()
            .map(row -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("name", row[0]);
                m.put("revenue", row[1]);
                return m;
            })
            .collect(Collectors.toList());

        // Top products
        List<Map<String, Object>> topProducts = orderRepository
            .getTopSellingProducts(PageRequest.of(0, 10))
            .stream()
            .map(row -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("name", row[0]);
                m.put("unitsSold", ((Number)row[1]).longValue());
                m.put("revenue", row[2]);
                return m;
            })
            .collect(Collectors.toList());

        // Top customers
        List<Map<String, Object>> topCustomers = orderRepository
            .getTopCustomers(PageRequest.of(0, 10))
            .stream()
            .map(row -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("name", row[0] + " " + row[1]);
                m.put("email", row[2]);
                m.put("orders", ((Number)row[3]).longValue());
                m.put("totalSpent", row[4]);
                return m;
            })
            .collect(Collectors.toList());

        // Refund rate
        long totalOrders = orderRepository.count();
        long refundedOrders = orderRepository.countByPaymentStatus(Order.PaymentStatus.REFUNDED);
        double refundRate = totalOrders > 0 ? (double) refundedOrders / totalOrders * 100 : 0;

        // Avg order value
        BigDecimal totalRev = orderRepository.getTotalRevenue();
        long deliveredCount = orderRepository.countByStatus(Order.OrderStatus.DELIVERED);
        BigDecimal avgOrderValue = deliveredCount > 0 && totalRev != null
            ? totalRev.divide(BigDecimal.valueOf(deliveredCount), 2, java.math.RoundingMode.HALF_UP)
            : BigDecimal.ZERO;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("year", targetYear);
        result.put("monthlyData", monthlyData);
        result.put("categoryRevenue", categoryRevenue);
        result.put("topProducts", topProducts);
        result.put("topCustomers", topCustomers);
        result.put("refundRate", Math.round(refundRate * 100.0) / 100.0);
        result.put("avgOrderValue", avgOrderValue);
        result.put("totalOrders", totalOrders);
        result.put("deliveredOrders", deliveredCount);

        return ResponseEntity.ok(result);
    }

    // ── SYSTEM INFO ─────────────────────────────────────────────────────────

    @Operation(summary = "System information for admin settings")
    @GetMapping("/system-info")
    public ResponseEntity<?> getSystemInfo() {
        long uptimeMs = ManagementFactory.getRuntimeMXBean().getUptime();
        long hours = uptimeMs / 3_600_000;
        long minutes = (uptimeMs % 3_600_000) / 60_000;

        Map<String, Object> info = new LinkedHashMap<>();
        info.put("backendVersion", "2.1.0");
        info.put("frontendVersion", "1.0.0");
        info.put("javaVersion", System.getProperty("java.version"));
        info.put("database", "H2 In-Memory (dev) / PostgreSQL (prod)");
        info.put("serverUptime", hours + "h " + minutes + "m");
        info.put("totalUsers", userRepository.count());
        info.put("totalRoles", roleRepository.count());
        info.put("serverTime", LocalDateTime.now().toString());
        return ResponseEntity.ok(info);
    }

    // ── ADMIN PROFILE ─────────────────────────────────────────────────────

    @Operation(summary = "Update admin profile")
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> body, Authentication auth) {
        User user = userRepository.findByEmail(auth.getName())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (body.containsKey("firstName")) user.setFirstName(body.get("firstName"));
        if (body.containsKey("lastName"))  user.setLastName(body.get("lastName"));
        if (body.containsKey("phone"))     user.setPhone(body.get("phone"));
        if (body.containsKey("avatarUrl")) user.setAvatarUrl(body.get("avatarUrl"));
        userRepository.save(user);
        return ResponseEntity.ok(UserResponse.fromEntity(user));
    }

    @Operation(summary = "Change admin password")
    @PutMapping("/password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> body, Authentication auth) {
        User user = userRepository.findByEmail(auth.getName())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        String current = body.get("currentPassword");
        String newPass = body.get("newPassword");
        if (current == null || newPass == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Current and new passwords are required"));
        }
        if (!passwordEncoder.matches(current, user.getPassword())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Current password is incorrect"));
        }
        if (newPass.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "Password must be at least 6 characters"));
        }
        user.setPassword(passwordEncoder.encode(newPass));
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
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

    @Operation(summary = "Get all orders with advanced filters")
    @GetMapping("/orders")
    public ResponseEntity<?> getAllOrders(
        @RequestParam(defaultValue = "0")  int    page,
        @RequestParam(defaultValue = "20") int    size,
        @RequestParam(required = false)    String status,
        @RequestParam(required = false)    String paymentMethod,
        @RequestParam(required = false)    String paymentStatus
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Order.OrderStatus os = null;
        Order.PaymentMethod pm = null;
        Order.PaymentStatus ps = null;

        try { if (status != null && !status.isEmpty() && !status.equalsIgnoreCase("ALL")) os = Order.OrderStatus.valueOf(status.toUpperCase()); } catch (Exception ignored) {}
        try { if (paymentMethod != null && !paymentMethod.isEmpty() && !paymentMethod.equalsIgnoreCase("ALL")) pm = Order.PaymentMethod.valueOf(paymentMethod.toUpperCase()); } catch (Exception ignored) {}
        try { if (paymentStatus != null && !paymentStatus.isEmpty() && !paymentStatus.equalsIgnoreCase("ALL")) ps = Order.PaymentStatus.valueOf(paymentStatus.toUpperCase()); } catch (Exception ignored) {}

        Page<Order> ordersPage;
        if (os != null || pm != null || ps != null) {
            ordersPage = orderRepository.findWithFilters(os, pm, ps, pageable);
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

    @Operation(summary = "Get all products across platform (including hidden)")
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

    @Operation(summary = "Edit product details")
    @PutMapping("/products/{id}")
    public ResponseEntity<?> editProduct(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));

        if (body.containsKey("name"))        product.setName((String) body.get("name"));
        if (body.containsKey("description")) product.setDescription((String) body.get("description"));
        if (body.containsKey("badge"))       product.setBadge((String) body.get("badge"));
        if (body.containsKey("imageUrl"))    {
            // Update primary image URL
            String newUrl = (String) body.get("imageUrl");
            if (newUrl != null && !product.getImages().isEmpty()) {
                product.getImages().stream().filter(ProductImage::isPrimary).findFirst()
                    .ifPresent(img -> img.setImageUrl(newUrl));
            }
        }
        if (body.containsKey("price")) {
            product.setPrice(new BigDecimal(body.get("price").toString()));
        }
        if (body.containsKey("stockQty")) {
            product.setStockQty(((Number) body.get("stockQty")).intValue());
        }
        if (body.containsKey("categoryId")) {
            Long catId = Long.valueOf(body.get("categoryId").toString());
            Category category = categoryRepository.findById(catId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + catId));
            product.setCategory(category);
        }

        productRepository.save(product);
        return ResponseEntity.ok(ProductResponse.fromEntity(product));
    }

    @Operation(summary = "Update product price")
    @PatchMapping("/products/{id}/price")
    public ResponseEntity<?> updatePrice(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));
        BigDecimal newPrice = new BigDecimal(body.get("price").toString());
        product.setOldPrice(product.getPrice());
        product.setPrice(newPrice);
        productRepository.save(product);
        return ResponseEntity.ok(ProductResponse.fromEntity(product));
    }

    @Operation(summary = "Update product stock")
    @PatchMapping("/products/{id}/stock")
    public ResponseEntity<?> updateStock(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));
        product.setStockQty(((Number) body.get("stockQty")).intValue());
        productRepository.save(product);
        return ResponseEntity.ok(ProductResponse.fromEntity(product));
    }

    @Operation(summary = "Hide product from storefront")
    @PatchMapping("/products/{id}/hide")
    public ResponseEntity<?> hideProduct(@PathVariable Long id) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));
        product.setActive(false);
        productRepository.save(product);
        return ResponseEntity.ok(ProductResponse.fromEntity(product));
    }

    @Operation(summary = "Unhide product")
    @PatchMapping("/products/{id}/unhide")
    public ResponseEntity<?> unhideProduct(@PathVariable Long id) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));
        product.setActive(true);
        productRepository.save(product);
        return ResponseEntity.ok(ProductResponse.fromEntity(product));
    }

    @Operation(summary = "Delete product")
    @DeleteMapping("/products/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));
        productRepository.delete(product);
        return ResponseEntity.ok(Map.of("message", "Product deleted successfully", "id", id));
    }

    @Operation(summary = "Bulk delete products")
    @PostMapping("/products/bulk-delete")
    public ResponseEntity<?> bulkDelete(@RequestBody Map<String, List<Long>> body) {
        List<Long> ids = body.get("ids");
        if (ids == null || ids.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No product IDs provided"));
        }
        List<Product> products = productRepository.findAllById(ids);
        productRepository.deleteAll(products);
        return ResponseEntity.ok(Map.of("message", products.size() + " products deleted", "deleted", ids));
    }

    @Operation(summary = "Bulk hide products")
    @PostMapping("/products/bulk-hide")
    public ResponseEntity<?> bulkHide(@RequestBody Map<String, List<Long>> body) {
        List<Long> ids = body.get("ids");
        if (ids == null || ids.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No product IDs provided"));
        }
        List<Product> products = productRepository.findAllById(ids);
        products.forEach(p -> p.setActive(false));
        productRepository.saveAll(products);
        return ResponseEntity.ok(Map.of("message", products.size() + " products hidden", "hidden", ids));
    }

    @Operation(summary = "Bulk update stock")
    @PostMapping("/products/bulk-stock")
    public ResponseEntity<?> bulkStockUpdate(@RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<Long> ids = ((List<Number>) body.get("ids")).stream().map(Number::longValue).collect(Collectors.toList());
        int stockQty = ((Number) body.get("stockQty")).intValue();
        if (ids.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No product IDs provided"));
        }
        List<Product> products = productRepository.findAllById(ids);
        products.forEach(p -> p.setStockQty(stockQty));
        productRepository.saveAll(products);
        return ResponseEntity.ok(Map.of("message", products.size() + " products stock updated to " + stockQty));
    }
}
