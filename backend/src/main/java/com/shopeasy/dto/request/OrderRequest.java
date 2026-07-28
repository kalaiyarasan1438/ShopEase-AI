package com.shopeasy.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.List;

@Data
public class OrderRequest {

    @NotBlank private String shippingName;
    @NotBlank private String shippingAddressLine1;
    private String shippingAddressLine2;
    @NotBlank private String shippingCity;
    @NotBlank private String shippingState;
    @NotBlank private String shippingZip;
    @NotBlank private String shippingCountry;

    private String paymentMethod;   // CARD | UPI | BANK | WALLET | COD
    private String shippingOption;  // STANDARD | EXPRESS | OVERNIGHT
    private String couponCode;

    @NotEmpty(message = "Order must contain at least one item")
    private List<OrderItemRequest> items;

    @Data
    public static class OrderItemRequest {
        @NotNull private Long productId;
        @Min(1)  private Integer quantity;
    }
}
