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

    @com.fasterxml.jackson.annotation.JsonIgnore
    @AssertTrue(message = "Enter a valid postal/PIN code for the selected country")
    public boolean isShippingZipValid() {
        if (shippingZip == null || shippingZip.isBlank()) return true;
        String zip = shippingZip.trim();
        String country = shippingCountry != null ? shippingCountry.trim().toLowerCase() : "";

        if ("india".equals(country) || "in".equals(country)) {
            return zip.matches("^\\d{6}$");
        }
        if ("united states".equals(country) || "us".equals(country) || "usa".equals(country)) {
            return zip.matches("^\\d{5}(-\\d{4})?$");
        }
        if ("united kingdom".equals(country) || "uk".equals(country) || "gb".equals(country)) {
            return zip.matches("(?i)^[A-Z]{1,2}\\d[A-Z\\d]? ?\\d[A-Z]{2}$");
        }
        if ("canada".equals(country) || "ca".equals(country)) {
            return zip.matches("(?i)^[A-Z]\\d[A-Z] ?\\d[A-Z]\\d$");
        }
        if ("australia".equals(country) || "au".equals(country)) {
            return zip.matches("^\\d{4}$");
        }
        // Generic fallback for other countries
        return zip.matches("(?i)^[A-Z0-9\\s\\-]{3,10}$");
    }
}
