package com.shopeasy.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserStatsResponse {
    private long ordersCount;
    private long wishlistCount;
    private long reviewsCount;
    private BigDecimal totalSpent;
}
