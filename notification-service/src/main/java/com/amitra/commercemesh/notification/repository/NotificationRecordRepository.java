package com.amitra.commercemesh.notification.repository;

import com.amitra.commercemesh.notification.domain.NotificationRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRecordRepository extends JpaRepository<NotificationRecord, Long> {
    List<NotificationRecord> findByTargetUserIdOrderByCreatedAtDesc(String targetUserId);
    List<NotificationRecord> findByRelatedOrderIdOrderByCreatedAtDesc(String relatedOrderId);
}
