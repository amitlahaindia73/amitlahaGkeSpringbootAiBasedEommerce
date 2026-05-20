package com.amitra.commercemesh.order.event;

import java.time.Instant;

public record OrderCreatedEvent(
        String eventId,
        String orderId,
        String userId,
        Double amount,
        Instant createdAt
) {
}
