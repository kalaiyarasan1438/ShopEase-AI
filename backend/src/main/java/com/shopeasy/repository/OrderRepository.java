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
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    // User's orders
    Page<Order> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    long countByUserId(Long userId);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.user.id = :userId AND o.status <> 'CANCELLED'")
    BigDecimal calculateTotalSpentByUserId(@Param("userId") Long userId);

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

    // ── Admin analytics queries ──────────────────────────────────────────

    // Monthly revenue aggregation (returns Object[] arrays of {month-number, sum})
    @Query("""
        SELECT MONTH(o.createdAt), SUM(o.totalAmount)
        FROM Order o
        WHERE o.status = 'DELIVERED'
        AND YEAR(o.createdAt) = :year
        GROUP BY MONTH(o.createdAt)
        ORDER BY MONTH(o.createdAt)
    """)
    List<Object[]> getMonthlyRevenue(@Param("year") int year);

    // Monthly order counts
    @Query("""
        SELECT MONTH(o.createdAt), COUNT(o)
        FROM Order o
        WHERE YEAR(o.createdAt) = :year
        GROUP BY MONTH(o.createdAt)
        ORDER BY MONTH(o.createdAt)
    """)
    List<Object[]> getMonthlyOrders(@Param("year") int year);

    // Category revenue distribution
    @Query("""
        SELECT c.name, SUM(oi.subtotal)
        FROM OrderItem oi
        JOIN oi.product p
        JOIN p.category c
        JOIN oi.order o
        WHERE o.status = 'DELIVERED'
        GROUP BY c.name
        ORDER BY SUM(oi.subtotal) DESC
    """)
    List<Object[]> getCategoryRevenue();

    // Top selling products by order count
    @Query("""
        SELECT p.name, SUM(oi.quantity), SUM(oi.subtotal)
        FROM OrderItem oi
        JOIN oi.product p
        JOIN oi.order o
        WHERE o.status NOT IN ('CANCELLED')
        GROUP BY p.name
        ORDER BY SUM(oi.quantity) DESC
    """)
    List<Object[]> getTopSellingProducts(Pageable pageable);

    // Top customers by spend
    @Query("""
        SELECT u.firstName, u.lastName, u.email, COUNT(o), SUM(o.totalAmount)
        FROM Order o JOIN o.user u
        WHERE o.status = 'DELIVERED'
        GROUP BY u.id, u.firstName, u.lastName, u.email
        ORDER BY SUM(o.totalAmount) DESC
    """)
    List<Object[]> getTopCustomers(Pageable pageable);

    // Refund rate
    long countByPaymentStatus(Order.PaymentStatus paymentStatus);

    // Filter by payment method
    @Query("""
        SELECT o FROM Order o
        WHERE (:status IS NULL OR o.status = :status)
        AND (:paymentMethod IS NULL OR o.paymentMethod = :paymentMethod)
        AND (:paymentStatus IS NULL OR o.paymentStatus = :paymentStatus)
        ORDER BY o.createdAt DESC
    """)
    Page<Order> findWithFilters(
        @Param("status") Order.OrderStatus status,
        @Param("paymentMethod") Order.PaymentMethod paymentMethod,
        @Param("paymentStatus") Order.PaymentStatus paymentStatus,
        Pageable pageable
    );
}
