package com.amitra.commercemesh.cart.service;

import com.amitra.commercemesh.cart.dto.ProductApiResponse;
import com.amitra.commercemesh.cart.dto.ProductSummary;
import com.amitra.commercemesh.cart.exception.DownstreamServiceException;
import com.amitra.commercemesh.cart.exception.InvalidCartException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class ProductClient {

    private final String productServiceBaseUrl;
    private final RestTemplate restTemplate = new RestTemplate();

    public ProductClient(@Value("${app.product-service-base-url}") String productServiceBaseUrl) {
        this.productServiceBaseUrl = productServiceBaseUrl;
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
            throw new InvalidCartException("Product is inactive: " + productId);
        }
        if (product.availableQuantity() != null && product.availableQuantity() <= 0) {
            throw new InvalidCartException("Product is out of stock: " + productId);
        }
        return product;
    }
}
