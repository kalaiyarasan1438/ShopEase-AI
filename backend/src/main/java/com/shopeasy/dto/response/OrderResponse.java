package com.shopeasy.dto.response;

import com.shopeasy.entity.Order;
import com.shopeasy.entity.OrderItem;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class OrderResponse {

    private Long          id;
    private String        orderNumber;
    private String        status;
    private BigDecimal    totalAmount;
    private BigDecimal    shippingAmount;
    private BigDecimal    taxAmount;
    private String        paymentMethod;
    private String        paymentStatus;
    private String        shippingName;
    private String        shippingAddressLine1;
    private String        shippingCity;
    private String        shippingState;
    private String        shippingZip;
    private String        shippingCountry;
    private String        trackingNumber;
    private List<ItemDto> items;
    private LocalDateTime createdAt;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ItemDto {
        private Long       productId;
        private String     productName;
        private Integer    quantity;
        private BigDecimal unitPrice;
        private BigDecimal subtotal;
    }

    public static OrderResponse fromEntity(Order o) {
        List<ItemDto> items = o.getItems().stream().map(i ->
            ItemDto.builder()
                .productId(i.getProduct().getId())
                .productName(i.getProduct().getName())
                .quantity(i.getQuantity())
                .unitPrice(i.getUnitPrice())
                .subtotal(i.getSubtotal())
                .build()
        ).collect(Collectors.toList());

        return OrderResponse.builder()
            .id(o.getId())
            .orderNumber("ORD-" + o.getId())
            .status(o.getStatus().name())
            .totalAmount(o.getTotalAmount())
            .shippingAmount(o.getShippingAmount())
            .taxAmount(o.getTaxAmount())
            .paymentMethod(o.getPaymentMethod() != null ? o.getPaymentMethod().name() : null)
            .paymentStatus(o.getPaymentStatus().name())
            .shippingName(o.getShippingName())
            .shippingAddressLine1(o.getShippingAddressLine1())
            .shippingCity(o.getShippingCity())
            .shippingState(o.getShippingState())
            .shippingZip(o.getShippingZip())
            .shippingCountry(o.getShippingCountry())
            .trackingNumber(o.getTrackingNumber())
            .items(items)
            .createdAt(o.getCreatedAt())
            .build();
    }
}
