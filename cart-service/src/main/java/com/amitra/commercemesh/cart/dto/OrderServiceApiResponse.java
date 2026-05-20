package com.amitra.commercemesh.cart.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class OrderServiceApiResponse {
    private boolean success;
    private OrderCheckoutResponse data;
    private String message;
    private String requestId;

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    public OrderCheckoutResponse getData() { return data; }
    public void setData(OrderCheckoutResponse data) { this.data = data; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getRequestId() { return requestId; }
    public void setRequestId(String requestId) { this.requestId = requestId; }
}
