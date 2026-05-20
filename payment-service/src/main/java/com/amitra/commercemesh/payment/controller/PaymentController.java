package com.amitra.commercemesh.payment.controller;

import com.amitra.commercemesh.payment.api.ApiResponse;
import com.amitra.commercemesh.payment.domain.PaymentTransaction;
import com.amitra.commercemesh.payment.dto.CheckoutRequest;
import com.amitra.commercemesh.payment.dto.RefundRequest;
import com.amitra.commercemesh.payment.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/checkout")
    public ApiResponse<PaymentTransaction> checkout(@Valid @RequestBody CheckoutRequest request, HttpServletRequest servletRequest) {
        return ApiResponse.success(paymentService.checkout(request), "Checkout completed", servletRequest.getHeader("X-Request-Id"));
    }

    @PostMapping("/refund")
    public ApiResponse<PaymentTransaction> refund(@Valid @RequestBody RefundRequest request, HttpServletRequest servletRequest) {
        return ApiResponse.success(paymentService.refund(request), "Refund processed", servletRequest.getHeader("X-Request-Id"));
    }

    @GetMapping
    public ApiResponse<List<PaymentTransaction>> all(@RequestParam(required = false) String userId, HttpServletRequest servletRequest) {
        List<PaymentTransaction> transactions = userId == null || userId.isBlank()
                ? paymentService.findAll()
                : paymentService.findByUserId(userId);
        return ApiResponse.success(transactions, "Payments fetched successfully", servletRequest.getHeader("X-Request-Id"));
    }

    @GetMapping("/order/{orderId}")
    public ApiResponse<PaymentTransaction> byOrderId(@PathVariable String orderId, HttpServletRequest servletRequest) {
        return ApiResponse.success(paymentService.findByOrderId(orderId), "Payment fetched successfully", servletRequest.getHeader("X-Request-Id"));
    }
}
