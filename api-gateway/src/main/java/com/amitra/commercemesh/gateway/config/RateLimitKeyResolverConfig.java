package com.amitra.commercemesh.gateway.config;

import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Rate limits are keyed by authenticated principal when available.
 * If the request is anonymous, we fall back to a simple "anonymous" key.
 */
@Configuration
public class RateLimitKeyResolverConfig {

    @Bean
    public KeyResolver principalNameKeyResolver() {
        return exchange -> exchange.getPrincipal()
                .map(principal -> principal.getName())
                .defaultIfEmpty("anonymous");
    }
}
