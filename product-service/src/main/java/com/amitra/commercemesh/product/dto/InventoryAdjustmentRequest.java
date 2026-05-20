package com.amitra.commercemesh.product.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record InventoryAdjustmentRequest(
        @NotNull @Min(1) Integer quantity
) {
}
