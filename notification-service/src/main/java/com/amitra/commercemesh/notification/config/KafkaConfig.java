package com.amitra.commercemesh.notification.config;

import java.util.HashMap;
import java.util.Map;

import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.support.serializer.JsonDeserializer;

import com.amitra.commercemesh.notification.event.DeliveryCreatedEvent;
import com.amitra.commercemesh.notification.event.OrderCompletedEvent;

/**
 * Keeps notification-service Kafka deserialization explicit per topic.
 *
 * Earlier, a single OrderCompletedEvent deserializer was reused for every
 * listener. That caused messages from delivery.created to be deserialized as
 * OrderCompletedEvent, after which Spring could not convert that payload into
 * DeliveryCreatedEvent for the delivery listener.
 *
 * To avoid changing existing event contracts or producer logic, we keep the
 * topic names as-is and provide one listener container factory per payload type.
 */
@Configuration
public class KafkaConfig {

    private Map<String, Object> baseConsumerProperties(String bootstrapServers, String groupId) {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ConsumerConfig.GROUP_ID_CONFIG, groupId);
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);
        return props;
    }

    @Bean
    public ConsumerFactory<String, OrderCompletedEvent> orderCompletedConsumerFactory(
            @Value("${spring.kafka.bootstrap-servers}") String bootstrapServers,
            @Value("${spring.kafka.consumer.group-id}") String groupId) {

        JsonDeserializer<OrderCompletedEvent> jsonDeserializer = new JsonDeserializer<>(OrderCompletedEvent.class);
        jsonDeserializer.addTrustedPackages("*");
        jsonDeserializer.setUseTypeHeaders(false);

        return new DefaultKafkaConsumerFactory<>(
                baseConsumerProperties(bootstrapServers, groupId),
                new StringDeserializer(),
                jsonDeserializer);
    }

    @Bean(name = "orderCompletedKafkaListenerContainerFactory")
    public ConcurrentKafkaListenerContainerFactory<String, OrderCompletedEvent> orderCompletedKafkaListenerContainerFactory(
            ConsumerFactory<String, OrderCompletedEvent> orderCompletedConsumerFactory) {

        ConcurrentKafkaListenerContainerFactory<String, OrderCompletedEvent> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(orderCompletedConsumerFactory);
        return factory;
    }

    @Bean
    public ConsumerFactory<String, DeliveryCreatedEvent> deliveryCreatedConsumerFactory(
            @Value("${spring.kafka.bootstrap-servers}") String bootstrapServers,
            @Value("${spring.kafka.consumer.group-id}") String groupId) {

        JsonDeserializer<DeliveryCreatedEvent> jsonDeserializer = new JsonDeserializer<>(DeliveryCreatedEvent.class);
        jsonDeserializer.addTrustedPackages("*");
        jsonDeserializer.setUseTypeHeaders(false);

        return new DefaultKafkaConsumerFactory<>(
                baseConsumerProperties(bootstrapServers, groupId),
                new StringDeserializer(),
                jsonDeserializer);
    }

    @Bean(name = "deliveryCreatedKafkaListenerContainerFactory")
    public ConcurrentKafkaListenerContainerFactory<String, DeliveryCreatedEvent> deliveryCreatedKafkaListenerContainerFactory(
            ConsumerFactory<String, DeliveryCreatedEvent> deliveryCreatedConsumerFactory) {

        ConcurrentKafkaListenerContainerFactory<String, DeliveryCreatedEvent> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(deliveryCreatedConsumerFactory);
        return factory;
    }
}
