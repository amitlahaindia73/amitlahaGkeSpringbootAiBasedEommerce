package com.amitra.commercemesh.order.controller;

import com.amitra.commercemesh.order.api.ApiResponse;
import com.amitra.commercemesh.order.dto.CreateOrderRequest;
import com.amitra.commercemesh.order.dto.OrderResponse;
import com.amitra.commercemesh.order.service.OrderService;
import com.amitra.commercemesh.security.UserContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ApiResponse<OrderResponse> createOrder(@Valid @RequestBody CreateOrderRequest requestBody, HttpServletRequest request) {
        UserContext userContext = new UserContext(request);
        OrderResponse response = orderService.createOrder(
                userContext.getUserId(),
                userContext.getEmail(),
                requestBody,
                request.getHeader("X-Request-Id")
        );
        return ApiResponse.success(response, "Order created successfully", request.getHeader("X-Request-Id"));
    }

    @GetMapping("/{orderNumber}")
    public ApiResponse<OrderResponse> byOrderNumber(@PathVariable String orderNumber, HttpServletRequest request) {
        return ApiResponse.success(orderService.findByOrderNumber(orderNumber), "Order fetched successfully", request.getHeader("X-Request-Id"));
    }

    @GetMapping("/me")
    public ApiResponse<List<OrderResponse>> myOrders(HttpServletRequest request) {
        UserContext userContext = new UserContext(request);
        return ApiResponse.success(orderService.findByCustomerId(userContext.getUserId()), "Orders fetched successfully", request.getHeader("X-Request-Id"));
    }
}
