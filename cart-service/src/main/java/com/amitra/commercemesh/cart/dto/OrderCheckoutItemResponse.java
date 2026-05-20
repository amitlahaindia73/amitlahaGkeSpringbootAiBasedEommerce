package com.amitra.commercemesh.cart.dto;

import java.math.BigDecimal;

public record OrderCheckoutItemResponse(String productId, String productName, String sku, String imageUrl, Integer quantity, BigDecimal unitPrice, BigDecimal lineTotal) {}
