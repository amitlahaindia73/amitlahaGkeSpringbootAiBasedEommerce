package com.amitra.commercemesh.order.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class ProductApiResponse {
    private boolean success;
    private ProductSummary data;
    private String message;
    private String requestId;

    public boolean isSuccess() { return success; }
    public ProductSummary getData() { return data; }
    public String getMessage() { return message; }
    public String getRequestId() { return requestId; }

    public void setSuccess(boolean success) { this.success = success; }
    public void setData(ProductSummary data) { this.data = data; }
    public void setMessage(String message) { this.message = message; }
    public void setRequestId(String requestId) { this.requestId = requestId; }
}
