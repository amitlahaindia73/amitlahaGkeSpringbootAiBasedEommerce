package com.amitra.commercemesh.product.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {
    @Bean
    public OpenAPI serviceOpenApi() {
        return new OpenAPI().info(new Info().title("Product Service API").version("1.0.0").description("Catalog management, search, and product-view tracking APIs."));
    }
}
