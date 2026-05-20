package com.amitra.commercemesh.order.controller;

import com.amitra.commercemesh.order.api.ApiResponse;
import com.amitra.commercemesh.order.dto.OrderResponse;
import com.amitra.commercemesh.order.dto.UpdateOrderStatusRequest;
import com.amitra.commercemesh.order.service.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/orders")
public class AdminOrderController {

    private final OrderService orderService;

    public AdminOrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    public ApiResponse<List<OrderResponse>> all(HttpServletRequest request) {
        return ApiResponse.success(orderService.findAll(), "Orders fetched successfully", request.getHeader("X-Request-Id"));
    }

    @GetMapping("/{orderNumber}")
    public ApiResponse<OrderResponse> byOrderNumber(@PathVariable String orderNumber, HttpServletRequest request) {
        return ApiResponse.success(orderService.findByOrderNumber(orderNumber), "Order fetched successfully", request.getHeader("X-Request-Id"));
    }

    @PatchMapping("/{orderNumber}/status")
    public ApiResponse<OrderResponse> updateStatus(@PathVariable String orderNumber,
                                                   @Valid @RequestBody UpdateOrderStatusRequest requestBody,
                                                   HttpServletRequest request) {
        return ApiResponse.success(orderService.updateStatus(orderNumber, requestBody),
                "Order status updated successfully", request.getHeader("X-Request-Id"));
    }
}
