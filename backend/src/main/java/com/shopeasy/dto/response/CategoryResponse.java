package com.shopeasy.dto.response;

import com.shopeasy.entity.Category;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryResponse {
    private Long id;
    private String name;
    private String slug;
    private String imageUrl;

    public static CategoryResponse fromEntity(Category c) {
        if (c == null) return null;
        return CategoryResponse.builder()
            .id(c.getId())
            .name(c.getName())
            .slug(c.getSlug())
            .imageUrl(c.getImageUrl())
            .build();
    }
}
