package com.shopeasy.controller;

import com.shopeasy.dto.request.OrderRequest;
import com.shopeasy.dto.response.OrderResponse;
import com.shopeasy.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Tag(name = "Orders", description = "Order placement and management")
@SecurityRequirement(name = "bearerAuth")
public class OrderController {

    private final OrderService orderService;

    @Operation(summary = "Place a new order")
    @PostMapping
    public ResponseEntity<OrderResponse> placeOrder(@Valid @RequestBody OrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.placeOrder(request));
    }

    @Operation(summary = "Get my orders")
    @GetMapping
    public ResponseEntity<Page<OrderResponse>> getMyOrders(
        @RequestParam(defaultValue = "0")  int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(orderService.getMyOrders(PageRequest.of(page, size)));
    }

    @Operation(summary = "Get order by ID")
    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    @Operation(summary = "Cancel an order")
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<OrderResponse> cancelOrder(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.cancelOrder(id));
    }

    @Operation(summary = "Request a refund for a delivered order")
    @PatchMapping("/{id}/refund")
    public ResponseEntity<OrderResponse> requestRefund(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.requestRefund(id));
    }

    // ── Admin endpoints ────────────────────────────────────────────────────

    @Operation(summary = "[ADMIN] Get all orders")
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<OrderResponse>> getAllOrders(
        @RequestParam(defaultValue = "0")  int    page,
        @RequestParam(defaultValue = "20") int    size,
        @RequestParam(required = false)    String status
    ) {
        return ResponseEntity.ok(orderService.getAllOrders(PageRequest.of(page, size), status));
    }

    @Operation(summary = "[ADMIN] Update order status")
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','VENDOR')")
    public ResponseEntity<OrderResponse> updateOrderStatus(
        @PathVariable Long   id,
        @RequestParam String status
    ) {
        return ResponseEntity.ok(orderService.updateOrderStatus(id, status));
    }
}
