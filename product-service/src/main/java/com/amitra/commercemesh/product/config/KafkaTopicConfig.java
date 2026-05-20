package com.amitra.commercemesh.product.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Product topics include main, retry, and dead-letter variants.
 * This mirrors an enterprise event mesh pattern in a small local setup.
 */
@Configuration
public class KafkaTopicConfig {

    @Bean
    public NewTopic productViewedTopic() {
        return new NewTopic("product.viewed", 1, (short) 1);
    }

    @Bean
    public NewTopic productViewedRetryTopic() {
        return new NewTopic("product.viewed.retry", 1, (short) 1);
    }

    @Bean
    public NewTopic productViewedDltTopic() {
        return new NewTopic("product.viewed.dlt", 1, (short) 1);
    }
}
