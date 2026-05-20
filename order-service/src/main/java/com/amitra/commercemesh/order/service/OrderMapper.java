package com.amitra.commercemesh.order.service;

import com.amitra.commercemesh.order.domain.OrderEntity;
import com.amitra.commercemesh.order.domain.OrderItemEntity;
import com.amitra.commercemesh.order.dto.OrderItemResponse;
import com.amitra.commercemesh.order.dto.OrderResponse;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class OrderMapper {

    public OrderResponse toResponse(OrderEntity entity) {
        List<OrderItemResponse> items = entity.getItems().stream()
                .map(this::toItemResponse)
                .toList();
        return new OrderResponse(
                entity.getOrderNumber(),
                entity.getCustomerId(),
                entity.getCustomerEmail(),
                entity.getCurrency(),
                entity.getSubtotalAmount(),
                entity.getTaxAmount(),
                entity.getShippingAmount(),
                entity.getDiscountAmount(),
                entity.getTotalAmount(),
                entity.getOrderStatus(),
                entity.getPaymentStatus(),
                entity.getDeliveryStatus(),
                entity.getNotes(),
                entity.getDeliveryRecipientName(),
                entity.getDeliveryPhoneNumber(),
                entity.getDeliveryAddressLine1(),
                entity.getDeliveryAddressLine2(),
                entity.getDeliveryCity(),
                entity.getDeliveryState(),
                entity.getDeliveryPostalCode(),
                entity.getDeliveryCountry(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                items
        );
    }

    private OrderItemResponse toItemResponse(OrderItemEntity item) {
        return new OrderItemResponse(
                item.getProductId(),
                item.getProductName(),
                item.getSku(),
                item.getImageUrl(),
                item.getQuantity(),
                item.getUnitPrice(),
                item.getLineTotal()
        );
    }
}
