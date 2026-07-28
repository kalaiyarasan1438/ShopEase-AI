package com.shopeasy.repository;

import com.shopeasy.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    // User's orders
    Page<Order> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    // Filter by status
    Page<Order> findByStatusOrderByCreatedAtDesc(Order.OrderStatus status, Pageable pageable);

    // Admin: all orders with optional status filter
    @Query("""
        SELECT o FROM Order o
        WHERE (:status IS NULL OR o.status = :status)
        ORDER BY o.createdAt DESC
    """)
    Page<Order> findAllWithStatus(@Param("status") Order.OrderStatus status, Pageable pageable);

    // Vendor: orders containing vendor's products
    @Query("""
        SELECT DISTINCT o FROM Order o
        JOIN o.items oi
        WHERE oi.vendor.id = :vendorId
        ORDER BY o.createdAt DESC
    """)
    Page<Order> findByVendorId(@Param("vendorId") Long vendorId, Pageable pageable);

    // Revenue stats
    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.status = 'DELIVERED'")
    BigDecimal getTotalRevenue();

    @Query("""
        SELECT SUM(o.totalAmount) FROM Order o
        WHERE o.status = 'DELIVERED'
        AND o.createdAt >= :from AND o.createdAt <= :to
    """)
    BigDecimal getRevenueBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    // Vendor: orders by status
    @Query("""
        SELECT DISTINCT o FROM Order o
        JOIN o.items oi
        WHERE oi.vendor.id = :vendorId
        AND o.status = :status
        ORDER BY o.createdAt DESC
    """)
    Page<Order> findByVendorIdAndStatus(@Param("vendorId") Long vendorId, @Param("status") Order.OrderStatus status, Pageable pageable);

    long countByStatus(Order.OrderStatus status);
}
