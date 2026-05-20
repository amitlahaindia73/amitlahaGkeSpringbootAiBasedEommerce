package com.amitra.commercemesh.order.service;

import com.amitra.commercemesh.order.domain.OrderEntity;
import com.amitra.commercemesh.order.event.DeliveryCreatedEvent;
import com.amitra.commercemesh.order.event.OrderCompletedEvent;
import com.amitra.commercemesh.order.repository.OrderRepository;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(OrderEventConsumer.class);

    private final OrderRepository repository;

    public OrderEventConsumer(OrderRepository repository) {
        this.repository = repository;
    }

    @Transactional
    @KafkaListener(topics = "order.completed", containerFactory = "orderCompletedKafkaListenerContainerFactory")
    public void onOrderCompleted(OrderCompletedEvent event) {
        log.info("Received order.completed event: {}", event);
        repository.findByOrderNumber(event.orderId()).ifPresent(order -> {
            order.setPaymentStatus("SUCCESS");
            if ("PENDING_PAYMENT".equals(order.getOrderStatus()) || "CREATED".equals(order.getOrderStatus())) {
                order.setOrderStatus("CONFIRMED");
            }
            order.touch();
            repository.save(order);
        });
    }

    @Transactional
    @KafkaListener(topics = "delivery.created", containerFactory = "deliveryCreatedKafkaListenerContainerFactory")
    public void onDeliveryCreated(DeliveryCreatedEvent event) {
        log.info("Received delivery.created event: {}", event);
        repository.findByOrderNumber(event.orderId()).ifPresent(order -> {
            order.setDeliveryStatus(event.status());
            if ("CONFIRMED".equals(order.getOrderStatus())) {
                order.setOrderStatus("FULFILLMENT_STARTED");
            }
            order.touch();
            repository.save(order);
        });
    }
}
