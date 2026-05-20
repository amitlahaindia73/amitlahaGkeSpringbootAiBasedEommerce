package com.amitra.commercemesh.cart.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderCheckoutResponse(
        String orderNumber,
        String customerId,
        String customerEmail,
        String currency,
        BigDecimal subtotalAmount,
        BigDecimal taxAmount,
        BigDecimal shippingAmount,
        BigDecimal discountAmount,
        BigDecimal totalAmount,
        String orderStatus,
        String paymentStatus,
        String deliveryStatus,
        String notes,
        String deliveryRecipientName,
        String deliveryPhoneNumber,
        String deliveryAddressLine1,
        String deliveryAddressLine2,
        String deliveryCity,
        String deliveryState,
        String deliveryPostalCode,
        String deliveryCountry,
        Instant createdAt,
        Instant updatedAt,
        List<OrderCheckoutItemResponse> items
) {}
