package com.amitra.commercemesh.delivery.repository;

import com.amitra.commercemesh.delivery.domain.DeliveryRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DeliveryRecordRepository extends JpaRepository<DeliveryRecord, Long> {
    Optional<DeliveryRecord> findByOrderId(String orderId);
    List<DeliveryRecord> findByUserIdOrderByCreatedAtDesc(String userId);
}
