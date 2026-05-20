CREATE TABLE IF NOT EXISTS notification_record (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    channel_type VARCHAR(32) NOT NULL,
    target_user_id VARCHAR(128) NOT NULL,
    related_order_id VARCHAR(64) NOT NULL,
    message_body VARCHAR(2000) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL
);
