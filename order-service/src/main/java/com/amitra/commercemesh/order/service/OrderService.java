package com.amitra.commercemesh.order.service;

import com.amitra.commercemesh.order.domain.OrderEntity;
import com.amitra.commercemesh.order.domain.OrderItemEntity;
import com.amitra.commercemesh.order.dto.CreateOrderRequest;
import com.amitra.commercemesh.order.dto.OrderItemRequest;
import com.amitra.commercemesh.order.dto.OrderResponse;
import com.amitra.commercemesh.order.dto.PaymentCheckoutRequest;
import com.amitra.commercemesh.order.dto.ProductSummary;
import com.amitra.commercemesh.order.dto.UpdateOrderStatusRequest;
import com.amitra.commercemesh.order.event.OrderCompletedEvent;
import com.amitra.commercemesh.order.exception.InvalidOrderException;
import com.amitra.commercemesh.order.exception.ResourceNotFoundException;
import com.amitra.commercemesh.order.repository.OrderRepository;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class OrderService {

    private final OrderRepository repository;
    private final OrderMapper mapper;
    private final OrderNumberGenerator orderNumberGenerator;
    private final ProductClient productClient;
    private final PaymentClient paymentClient;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public OrderService(OrderRepository repository,
                        OrderMapper mapper,
                        OrderNumberGenerator orderNumberGenerator,
                        ProductClient productClient,
                        PaymentClient paymentClient,
                        KafkaTemplate<String, Object> kafkaTemplate) {
        this.repository = repository;
        this.mapper = mapper;
        this.orderNumberGenerator = orderNumberGenerator;
        this.productClient = productClient;
        this.paymentClient = paymentClient;
        this.kafkaTemplate = kafkaTemplate;
    }

    @Transactional
    public OrderResponse createOrder(String customerId, String customerEmail, CreateOrderRequest request, String requestId) {
        if (request.items() == null || request.items().isEmpty()) {
            throw new InvalidOrderException("At least one order item is required");
        }

        OrderEntity entity = new OrderEntity();
        entity.setOrderNumber(orderNumberGenerator.nextOrderNumber());
        entity.setCustomerId(customerId);
        entity.setCustomerEmail(customerEmail);
        entity.setCurrency(request.currency());
        entity.setTaxAmount(defaultMoney(request.taxAmount()));
        entity.setShippingAmount(defaultMoney(request.shippingAmount()));
        entity.setDiscountAmount(defaultMoney(request.discountAmount()));
        entity.setPaymentStatus("PENDING");
        entity.setDeliveryStatus("NOT_CREATED");
        entity.setOrderStatus("PENDING_PAYMENT");
        entity.setNotes(request.notes());
        entity.setDeliveryRecipientName(request.deliveryAddress().recipientName().trim());
        entity.setDeliveryPhoneNumber(request.deliveryAddress().phoneNumber().trim());
        entity.setDeliveryAddressLine1(request.deliveryAddress().addressLine1().trim());
        entity.setDeliveryAddressLine2(request.deliveryAddress().addressLine2() == null ? null : request.deliveryAddress().addressLine2().trim());
        entity.setDeliveryCity(request.deliveryAddress().city().trim());
        entity.setDeliveryState(request.deliveryAddress().state().trim());
        entity.setDeliveryPostalCode(request.deliveryAddress().postalCode().trim());
        entity.setDeliveryCountry(request.deliveryAddress().country().trim());

        BigDecimal subtotal = BigDecimal.ZERO;
        Instant now = Instant.now();

        for (OrderItemRequest itemRequest : request.items()) {
            ProductSummary product = productClient.getProduct(itemRequest.productId(), requestId);
            Integer availableQuantity = product.availableQuantity() == null ? Integer.MAX_VALUE : product.availableQuantity();
            if (itemRequest.quantity() > availableQuantity) {
                throw new InvalidOrderException("Requested quantity exceeds available stock for product: " + product.id());
            }

            BigDecimal unitPrice = defaultMoney(product.price());
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(itemRequest.quantity())).setScale(2, RoundingMode.HALF_UP);
            subtotal = subtotal.add(lineTotal);

            OrderItemEntity item = new OrderItemEntity();
            item.setProductId(product.id());
            item.setProductName(product.name());
            item.setSku(product.sku());
            item.setImageUrl(product.imageUrl());
            item.setQuantity(itemRequest.quantity());
            item.setUnitPrice(unitPrice);
            item.setLineTotal(lineTotal);
            item.setCreatedAt(now);
            entity.addItem(item);
        }

        entity.setSubtotalAmount(subtotal.setScale(2, RoundingMode.HALF_UP));
        entity.setTotalAmount(subtotal
                .add(entity.getTaxAmount())
                .add(entity.getShippingAmount())
                .subtract(entity.getDiscountAmount())
                .setScale(2, RoundingMode.HALF_UP));
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);

        OrderEntity saved = repository.save(entity);

        OrderItemEntity firstItem = saved.getItems().get(0);
        paymentClient.checkout(new PaymentCheckoutRequest(
                saved.getOrderNumber(),
                customerId,
                firstItem.getProductId(),
                saved.getTotalAmount().doubleValue()
        ), requestId);

        for (OrderItemEntity orderItem : saved.getItems()) {
            productClient.reduceInventory(orderItem.getProductId(), orderItem.getQuantity(), requestId);
        }

        saved.setPaymentStatus("SUCCESS");
        saved.setOrderStatus("CONFIRMED");
        saved.touch();
        saved = repository.save(saved);

        kafkaTemplate.send("order.completed", customerId, new OrderCompletedEvent(
                UUID.randomUUID().toString(),
                saved.getOrderNumber(),
                customerId,
                firstItem.getProductId(),
                saved.getTotalAmount().doubleValue(),
                saved.getDeliveryRecipientName(),
                saved.getDeliveryPhoneNumber(),
                saved.getDeliveryAddressLine1(),
                saved.getDeliveryAddressLine2(),
                saved.getDeliveryCity(),
                saved.getDeliveryState(),
                saved.getDeliveryPostalCode(),
                saved.getDeliveryCountry(),
                Instant.now()
        ));

        return mapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public OrderResponse findByOrderNumber(String orderNumber) {
        return mapper.toResponse(repository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderNumber)));
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> findByCustomerId(String customerId) {
        return repository.findByCustomerIdOrderByCreatedAtDesc(customerId).stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> findAll() {
        return repository.findAllByOrderByCreatedAtDesc().stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Transactional
    public OrderResponse updateStatus(String orderNumber, UpdateOrderStatusRequest request) {
        OrderEntity order = repository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderNumber));
        order.setOrderStatus(request.orderStatus().trim().toUpperCase());
        order.touch();
        return mapper.toResponse(repository.save(order));
    }

    private BigDecimal defaultMoney(BigDecimal value) {
        return value == null ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP)
                : value.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal defaultMoney(Number value) {
        return value == null ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.valueOf(value.doubleValue()).setScale(2, RoundingMode.HALF_UP);
    }
}
