package com.amitra.commercemesh.order.api;

import java.time.Instant;

public record ApiResponse<T>(boolean success, T data, String message, String requestId, Instant timestamp) {
    public static <T> ApiResponse<T> success(T data, String message, String requestId) {
        return new ApiResponse<>(true, data, message, requestId, Instant.now());
    }
}
