package com.amitra.commercemesh.payment.service;

import com.amitra.commercemesh.payment.domain.PaymentTransaction;
import com.amitra.commercemesh.payment.dto.CheckoutRequest;
import com.amitra.commercemesh.payment.dto.RefundRequest;
import com.amitra.commercemesh.payment.exception.ResourceNotFoundException;
import com.amitra.commercemesh.payment.repository.PaymentTransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class PaymentService {

    private final PaymentTransactionRepository repository;

    public PaymentService(PaymentTransactionRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public PaymentTransaction checkout(CheckoutRequest request) {
        return repository.findByOrderId(request.orderId()).orElseGet(() -> createTransaction(request));
    }

    @Transactional
    public PaymentTransaction refund(RefundRequest request) {
        PaymentTransaction transaction = repository.findByOrderId(request.orderId())
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found for orderId: " + request.orderId()));
        transaction.setStatus("REFUNDED");
        transaction.setRefundReason(request.reason());
        transaction.setUpdatedAt(Instant.now());
        return repository.save(transaction);
    }

    public List<PaymentTransaction> findAll() {
        return repository.findAll();
    }

    public List<PaymentTransaction> findByUserId(String userId) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public PaymentTransaction findByOrderId(String orderId) {
        return repository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found for orderId: " + orderId));
    }

    private PaymentTransaction createTransaction(CheckoutRequest request) {
        PaymentTransaction transaction = new PaymentTransaction();
        transaction.setOrderId(request.orderId());
        transaction.setUserId(request.userId());
        transaction.setProductId(request.productId());
        transaction.setAmount(request.amount());
        transaction.setStatus("SUCCESS");
        transaction.setCreatedAt(Instant.now());
        transaction.setUpdatedAt(Instant.now());

        PaymentTransaction saved = repository.save(transaction);

        return saved;
    }
}
