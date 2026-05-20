package com.amitra.commercemesh.payment.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CheckoutRequest(
        @NotBlank String orderId,
        @NotBlank String userId,
        @NotBlank String productId,
        @NotNull @DecimalMin(value = "0.0", inclusive = false) Double amount
) {}
