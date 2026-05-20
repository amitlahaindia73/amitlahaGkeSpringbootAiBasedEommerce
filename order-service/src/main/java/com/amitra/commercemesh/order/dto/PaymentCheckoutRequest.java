package com.amitra.commercemesh.order.dto;

public record PaymentCheckoutRequest(
        String orderId,
        String userId,
        String productId,
        Double amount
) {
}
