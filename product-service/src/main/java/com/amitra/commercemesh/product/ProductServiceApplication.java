package com.amitra.commercemesh.product;

import com.amitra.commercemesh.product.domain.Product;
import com.amitra.commercemesh.product.repository.ProductRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

/**
 * Product service stores catalog data in MongoDB and publishes view events.
 */
@SpringBootApplication
public class ProductServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(ProductServiceApplication.class, args);
    }

    @Bean
    CommandLineRunner seedProducts(ProductRepository repository) {
        return args -> {
            if (repository.count() == 0) {
                Product p1 = new Product();
                p1.setId("p1");
                p1.setName("Laptop Pro 14");
                p1.setCategory("Electronics");
                p1.setDescription("High performance laptop");
                p1.setPrice(1999.99);

                Product p2 = new Product();
                p2.setId("p2");
                p2.setName("Mechanical Keyboard");
                p2.setCategory("Electronics");
                p2.setDescription("Tactile keyboard");
                p2.setPrice(149.99);

                Product p3 = new Product();
                p3.setId("p3");
                p3.setName("Running Shoes");
                p3.setCategory("Sports");
                p3.setDescription("Lightweight shoes");
                p3.setPrice(119.99);

                repository.save(p1);
                repository.save(p2);
                repository.save(p3);
            }
        };
    }
}