package com.amitra.commercemesh.cart.dto;

import java.math.BigDecimal;
import java.util.List;

public record OrderCheckoutRequest(
        String currency,
        BigDecimal taxAmount,
        BigDecimal shippingAmount,
        BigDecimal discountAmount,
        String notes,
        DeliveryAddressRequest deliveryAddress,
        List<OrderCheckoutItemRequest> items
) {}
