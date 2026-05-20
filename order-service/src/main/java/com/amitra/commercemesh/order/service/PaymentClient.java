package com.amitra.commercemesh.order.service;

import com.amitra.commercemesh.order.dto.PaymentCheckoutRequest;
import com.amitra.commercemesh.order.exception.DownstreamServiceException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class PaymentClient {

    private final String paymentServiceBaseUrl;
    private final RestTemplate restTemplate = new RestTemplate();

    public PaymentClient(@Value("${app.payment-service-base-url}") String paymentServiceBaseUrl) {
        this.paymentServiceBaseUrl = paymentServiceBaseUrl;
    }

    public void checkout(PaymentCheckoutRequest request, String requestId) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Request-Id", requestId);

        ResponseEntity<String> response = restTemplate.exchange(
                paymentServiceBaseUrl + "/api/payments/checkout",
                HttpMethod.POST,
                new HttpEntity<>(request, headers),
                String.class
        );

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new DownstreamServiceException("Payment checkout failed for orderId: " + request.orderId());
        }
    }
}
