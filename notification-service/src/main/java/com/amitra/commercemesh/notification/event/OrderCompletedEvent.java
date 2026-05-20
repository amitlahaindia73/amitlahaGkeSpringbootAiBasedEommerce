package com.amitra.commercemesh.notification.event;

import java.time.Instant;

public record OrderCompletedEvent(
        String eventId,
        String orderId,
        String userId,
        String productId,
        Double amount,
        String deliveryRecipientName,
        String deliveryPhoneNumber,
        String deliveryAddressLine1,
        String deliveryAddressLine2,
        String deliveryCity,
        String deliveryState,
        String deliveryPostalCode,
        String deliveryCountry,
        Instant completedAt
) {
}
