package com.shopeasy.service;

import com.shopeasy.dto.request.ProductRequest;
import com.shopeasy.dto.response.ProductResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;

public interface ProductService {
    Page<ProductResponse> getProducts(Pageable pageable, String search, Long categoryId, BigDecimal minPrice, BigDecimal maxPrice, Double ratingMin);
    ProductResponse getProductById(Long id);
    Page<ProductResponse> searchProducts(String query, Pageable pageable);
    List<ProductResponse> getFeaturedProducts(int limit);
    ProductResponse createProduct(ProductRequest request);
    ProductResponse updateProduct(Long id, ProductRequest request);
    void deleteProduct(Long id);
    ProductResponse toggleActive(Long id);
}
