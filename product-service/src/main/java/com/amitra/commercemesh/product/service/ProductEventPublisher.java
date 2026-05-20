package com.amitra.commercemesh.product.service;

import com.amitra.commercemesh.product.event.ProductViewedEvent;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

/**
 * Encapsulates Kafka publishing so controller code stays simple.
 */
@Service
public class ProductEventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public ProductEventPublisher(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publishViewed(String userId, String productId) {
        ProductViewedEvent event = new ProductViewedEvent(UUID.randomUUID().toString(), userId, productId, Instant.now());
        kafkaTemplate.send("product.viewed", userId, event);
    }
}
