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

    // Full-text search across name
    @Query("""
        SELECT p FROM Product p
        JOIN FETCH p.category c
        LEFT JOIN FETCH p.vendor v
        WHERE p.isActive = true
        AND (:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')))
        AND (:categoryId IS NULL OR c.id = :categoryId)
        AND (:minPrice IS NULL OR p.price >= :minPrice)
        AND (:maxPrice IS NULL OR p.price <= :maxPrice)
    """)
    Page<Product> findWithFilters(
        @Param("search")     String     search,
        @Param("categoryId") Long       categoryId,
        @Param("minPrice")   BigDecimal minPrice,
        @Param("maxPrice")   BigDecimal maxPrice,
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
}
