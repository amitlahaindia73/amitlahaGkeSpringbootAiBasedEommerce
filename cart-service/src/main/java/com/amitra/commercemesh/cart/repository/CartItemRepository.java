package com.amitra.commercemesh.cart.repository;

import com.amitra.commercemesh.cart.domain.CartItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItemEntity, Long> {
    List<CartItemEntity> findByCustomerIdOrderByUpdatedAtDesc(String customerId);
    Optional<CartItemEntity> findByCustomerIdAndProductId(String customerId, String productId);
    void deleteByCustomerIdAndProductId(String customerId, String productId);
    void deleteByCustomerId(String customerId);
}
