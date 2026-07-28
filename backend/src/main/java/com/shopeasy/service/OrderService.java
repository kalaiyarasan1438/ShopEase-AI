package com.shopeasy.service;

import com.shopeasy.dto.request.OrderRequest;
import com.shopeasy.dto.response.OrderResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface OrderService {
    OrderResponse placeOrder(OrderRequest request);
    Page<OrderResponse> getMyOrders(Pageable pageable);
    OrderResponse getOrderById(Long id);
    OrderResponse cancelOrder(Long id);
    Page<OrderResponse> getAllOrders(Pageable pageable, String status);
    OrderResponse updateOrderStatus(Long id, String status);
}
