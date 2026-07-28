package com.shopeasy.dto.response;

import com.shopeasy.entity.Product;
import com.shopeasy.entity.ProductImage;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {

    private Long         id;
    private String       name;
    private String       description;
    private BigDecimal   price;
    private BigDecimal   oldPrice;
    private Integer      stockQty;
    private Long         categoryId;
    private String       categoryName;
    private Long         vendorId;
    private String       vendorName;
    private String       imageUrl;
    private List<String> galleryImages;
    private String       badge;
    private Double       ratingAvg;
    private Integer      ratingCount;
    private Map<String, String> specifications;
    private boolean      isActive;
    private LocalDateTime createdAt;

    public static ProductResponse fromEntity(Product p) {
        String imageUrl = p.getImages().stream()
            .filter(img -> img.isPrimary())
            .findFirst()
            .map(img -> img.getImageUrl())
            .orElse(p.getImages().isEmpty() ? null : p.getImages().get(0).getImageUrl());

        List<String> gallery = p.getImages().stream()
            .sorted(Comparator.comparingInt(ProductImage::getSortOrder))
            .map(ProductImage::getImageUrl)
            .collect(Collectors.toList());

        return ProductResponse.builder()
            .id(p.getId())
            .name(p.getName())
            .description(p.getDescription())
            .price(p.getPrice())
            .oldPrice(p.getOldPrice())
            .stockQty(p.getStockQty())
            .categoryId(p.getCategory() != null ? p.getCategory().getId() : null)
            .categoryName(p.getCategory() != null ? p.getCategory().getName() : null)
            .vendorId(p.getVendor() != null ? p.getVendor().getId() : null)
            .vendorName(p.getVendor() != null ? p.getVendor().getBusinessName() : null)
            .imageUrl(imageUrl)
            .galleryImages(gallery)
            .badge(p.getBadge())
            .ratingAvg(p.getRatingAvg())
            .ratingCount(p.getRatingCount())
            .specifications(p.getSpecifications())
            .isActive(p.isActive())
            .createdAt(p.getCreatedAt())
            .build();
    }
}

