package com.amitra.commercemesh.delivery.service;

import com.amitra.commercemesh.delivery.domain.DeliveryRecord;
import com.amitra.commercemesh.delivery.event.DeliveryCreatedEvent;
import com.amitra.commercemesh.delivery.event.OrderCompletedEvent;
import com.amitra.commercemesh.delivery.repository.DeliveryRecordRepository;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.util.UUID;

/**
 * Delivery service consumes order-completed events and creates a shipment record.
 */
@Service
public class DeliveryEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(DeliveryEventConsumer.class);

    private final DeliveryRecordRepository repository;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public DeliveryEventConsumer(DeliveryRecordRepository repository, KafkaTemplate<String, Object> kafkaTemplate) {
        this.repository = repository;
        this.kafkaTemplate = kafkaTemplate;
    }

    @KafkaListener(topics = "order.completed", groupId = "delivery-service-group")
    public void onOrderCompleted(OrderCompletedEvent event) {
        log.info("Received order.completed event: {}", event);
        if (repository.findByOrderId(event.orderId()).isPresent()) {
            // This is a simple idempotency guard so the same order is not recreated twice.
            return;
        }

        DeliveryRecord record = new DeliveryRecord();
        record.setOrderId(event.orderId());
        record.setUserId(event.userId());
        record.setProductId(event.productId());
        record.setRecipientName(event.deliveryRecipientName());
        record.setPhoneNumber(event.deliveryPhoneNumber());
        record.setAddressLine1(event.deliveryAddressLine1());
        record.setAddressLine2(event.deliveryAddressLine2());
        record.setCity(event.deliveryCity());
        record.setState(event.deliveryState());
        record.setPostalCode(event.deliveryPostalCode());
        record.setCountry(event.deliveryCountry());
        record.setStatus("CREATED");
        record.setCreatedAt(Instant.now());
        repository.save(record);

        DeliveryCreatedEvent deliveryEvent = new DeliveryCreatedEvent(
                UUID.randomUUID().toString(),
                event.orderId(),
                event.userId(),
                event.productId(),
                "CREATED",
                Instant.now()
        );

        kafkaTemplate.send("delivery.created", event.userId(), deliveryEvent);
    }
}
