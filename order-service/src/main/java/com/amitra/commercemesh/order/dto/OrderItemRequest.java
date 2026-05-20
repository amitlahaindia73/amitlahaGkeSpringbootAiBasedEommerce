package com.amitra.commercemesh.order.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record OrderItemRequest(
        @NotBlank String productId,
        @Min(1) Integer quantity
) {
}
