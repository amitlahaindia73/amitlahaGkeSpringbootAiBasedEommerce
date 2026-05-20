package com.amitra.commercemesh.order.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public record CreateOrderRequest(
        @NotBlank String currency,
        @NotNull @DecimalMin(value = "0.0") BigDecimal taxAmount,
        @NotNull @DecimalMin(value = "0.0") BigDecimal shippingAmount,
        @NotNull @DecimalMin(value = "0.0") BigDecimal discountAmount,
        String notes,
        @Valid @NotNull DeliveryAddressRequest deliveryAddress,
        @Valid @NotEmpty List<OrderItemRequest> items
) {
}
