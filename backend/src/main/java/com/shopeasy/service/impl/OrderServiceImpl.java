package com.shopeasy.service.impl;

import com.shopeasy.dto.request.OrderRequest;
import com.shopeasy.dto.response.OrderResponse;
import com.shopeasy.entity.*;
import com.shopeasy.exception.ResourceNotFoundException;
import com.shopeasy.exception.UnauthorizedException;
import com.shopeasy.repository.*;
import com.shopeasy.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderServiceImpl implements OrderService {

    private final OrderRepository   orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository    userRepository;
    private final CartRepository    cartRepository;

    private static final BigDecimal TAX_RATE      = new BigDecimal("0.08");
    private static final BigDecimal FREE_SHIP_MIN = new BigDecimal("50.00");
    private static final BigDecimal SHIP_STANDARD = new BigDecimal("9.99");

    @Override
    @Transactional
    public OrderResponse placeOrder(OrderRequest req) {
        User user = getCurrentUser();

        // Build order items & calculate totals
        List<OrderItem> items = req.getItems().stream().map(itemReq -> {
            Product product = productRepository.findById(itemReq.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", itemReq.getProductId()));

            if (product.getStockQty() < itemReq.getQuantity()) {
                throw new IllegalArgumentException(
                    "Insufficient stock for: " + product.getName()
                );
            }

            // Decrement stock
            product.setStockQty(product.getStockQty() - itemReq.getQuantity());
            productRepository.save(product);

            BigDecimal subtotal = product.getPrice()
                .multiply(BigDecimal.valueOf(itemReq.getQuantity()));

            return OrderItem.builder()
                .product(product)
                .vendor(product.getVendor())
                .quantity(itemReq.getQuantity())
                .unitPrice(product.getPrice())
                .subtotal(subtotal)
                .build();
        }).collect(Collectors.toList());

        BigDecimal subtotal = items.stream()
            .map(OrderItem::getSubtotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal shippingCost = subtotal.compareTo(FREE_SHIP_MIN) >= 0
            ? BigDecimal.ZERO : SHIP_STANDARD;
        BigDecimal tax   = subtotal.multiply(TAX_RATE);
        BigDecimal total = subtotal.add(shippingCost).add(tax);

        Order.PaymentMethod pm;
        try {
            pm = Order.PaymentMethod.valueOf(
                req.getPaymentMethod() != null ? req.getPaymentMethod().toUpperCase() : "CARD"
            );
        } catch (IllegalArgumentException e) {
            pm = Order.PaymentMethod.CARD;
        }

        // For Cash on Delivery (COD), payment status is PENDING upon order placement
        Order.PaymentStatus ps = (pm == Order.PaymentMethod.COD)
            ? Order.PaymentStatus.PENDING
            : Order.PaymentStatus.PAID;

        Order order = Order.builder()
            .user(user)
            .status(Order.OrderStatus.ORDER_PLACED)
            .totalAmount(total)
            .shippingAmount(shippingCost)
            .taxAmount(tax)
            .shippingName(req.getShippingName())
            .shippingAddressLine1(req.getShippingAddressLine1())
            .shippingAddressLine2(req.getShippingAddressLine2())
            .shippingCity(req.getShippingCity())
            .shippingState(req.getShippingState())
            .shippingZip(req.getShippingZip())
            .shippingCountry(req.getShippingCountry())
            .paymentMethod(pm)
            .paymentStatus(ps)
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        items.forEach(item -> {
            item.setOrder(order);
            order.getItems().add(item);
        });

        Order saved = orderRepository.save(order);
        log.info("Order placed: id={} user={} total={} method={}", saved.getId(), user.getEmail(), total, pm);

        // Clear user's cart after successful order
        cartRepository.findByUserId(user.getId())
            .ifPresent(cart -> { cart.getItems().clear(); cartRepository.save(cart); });

        return OrderResponse.fromEntity(saved);
    }

    @Override
    public Page<OrderResponse> getMyOrders(Pageable pageable) {
        User user = getCurrentUser();
        return orderRepository
            .findByUserIdOrderByCreatedAtDesc(user.getId(), pageable)
            .map(OrderResponse::fromEntity);
    }

    @Override
    public OrderResponse getOrderById(Long id) {
        Order order = orderRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Order", id));
        User user = getCurrentUser();
        if (!order.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedException("Access denied to order " + id);
        }
        return OrderResponse.fromEntity(order);
    }

    @Override
    @Transactional
    public OrderResponse cancelOrder(Long id) {
        Order order = orderRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Order", id));
        User user = getCurrentUser();
        if (!order.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedException("Access denied to order " + id);
        }

        if (order.getStatus() != Order.OrderStatus.ORDER_PLACED &&
            order.getStatus() != Order.OrderStatus.CONFIRMED &&
            order.getStatus() != Order.OrderStatus.PROCESSING) {
            throw new IllegalArgumentException("Cannot cancel order in status: " + order.getStatus() + ". Cancellation is only permitted before order is Out for Delivery or Delivered.");
        }

        // Restore product stock quantity
        restoreStock(order);

        order.setStatus(Order.OrderStatus.CANCELLED);
        order.setUpdatedAt(LocalDateTime.now());
        Order saved = orderRepository.save(order);
        log.info("Order cancelled: id={} user={}", saved.getId(), user.getEmail());
        return OrderResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public OrderResponse requestRefund(Long id) {
        Order order = orderRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Order", id));
        User user = getCurrentUser();
        if (!order.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedException("Access denied to order " + id);
        }

        if (order.getStatus() != Order.OrderStatus.DELIVERED) {
            throw new IllegalArgumentException("Refund can only be requested for Delivered orders. Current status: " + order.getStatus());
        }

        order.setStatus(Order.OrderStatus.REFUND_REQUESTED);
        order.setUpdatedAt(LocalDateTime.now());
        Order saved = orderRepository.save(order);
        log.info("Refund requested for order: id={} user={}", saved.getId(), user.getEmail());
        return OrderResponse.fromEntity(saved);
    }

    @Override
    public Page<OrderResponse> getAllOrders(Pageable pageable, String status) {
        Order.OrderStatus os = status != null ? Order.OrderStatus.valueOf(status.toUpperCase()) : null;
        return orderRepository.findAllWithStatus(os, pageable).map(OrderResponse::fromEntity);
    }

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(Long id, String statusStr) {
        Order order = orderRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Order", id));

        Order.OrderStatus newStatus = Order.OrderStatus.valueOf(statusStr.toUpperCase());
        Order.OrderStatus oldStatus = order.getStatus();

        // If rejecting refund → revert to DELIVERED
        if (newStatus == Order.OrderStatus.REFUND_REJECTED) {
            order.setStatus(Order.OrderStatus.DELIVERED);
            order.setUpdatedAt(LocalDateTime.now());
            Order saved = orderRepository.save(order);
            log.info("Refund rejected for order: id={}, reverted to DELIVERED", id);
            return OrderResponse.fromEntity(saved);
        }

        // If approving refund → update payment status
        if (newStatus == Order.OrderStatus.REFUNDED) {
            order.setPaymentStatus(Order.PaymentStatus.REFUNDED);
        }

        // If marked as DELIVERED and was COD, mark payment as PAID
        if (newStatus == Order.OrderStatus.DELIVERED && order.getPaymentMethod() == Order.PaymentMethod.COD) {
            order.setPaymentStatus(Order.PaymentStatus.PAID);
        }

        // Stock restoration if moving to CANCELLED
        if (newStatus == Order.OrderStatus.CANCELLED && oldStatus != Order.OrderStatus.CANCELLED) {
            restoreStock(order);
        }

        order.setStatus(newStatus);
        order.setUpdatedAt(LocalDateTime.now());
        Order saved = orderRepository.save(order);
        log.info("Order status updated: id={} from={} to={}", id, oldStatus, newStatus);
        return OrderResponse.fromEntity(saved);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

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

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
