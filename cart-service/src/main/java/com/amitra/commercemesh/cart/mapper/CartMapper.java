package com.amitra.commercemesh.cart.mapper;

import com.amitra.commercemesh.cart.domain.CartItemEntity;
import com.amitra.commercemesh.cart.dto.CartItemResponse;
import com.amitra.commercemesh.cart.dto.CartResponse;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
public class CartMapper {

    public CartResponse toResponse(List<CartItemEntity> items) {
        List<CartItemResponse> mappedItems = items.stream()
                .map(this::toItemResponse)
                .toList();

        int totalItems = items.stream().mapToInt(item -> item.getQuantity() == null ? 0 : item.getQuantity()).sum();
        BigDecimal subtotal = items.stream()
                .map(item -> item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        String currency = items.isEmpty() ? "USD" : items.get(0).getCurrency();

        return new CartResponse(mappedItems, totalItems, subtotal, currency);
    }

    private CartItemResponse toItemResponse(CartItemEntity item) {
        return new CartItemResponse(
                item.getProductId(),
                item.getProductName(),
                item.getSku(),
                item.getImageUrl(),
                item.getQuantity(),
                item.getUnitPrice(),
                item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()))
        );
    }
}
