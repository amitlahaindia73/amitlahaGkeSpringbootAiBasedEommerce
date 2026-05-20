package com.amitra.commercemesh.notification.domain;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "notification_record")
public class NotificationRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 32)
    private String channelType;
    @Column(nullable = false, length = 128)
    private String targetUserId;
    @Column(nullable = false, length = 64)
    private String relatedOrderId;
    @Column(length = 2000, nullable = false)
    private String messageBody;
    @Column(nullable = false)
    private Instant createdAt;

    public Long getId() { return id; }
    public String getChannelType() { return channelType; }
    public String getTargetUserId() { return targetUserId; }
    public String getRelatedOrderId() { return relatedOrderId; }
    public String getMessageBody() { return messageBody; }
    public Instant getCreatedAt() { return createdAt; }

    public void setId(Long id) { this.id = id; }
    public void setChannelType(String channelType) { this.channelType = channelType; }
    public void setTargetUserId(String targetUserId) { this.targetUserId = targetUserId; }
    public void setRelatedOrderId(String relatedOrderId) { this.relatedOrderId = relatedOrderId; }
    public void setMessageBody(String messageBody) { this.messageBody = messageBody; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
