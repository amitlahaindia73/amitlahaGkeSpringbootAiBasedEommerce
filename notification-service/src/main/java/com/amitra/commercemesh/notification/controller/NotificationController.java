package com.amitra.commercemesh.notification.controller;

import com.amitra.commercemesh.notification.api.ApiResponse;
import com.amitra.commercemesh.notification.domain.NotificationRecord;
import com.amitra.commercemesh.notification.repository.NotificationRecordRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationRecordRepository repository;

    public NotificationController(NotificationRecordRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ApiResponse<List<NotificationRecord>> all(@RequestParam(required = false) String userId,
                                                     @RequestParam(required = false) String orderId,
                                                     HttpServletRequest request) {
        List<NotificationRecord> results;
        if (userId != null && !userId.isBlank()) {
            results = repository.findByTargetUserIdOrderByCreatedAtDesc(userId);
        } else if (orderId != null && !orderId.isBlank()) {
            results = repository.findByRelatedOrderIdOrderByCreatedAtDesc(orderId);
        } else {
            results = repository.findAll();
        }
        return ApiResponse.success(results, "Notifications fetched successfully", request.getHeader("X-Request-Id"));
    }
}
