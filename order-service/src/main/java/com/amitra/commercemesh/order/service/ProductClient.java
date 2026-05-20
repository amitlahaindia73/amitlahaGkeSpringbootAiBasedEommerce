package com.amitra.commercemesh.order.service;

import com.amitra.commercemesh.order.dto.ProductApiResponse;
import com.amitra.commercemesh.order.dto.ProductSummary;
import com.amitra.commercemesh.order.exception.DownstreamServiceException;
import com.amitra.commercemesh.order.exception.InvalidOrderException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class ProductClient {

    private final String productServiceBaseUrl;
    private final RestTemplate restTemplate = new RestTemplate();

    public ProductClient(@Value("${app.product-service-base-url}") String productServiceBaseUrl) {
        this.productServiceBaseUrl = productServiceBaseUrl;
    }

    public void reduceInventory(String productId, Integer quantity, String requestId) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Request-Id", requestId);
        headers.setContentType(MediaType.APPLICATION_JSON);

        String requestBody = String.format("{\"quantity\":%d}", quantity);
        ResponseEntity<String> response = restTemplate.exchange(
                productServiceBaseUrl + "/api/products/" + productId + "/inventory/reduce",
                HttpMethod.POST,
                new HttpEntity<>(requestBody, headers),
                String.class
        );

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new DownstreamServiceException("Unable to reduce inventory for productId: " + productId);
        }
    }

    public ProductSummary getProduct(String productId, String requestId) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Request-Id", requestId);
        ResponseEntity<ProductApiResponse> response = restTemplate.exchange(
                productServiceBaseUrl + "/api/products/" + productId,
                HttpMethod.GET,
                new HttpEntity<>(headers),
                ProductApiResponse.class
        );

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null || response.getBody().getData() == null) {
            throw new DownstreamServiceException("Unable to fetch product details for productId: " + productId);
        }

        ProductSummary product = response.getBody().getData();
        if (product.active() != null && !product.active()) {
            throw new InvalidOrderException("Product is inactive: " + productId);
        }
        if (product.availableQuantity() != null && product.availableQuantity() <= 0) {
            throw new InvalidOrderException("Product is out of stock: " + productId);
        }
        return product;
    }
}
