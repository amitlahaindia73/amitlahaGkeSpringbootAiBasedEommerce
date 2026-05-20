package com.amitra.commercemesh.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * API Gateway is the single protected backend entry point.
 * Responsibilities:
 * - validate JWT from Keycloak
 * - apply Redis-backed rate limiting
 * - route requests by service id
 * - expose fallback endpoints
 */
@SpringBootApplication
public class ApiGatewayApplication {
    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }
}
