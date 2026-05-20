package com.amitra.commercemesh.order.domain;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
public class OrderEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_number", nullable = false, length = 64, unique = true)
    private String orderNumber;

    @Column(name = "customer_id", nullable = false, length = 128)
    private String customerId;

    @Column(name = "customer_email", length = 255)
    private String customerEmail;

    @Column(nullable = false, length = 16)
    private String currency;

    @Column(name = "subtotal_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotalAmount;

    @Column(name = "tax_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal taxAmount;

    @Column(name = "shipping_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal shippingAmount;

    @Column(name = "discount_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal discountAmount;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "order_status", nullable = false, length = 32)
    private String orderStatus;

    @Column(name = "payment_status", nullable = false, length = 32)
    private String paymentStatus;

    @Column(name = "delivery_status", nullable = false, length = 32)
    private String deliveryStatus;

    @Column(length = 500)
    private String notes;

    @Column(name = "delivery_recipient_name", nullable = false, length = 120)
    private String deliveryRecipientName;

    @Column(name = "delivery_phone_number", nullable = false, length = 20)
    private String deliveryPhoneNumber;

    @Column(name = "delivery_address_line_1", nullable = false, length = 200)
    private String deliveryAddressLine1;

    @Column(name = "delivery_address_line_2", length = 200)
    private String deliveryAddressLine2;

    @Column(name = "delivery_city", nullable = false, length = 120)
    private String deliveryCity;

    @Column(name = "delivery_state", nullable = false, length = 120)
    private String deliveryState;

    @Column(name = "delivery_postal_code", nullable = false, length = 40)
    private String deliveryPostalCode;

    @Column(name = "delivery_country", nullable = false, length = 120)
    private String deliveryCountry;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItemEntity> items = new ArrayList<>();

    public void addItem(OrderItemEntity item) {
        item.setOrder(this);
        this.items.add(item);
    }

    public void touch() {
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getOrderNumber() { return orderNumber; }
    public String getCustomerId() { return customerId; }
    public String getCustomerEmail() { return customerEmail; }
    public String getCurrency() { return currency; }
    public BigDecimal getSubtotalAmount() { return subtotalAmount; }
    public BigDecimal getTaxAmount() { return taxAmount; }
    public BigDecimal getShippingAmount() { return shippingAmount; }
    public BigDecimal getDiscountAmount() { return discountAmount; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public String getOrderStatus() { return orderStatus; }
    public String getPaymentStatus() { return paymentStatus; }
    public String getDeliveryStatus() { return deliveryStatus; }
    public String getNotes() { return notes; }
    public String getDeliveryRecipientName() { return deliveryRecipientName; }
    public String getDeliveryPhoneNumber() { return deliveryPhoneNumber; }
    public String getDeliveryAddressLine1() { return deliveryAddressLine1; }
    public String getDeliveryAddressLine2() { return deliveryAddressLine2; }
    public String getDeliveryCity() { return deliveryCity; }
    public String getDeliveryState() { return deliveryState; }
    public String getDeliveryPostalCode() { return deliveryPostalCode; }
    public String getDeliveryCountry() { return deliveryCountry; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public List<OrderItemEntity> getItems() { return items; }

    public void setId(Long id) { this.id = id; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }
    public void setCurrency(String currency) { this.currency = currency; }
    public void setSubtotalAmount(BigDecimal subtotalAmount) { this.subtotalAmount = subtotalAmount; }
    public void setTaxAmount(BigDecimal taxAmount) { this.taxAmount = taxAmount; }
    public void setShippingAmount(BigDecimal shippingAmount) { this.shippingAmount = shippingAmount; }
    public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    public void setOrderStatus(String orderStatus) { this.orderStatus = orderStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }
    public void setDeliveryStatus(String deliveryStatus) { this.deliveryStatus = deliveryStatus; }
    public void setNotes(String notes) { this.notes = notes; }
    public void setDeliveryRecipientName(String deliveryRecipientName) { this.deliveryRecipientName = deliveryRecipientName; }
    public void setDeliveryPhoneNumber(String deliveryPhoneNumber) { this.deliveryPhoneNumber = deliveryPhoneNumber; }
    public void setDeliveryAddressLine1(String deliveryAddressLine1) { this.deliveryAddressLine1 = deliveryAddressLine1; }
    public void setDeliveryAddressLine2(String deliveryAddressLine2) { this.deliveryAddressLine2 = deliveryAddressLine2; }
    public void setDeliveryCity(String deliveryCity) { this.deliveryCity = deliveryCity; }
    public void setDeliveryState(String deliveryState) { this.deliveryState = deliveryState; }
    public void setDeliveryPostalCode(String deliveryPostalCode) { this.deliveryPostalCode = deliveryPostalCode; }
    public void setDeliveryCountry(String deliveryCountry) { this.deliveryCountry = deliveryCountry; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public void setItems(List<OrderItemEntity> items) { this.items = items; }
}
