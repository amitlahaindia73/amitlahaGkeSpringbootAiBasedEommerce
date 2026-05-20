package com.amitra.commercemesh.product.api;

import java.time.Instant;
import java.util.List;

public record ApiErrorResponse(boolean success, String message, List<String> details, String requestId, Instant timestamp) {
    public static ApiErrorResponse of(String message, List<String> details, String requestId) {
        return new ApiErrorResponse(false, message, details, requestId, Instant.now());
    }
}
