package com.amitra.commercemesh.product.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ProductUpsertRequest(
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Size(max = 80) String category,
        @NotBlank @Size(max = 2000) String description,
        @NotNull @DecimalMin(value = "0.0", inclusive = false) Double price,
        @Size(max = 120) String sku,
        @Size(max = 500) String imageUrl,
        @NotNull Integer availableQuantity,
        Boolean active
) {}
