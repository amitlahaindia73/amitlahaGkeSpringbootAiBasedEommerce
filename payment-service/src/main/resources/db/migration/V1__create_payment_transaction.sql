CREATE TABLE IF NOT EXISTS payment_transaction (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(128) NOT NULL,
    product_id VARCHAR(128) NOT NULL,
    amount DOUBLE NOT NULL,
    status VARCHAR(32) NOT NULL,
    refund_reason VARCHAR(255) NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NULL,
    CONSTRAINT uk_payment_order_id UNIQUE (order_id)
);
