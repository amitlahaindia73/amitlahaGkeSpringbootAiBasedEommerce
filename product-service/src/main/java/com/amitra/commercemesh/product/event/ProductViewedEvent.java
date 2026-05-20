package com.amitra.commercemesh.product.event;

import java.time.Instant;

/**
 * Event payload sent to Kafka when a user views a product.
 */
public record ProductViewedEvent(
        String eventId,
        String userId,
        String productId,
        Instant viewedAt
) {
}
