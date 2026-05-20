package com.amitra.commercemesh.order.event;

import java.time.Instant;

public record DeliveryCreatedEvent(
        String eventId,
        String orderId,
        String userId,
        String productId,
        String status,
        Instant createdAt
) {
}
