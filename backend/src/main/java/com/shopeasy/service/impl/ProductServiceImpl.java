package com.shopeasy.service.impl;

import com.shopeasy.dto.request.ProductRequest;
import com.shopeasy.dto.response.ProductResponse;
import com.shopeasy.entity.Category;
import com.shopeasy.entity.Product;
import com.shopeasy.entity.Vendor;
import com.shopeasy.exception.ResourceNotFoundException;
import com.shopeasy.repository.CategoryRepository;
import com.shopeasy.repository.ProductRepository;
import com.shopeasy.repository.VendorRepository;
import com.shopeasy.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductServiceImpl implements ProductService {

    private final ProductRepository  productRepository;
    private final CategoryRepository categoryRepository;
    private final VendorRepository   vendorRepository;

    @Override
    public Page<ProductResponse> getProducts(
        Pageable    pageable,
        String      search,
        Long        categoryId,
        BigDecimal  minPrice,
        BigDecimal  maxPrice,
        Double      ratingMin
    ) {
        return productRepository
            .findWithFilters(search, categoryId, minPrice, maxPrice, ratingMin, pageable)
            .map(ProductResponse::fromEntity);
    }

    @Override
    public ProductResponse getProductById(Long id) {
        return productRepository.findById(id)
            .map(ProductResponse::fromEntity)
            .orElseThrow(() -> new ResourceNotFoundException("Product", id));
    }

    @Override
    public Page<ProductResponse> searchProducts(String query, Pageable pageable) {
        return productRepository
            .findWithFilters(query, null, null, null, null, pageable)
            .map(ProductResponse::fromEntity);
    }

    @Override
    public List<ProductResponse> getFeaturedProducts(int limit) {
        return productRepository
            .findFeatured(PageRequest.of(0, limit))
            .stream()
            .map(ProductResponse::fromEntity)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ProductResponse createProduct(ProductRequest req) {
        Category category = categoryRepository.findById(req.getCategoryId())
            .orElseThrow(() -> new ResourceNotFoundException("Category", req.getCategoryId()));

        // Get vendor from logged-in user
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Vendor vendor = vendorRepository.findByUserId(
            // In production fetch user id from UserRepository
            1L // placeholder
        ).orElse(null);

        Product product = Product.builder()
            .name(req.getName())
            .description(req.getDescription())
            .price(req.getPrice())
            .oldPrice(req.getOldPrice())
            .stockQty(req.getStockQty())
            .category(category)
            .vendor(vendor)
            .badge(req.getBadge())
            .isActive(true)
            .build();

        Product saved = productRepository.save(product);
        log.info("Product created: {} (id={})", saved.getName(), saved.getId());
        return ProductResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest req) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Product", id));

        if (req.getName()        != null) product.setName(req.getName());
        if (req.getDescription() != null) product.setDescription(req.getDescription());
        if (req.getPrice()       != null) product.setPrice(req.getPrice());
        if (req.getOldPrice()    != null) product.setOldPrice(req.getOldPrice());
        if (req.getStockQty()    != null) product.setStockQty(req.getStockQty());
        if (req.getBadge()       != null) product.setBadge(req.getBadge());

        if (req.getCategoryId() != null) {
            Category category = categoryRepository.findById(req.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", req.getCategoryId()));
            product.setCategory(category);
        }

        return ProductResponse.fromEntity(productRepository.save(product));
    }

    @Override
    @Transactional
    public void deleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            throw new ResourceNotFoundException("Product", id);
        }
        productRepository.deleteById(id);
        log.info("Product deleted: id={}", id);
    }

    @Override
    @Transactional
    public ProductResponse toggleActive(Long id) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Product", id));
        product.setActive(!product.isActive());
        return ProductResponse.fromEntity(productRepository.save(product));
    }
}
