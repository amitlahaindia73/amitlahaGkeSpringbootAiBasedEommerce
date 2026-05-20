package com.amitra.commercemesh.batch.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {
    @Bean
    public OpenAPI serviceOpenApi() {
        return new OpenAPI().info(new Info().title("Product Batch Service API").version("1.0.0").description("Batch import and admin reporting APIs."));
    }
}
