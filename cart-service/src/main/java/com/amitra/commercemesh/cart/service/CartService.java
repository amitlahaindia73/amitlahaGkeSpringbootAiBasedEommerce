package com.amitra.commercemesh.cart.service;

import com.amitra.commercemesh.cart.domain.CartItemEntity;
import com.amitra.commercemesh.cart.dto.*;
import com.amitra.commercemesh.cart.exception.InvalidCartException;
import com.amitra.commercemesh.cart.mapper.CartMapper;
import com.amitra.commercemesh.cart.repository.CartItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class CartService {

    private final CartItemRepository repository;
    private final ProductClient productClient;
    private final OrderClient orderClient;
    private final CartMapper mapper;

    public CartService(CartItemRepository repository, ProductClient productClient, OrderClient orderClient, CartMapper mapper) {
        this.repository = repository;
        this.productClient = productClient;
        this.orderClient = orderClient;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public CartResponse getCart(String customerId) {
        return mapper.toResponse(repository.findByCustomerIdOrderByUpdatedAtDesc(customerId));
    }

    @Transactional
    public CartResponse addItem(String customerId, String email, AddCartItemRequest request, String requestId) {
        ProductSummary product = productClient.getProduct(request.productId(), requestId);
        int requestedQuantity = request.quantity() == null ? 1 : request.quantity();
        validateStock(product, requestedQuantity);

        CartItemEntity item = repository.findByCustomerIdAndProductId(customerId, request.productId()).orElseGet(CartItemEntity::new);
        int newQuantity = requestedQuantity + (item.getId() == null ? 0 : item.getQuantity());
        validateStock(product, newQuantity);

        item.setCustomerId(customerId);
        item.setCustomerEmail(email);
        item.setProductId(product.id());
        item.setProductName(product.name());
        item.setSku(product.sku());
        item.setImageUrl(product.imageUrl());
        item.setUnitPrice(money(product.price()));
        item.setQuantity(newQuantity);
        item.setCurrency("USD");

        repository.save(item);
        return getCart(customerId);
    }

    @Transactional
    public CartResponse updateItem(String customerId, String productId, UpdateCartItemRequest request, String requestId) {
        CartItemEntity item = repository.findByCustomerIdAndProductId(customerId, productId)
                .orElseThrow(() -> new InvalidCartException("Cart item not found for product: " + productId));

        ProductSummary product = productClient.getProduct(productId, requestId);
        validateStock(product, request.quantity());

        item.setQuantity(request.quantity());
        item.setUnitPrice(money(product.price()));
        item.setProductName(product.name());
        item.setSku(product.sku());
        item.setImageUrl(product.imageUrl());
        repository.save(item);
        return getCart(customerId);
    }

    @Transactional
    public CartResponse removeItem(String customerId, String productId) {
        repository.deleteByCustomerIdAndProductId(customerId, productId);
        return getCart(customerId);
    }

    @Transactional
    public CartResponse clearCart(String customerId) {
        repository.deleteByCustomerId(customerId);
        return getCart(customerId);
    }

    @Transactional
    public OrderCheckoutResponse checkout(String customerId, String email, String username, CheckoutRequest request, String requestId) {
        List<CartItemEntity> items = repository.findByCustomerIdOrderByUpdatedAtDesc(customerId);
        if (items.isEmpty()) {
            throw new InvalidCartException("Cart is empty. Add at least one item before checkout.");
        }

        for (CartItemEntity item : items) {
            ProductSummary product = productClient.getProduct(item.getProductId(), requestId);
            validateStock(product, item.getQuantity());
            item.setUnitPrice(money(product.price()));
            item.setProductName(product.name());
            item.setSku(product.sku());
            item.setImageUrl(product.imageUrl());
        }

        repository.saveAll(items);

        OrderCheckoutRequest orderRequest = new OrderCheckoutRequest(
                request.currency(),
                money(request.taxAmount()),
                money(request.shippingAmount()),
                money(request.discountAmount()),
                request.notes(),
                request.deliveryAddress(),
                items.stream().map(item -> new OrderCheckoutItemRequest(item.getProductId(), item.getQuantity())).toList()
        );

        OrderCheckoutResponse orderResponse = orderClient.createOrder(customerId, email, username, orderRequest, requestId);
        repository.deleteByCustomerId(customerId);
        return orderResponse;
    }

    private void validateStock(ProductSummary product, Integer quantity) {
        Integer available = product.availableQuantity();
        if (available != null && quantity > available) {
            throw new InvalidCartException("Requested quantity exceeds available stock for product: " + product.id());
        }
    }

    private BigDecimal money(Number value) {
        return value == null ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.valueOf(value.doubleValue()).setScale(2, RoundingMode.HALF_UP);
    }
}
