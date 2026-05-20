package com.amitra.commercemesh.order.dto;

import java.math.BigDecimal;

public record ProductSummary(
        String id,
        String sku,
        String name,
        BigDecimal price,
        Integer availableQuantity,
        String imageUrl,
        Boolean active
) {
}
