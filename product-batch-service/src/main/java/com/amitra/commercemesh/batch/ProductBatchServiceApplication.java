package com.amitra.commercemesh.batch;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ProductBatchServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(ProductBatchServiceApplication.class, args);
    }
}
