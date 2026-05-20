package com.amitra.commercemesh.gateway.config;

import org.springframework.cloud.gateway.filter.ratelimit.RedisRateLimiter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * This bean is referenced by route configuration.
 * The numbers are intentionally small so rate limiting is easy to observe locally.
 */
@Configuration
public class RedisRateLimiterConfig {

    @Bean
    public RedisRateLimiter defaultRedisRateLimiter() {
        // replenishRate = requests per second
        // burstCapacity = short burst allowance
        return new RedisRateLimiter(10, 20);
    }
}
