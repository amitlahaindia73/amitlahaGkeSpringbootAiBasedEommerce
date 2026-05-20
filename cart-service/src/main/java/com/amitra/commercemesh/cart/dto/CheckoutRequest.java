package com.amitra.commercemesh.cart.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record CheckoutRequest(
        @NotBlank String currency,
        @NotNull @DecimalMin("0.0") BigDecimal taxAmount,
        @NotNull @DecimalMin("0.0") BigDecimal shippingAmount,
        @NotNull @DecimalMin("0.0") BigDecimal discountAmount,
        String notes,
        @Valid @NotNull DeliveryAddressRequest deliveryAddress
) {}
