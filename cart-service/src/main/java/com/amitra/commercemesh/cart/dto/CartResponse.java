package com.amitra.commercemesh.cart.dto;

import java.math.BigDecimal;
import java.util.List;

public record CartResponse(List<CartItemResponse> items, Integer totalItems, BigDecimal subtotalAmount, String currency) {}
