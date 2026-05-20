package com.amitra.commercemesh.cart.service;

import com.amitra.commercemesh.cart.dto.OrderCheckoutRequest;
import com.amitra.commercemesh.cart.dto.OrderCheckoutResponse;
import com.amitra.commercemesh.cart.dto.OrderServiceApiResponse;
import com.amitra.commercemesh.cart.exception.DownstreamServiceException;
import com.amitra.commercemesh.security.AuthHeaders;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class OrderClient {

    private final String orderServiceBaseUrl;
    private final RestTemplate restTemplate = new RestTemplate();

    public OrderClient(@Value("${app.order-service-base-url}") String orderServiceBaseUrl) {
        this.orderServiceBaseUrl = orderServiceBaseUrl;
    }

    public OrderCheckoutResponse createOrder(String customerId, String email, String username, OrderCheckoutRequest request, String requestId) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Request-Id", requestId);
        headers.set(AuthHeaders.USER_ID, customerId);
        headers.set(AuthHeaders.EMAIL, email == null ? "" : email);
        headers.set(AuthHeaders.USERNAME, username == null ? "" : username);
        headers.set(AuthHeaders.ROLES, "ROLE_CUSTOMER");

        ResponseEntity<OrderServiceApiResponse> response = restTemplate.exchange(
                orderServiceBaseUrl + "/api/orders",
                HttpMethod.POST,
                new HttpEntity<>(request, headers),
                OrderServiceApiResponse.class
        );

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null || response.getBody().getData() == null) {
            throw new DownstreamServiceException("Unable to create order from cart checkout");
        }
        return response.getBody().getData();
    }
}
