package com.amitra.commercemesh.gateway.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI apiGatewayOpenApi() {
        return new OpenAPI().info(new Info()
                .title("Amitra Commerce Mesh API Gateway")
                .version("1.0.0")
                .description("Entry point for secured ecommerce APIs routed through Spring Cloud Gateway."));
    }
}
