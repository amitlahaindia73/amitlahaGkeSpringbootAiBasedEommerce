package com.amitra.commercemesh.payment.domain;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "payment_transaction", uniqueConstraints = {
        @UniqueConstraint(name = "uk_payment_order_id", columnNames = "order_id")
})
public class PaymentTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 64)
    private String orderId;
    @Column(nullable = false, length = 128)
    private String userId;
    @Column(nullable = false, length = 128)
    private String productId;
    @Column(nullable = false)
    private Double amount;
    @Column(nullable = false, length = 32)
    private String status;
    @Column(length = 255)
    private String refundReason;
    @Column(nullable = false)
    private Instant createdAt;
    private Instant updatedAt;

    public Long getId() { return id; }
    public String getOrderId() { return orderId; }
    public String getUserId() { return userId; }
    public String getProductId() { return productId; }
    public Double getAmount() { return amount; }
    public String getStatus() { return status; }
    public String getRefundReason() { return refundReason; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    public void setId(Long id) { this.id = id; }
    public void setOrderId(String orderId) { this.orderId = orderId; }
    public void setUserId(String userId) { this.userId = userId; }
    public void setProductId(String productId) { this.productId = productId; }
    public void setAmount(Double amount) { this.amount = amount; }
    public void setStatus(String status) { this.status = status; }
    public void setRefundReason(String refundReason) { this.refundReason = refundReason; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
