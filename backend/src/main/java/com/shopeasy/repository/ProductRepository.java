package com.shopeasy.repository;

import com.shopeasy.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    // Full-text search across name, description, and category name
    @Query(
        value = """
            SELECT p FROM Product p
            JOIN p.category c
            LEFT JOIN p.vendor v
            WHERE p.isActive = true
            AND (:search IS NULL OR :search = '' OR (
                LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR
                LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')) OR
                LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%'))
            ))
            AND (:categoryId IS NULL OR c.id = :categoryId)
            AND (:minPrice IS NULL OR p.price >= :minPrice)
            AND (:maxPrice IS NULL OR p.price <= :maxPrice)
            AND (:ratingMin IS NULL OR p.ratingAvg >= :ratingMin)
        """,
        countQuery = """
            SELECT COUNT(p) FROM Product p
            JOIN p.category c
            WHERE p.isActive = true
            AND (:search IS NULL OR :search = '' OR (
                LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR
                LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')) OR
                LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%'))
            ))
            AND (:categoryId IS NULL OR c.id = :categoryId)
            AND (:minPrice IS NULL OR p.price >= :minPrice)
            AND (:maxPrice IS NULL OR p.price <= :maxPrice)
            AND (:ratingMin IS NULL OR p.ratingAvg >= :ratingMin)
        """
    )
    Page<Product> findWithFilters(
        @Param("search")     String     search,
        @Param("categoryId") Long       categoryId,
        @Param("minPrice")   BigDecimal minPrice,
        @Param("maxPrice")   BigDecimal maxPrice,
        @Param("ratingMin")  Double     ratingMin,
        Pageable pageable
    );

    // Featured products (by badge or high rating)
    @Query("""
        SELECT p FROM Product p
        WHERE p.isActive = true
        AND (p.badge IS NOT NULL OR p.ratingAvg >= 4.5)
        ORDER BY p.ratingCount DESC
    """)
    List<Product> findFeatured(Pageable pageable);

    // Products by vendor
    Page<Product> findByVendorIdAndIsActiveTrue(Long vendorId, Pageable pageable);

    // Products by category
    Page<Product> findByCategoryIdAndIsActiveTrue(Long categoryId, Pageable pageable);

    // Low stock products (for vendor/admin alerts)
    @Query("SELECT p FROM Product p WHERE p.vendor.id = :vendorId AND p.stockQty <= :threshold AND p.isActive = true")
    List<Product> findLowStock(@Param("vendorId") Long vendorId, @Param("threshold") int threshold);

    // Count by vendor
    long countByVendorIdAndIsActiveTrue(Long vendorId);

    // Vendor product search
    Page<Product> findByVendorIdAndNameContainingIgnoreCaseAndIsActiveTrue(Long vendorId, String name, Pageable pageable);

    // ── Admin queries ──────────────────────────────────────────────────────

    // Admin: all products including hidden ones
    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.category LEFT JOIN FETCH p.vendor ORDER BY p.createdAt DESC")
    Page<Product> findAllAdmin(Pageable pageable);

    // Low stock across entire platform
    @Query("SELECT p FROM Product p WHERE p.stockQty <= :threshold AND p.isActive = true ORDER BY p.stockQty ASC")
    List<Product> findLowStockAll(@Param("threshold") int threshold);

    // Count active products
    long countByIsActiveTrue();

    // Count hidden products
    long countByIsActiveFalse();

    // Check by name
    boolean existsByName(String name);

    // Find product by name
    java.util.Optional<Product> findByName(String name);
}
