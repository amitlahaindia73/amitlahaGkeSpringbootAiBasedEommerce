package com.amitra.commercemesh.notification.service;

import java.time.Instant;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.amitra.commercemesh.notification.domain.NotificationRecord;
import com.amitra.commercemesh.notification.event.DeliveryCreatedEvent;
import com.amitra.commercemesh.notification.event.OrderCompletedEvent;
import com.amitra.commercemesh.notification.repository.NotificationRecordRepository;

/**
 * Notification service turns domain events into persisted notification records.
 * For local simplicity we store records instead of sending real emails or SMS.
 */
@Service
public class NotificationEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(NotificationEventConsumer.class);

    private final NotificationRecordRepository repository;

    public NotificationEventConsumer(NotificationRecordRepository repository) {
        this.repository = repository;
    }

    @KafkaListener(
            topics = "order.completed",
            groupId = "${spring.kafka.consumer.group-id}",
            containerFactory = "orderCompletedKafkaListenerContainerFactory")
    public void onOrderCompleted(OrderCompletedEvent event) {
        log.info("Received order.completed event: {}", event);
        NotificationRecord record = new NotificationRecord();
        record.setChannelType("EMAIL");
        record.setTargetUserId(event.userId());
        record.setRelatedOrderId(event.orderId());
        record.setMessageBody("Order " + event.orderId() + " completed successfully for user " + event.userId());
        record.setCreatedAt(Instant.now());
        repository.save(record);
    }

    @KafkaListener(
            topics = "delivery.created",
            groupId = "${spring.kafka.consumer.group-id}",
            containerFactory = "deliveryCreatedKafkaListenerContainerFactory")
    public void onDeliveryCreated(DeliveryCreatedEvent event) {
        log.info("Received delivery.created event: {}", event);
        NotificationRecord record = new NotificationRecord();
        record.setChannelType("SMS");
        record.setTargetUserId(event.userId());
        record.setRelatedOrderId(event.orderId());
        record.setMessageBody("Delivery created for order " + event.orderId() + " with status " + event.status());
        record.setCreatedAt(Instant.now());
        repository.save(record);
    }
}
