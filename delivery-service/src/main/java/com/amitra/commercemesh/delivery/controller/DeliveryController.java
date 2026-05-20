package com.amitra.commercemesh.delivery.controller;

import com.amitra.commercemesh.delivery.api.ApiResponse;
import com.amitra.commercemesh.delivery.domain.DeliveryRecord;
import com.amitra.commercemesh.delivery.exception.ResourceNotFoundException;
import com.amitra.commercemesh.delivery.repository.DeliveryRecordRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/deliveries")
public class DeliveryController {

    private final DeliveryRecordRepository repository;

    public DeliveryController(DeliveryRecordRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ApiResponse<List<DeliveryRecord>> all(@RequestParam(required = false) String userId, HttpServletRequest request) {
        List<DeliveryRecord> results = (userId == null || userId.isBlank())
                ? repository.findAll()
                : repository.findByUserIdOrderByCreatedAtDesc(userId);
        return ApiResponse.success(results, "Deliveries fetched successfully", request.getHeader("X-Request-Id"));
    }

    @GetMapping("/order/{orderId}")
    public ApiResponse<DeliveryRecord> byOrderId(@PathVariable String orderId, HttpServletRequest request) {
        DeliveryRecord record = repository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery not found for orderId: " + orderId));
        return ApiResponse.success(record, "Delivery fetched successfully", request.getHeader("X-Request-Id"));
    }
}
