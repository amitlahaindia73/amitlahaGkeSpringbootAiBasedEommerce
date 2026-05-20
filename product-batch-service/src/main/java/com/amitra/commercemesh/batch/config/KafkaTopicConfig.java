package com.amitra.commercemesh.batch.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class KafkaTopicConfig {
    @Bean
    public NewTopic productImportCompletedTopic() {
        return new NewTopic("product.import.completed", 1, (short) 1);
    }
}
