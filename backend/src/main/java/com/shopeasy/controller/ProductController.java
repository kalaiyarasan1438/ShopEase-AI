package com.shopeasy.controller;

import com.shopeasy.dto.request.ProductRequest;
import com.shopeasy.dto.response.ProductResponse;
import com.shopeasy.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Tag(name = "Products", description = "Product catalog management")
public class ProductController {

    private final ProductService productService;

    // ── Public Endpoints ───────────────────────────────────────────────────

    @Operation(summary = "Get all products (paginated, filterable)")
    @GetMapping
    public ResponseEntity<Page<ProductResponse>> getAllProducts(
        @RequestParam(defaultValue = "0")            int     page,
        @RequestParam(defaultValue = "12")           int     size,
        @RequestParam(defaultValue = "createdAt")    String  sortBy,
        @RequestParam(defaultValue = "desc")         String  sortDir,
        @RequestParam(required = false)              String  search,
        @RequestParam(required = false)              Long    categoryId,
        @RequestParam(required = false)              BigDecimal minPrice,
        @RequestParam(required = false)              BigDecimal maxPrice
    ) {
        Sort sort = sortDir.equalsIgnoreCase("asc")
            ? Sort.by(sortBy).ascending()
            : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, Math.min(size, 50), sort);
        return ResponseEntity.ok(
            productService.getProducts(pageable, search, categoryId, minPrice, maxPrice)
        );
    }

    @Operation(summary = "Get product by ID")
    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    @Operation(summary = "Search products")
    @GetMapping("/search")
    public ResponseEntity<Page<ProductResponse>> searchProducts(
        @RequestParam String q,
        @RequestParam(defaultValue = "0")  int page,
        @RequestParam(defaultValue = "12") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(productService.searchProducts(q, pageable));
    }

    @Operation(summary = "Get featured products")
    @GetMapping("/featured")
    public ResponseEntity<?> getFeaturedProducts(
        @RequestParam(defaultValue = "8") int limit
    ) {
        return ResponseEntity.ok(productService.getFeaturedProducts(limit));
    }

    // ── Vendor Endpoints (VENDOR / ADMIN) ──────────────────────────────────

    @Operation(summary = "Create a new product", security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping
    @PreAuthorize("hasAnyRole('VENDOR','ADMIN')")
    public ResponseEntity<ProductResponse> createProduct(@Valid @RequestBody ProductRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.createProduct(request));
    }

    @Operation(summary = "Update a product", security = @SecurityRequirement(name = "bearerAuth"))
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('VENDOR','ADMIN')")
    public ResponseEntity<ProductResponse> updateProduct(
        @PathVariable Long id,
        @Valid @RequestBody ProductRequest request
    ) {
        return ResponseEntity.ok(productService.updateProduct(id, request));
    }

    // ── Admin Endpoints ────────────────────────────────────────────────────

    @Operation(summary = "Delete a product", security = @SecurityRequirement(name = "bearerAuth"))
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Toggle product active status", security = @SecurityRequirement(name = "bearerAuth"))
    @PatchMapping("/{id}/toggle-active")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductResponse> toggleActive(@PathVariable Long id) {
        return ResponseEntity.ok(productService.toggleActive(id));
    }
}
