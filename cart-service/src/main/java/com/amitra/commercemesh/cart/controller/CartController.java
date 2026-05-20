package com.amitra.commercemesh.cart.controller;

import com.amitra.commercemesh.cart.api.ApiResponse;
import com.amitra.commercemesh.cart.dto.AddCartItemRequest;
import com.amitra.commercemesh.cart.dto.CartResponse;
import com.amitra.commercemesh.cart.dto.CheckoutRequest;
import com.amitra.commercemesh.cart.dto.OrderCheckoutResponse;
import com.amitra.commercemesh.cart.dto.UpdateCartItemRequest;
import com.amitra.commercemesh.cart.service.CartService;
import com.amitra.commercemesh.security.UserContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping
    public ApiResponse<CartResponse> getCart(HttpServletRequest request) {
        UserContext userContext = new UserContext(request);
        return ApiResponse.success(cartService.getCart(userContext.getUserId()),
                "Cart fetched successfully", request.getHeader("X-Request-Id"));
    }

    @PostMapping("/items")
    public ApiResponse<CartResponse> addItem(@Valid @RequestBody AddCartItemRequest requestBody, HttpServletRequest request) {
        UserContext userContext = new UserContext(request);
        return ApiResponse.success(cartService.addItem(userContext.getUserId(), userContext.getEmail(), requestBody, request.getHeader("X-Request-Id")),
                "Item added to cart successfully", request.getHeader("X-Request-Id"));
    }

    @PutMapping("/items/{productId}")
    public ApiResponse<CartResponse> updateItem(@PathVariable String productId,
                                                @Valid @RequestBody UpdateCartItemRequest requestBody,
                                                HttpServletRequest request) {
        UserContext userContext = new UserContext(request);
        return ApiResponse.success(cartService.updateItem(userContext.getUserId(), productId, requestBody, request.getHeader("X-Request-Id")),
                "Cart item updated successfully", request.getHeader("X-Request-Id"));
    }

    @DeleteMapping("/items/{productId}")
    public ApiResponse<CartResponse> removeItem(@PathVariable String productId, HttpServletRequest request) {
        UserContext userContext = new UserContext(request);
        return ApiResponse.success(cartService.removeItem(userContext.getUserId(), productId),
                "Cart item removed successfully", request.getHeader("X-Request-Id"));
    }

    @DeleteMapping
    public ApiResponse<CartResponse> clearCart(HttpServletRequest request) {
        UserContext userContext = new UserContext(request);
        return ApiResponse.success(cartService.clearCart(userContext.getUserId()),
                "Cart cleared successfully", request.getHeader("X-Request-Id"));
    }

    @PostMapping("/checkout")
    public ApiResponse<OrderCheckoutResponse> checkout(@Valid @RequestBody CheckoutRequest requestBody, HttpServletRequest request) {
        UserContext userContext = new UserContext(request);
        return ApiResponse.success(cartService.checkout(userContext.getUserId(), userContext.getEmail(), userContext.getUsername(), requestBody, request.getHeader("X-Request-Id")),
                "Checkout completed successfully", request.getHeader("X-Request-Id"));
    }
}
