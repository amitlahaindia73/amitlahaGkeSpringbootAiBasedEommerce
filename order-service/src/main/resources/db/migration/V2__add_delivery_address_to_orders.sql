SET @ddl := IF (
    EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'delivery_recipient_name'),
    'SELECT 1',
    'ALTER TABLE orders ADD COLUMN delivery_recipient_name VARCHAR(120) NULL AFTER notes'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @ddl := IF (
    EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'delivery_phone_number'),
    'SELECT 1',
    'ALTER TABLE orders ADD COLUMN delivery_phone_number VARCHAR(20) NULL AFTER delivery_recipient_name'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @ddl := IF (
    EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'delivery_address_line_1'),
    'SELECT 1',
    'ALTER TABLE orders ADD COLUMN delivery_address_line_1 VARCHAR(200) NULL AFTER delivery_phone_number'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @ddl := IF (
    EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'delivery_address_line_2'),
    'SELECT 1',
    'ALTER TABLE orders ADD COLUMN delivery_address_line_2 VARCHAR(200) NULL AFTER delivery_address_line_1'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @ddl := IF (
    EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'delivery_city'),
    'SELECT 1',
    'ALTER TABLE orders ADD COLUMN delivery_city VARCHAR(120) NULL AFTER delivery_address_line_2'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @ddl := IF (
    EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'delivery_state'),
    'SELECT 1',
    'ALTER TABLE orders ADD COLUMN delivery_state VARCHAR(120) NULL AFTER delivery_city'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @ddl := IF (
    EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'delivery_postal_code'),
    'SELECT 1',
    'ALTER TABLE orders ADD COLUMN delivery_postal_code VARCHAR(40) NULL AFTER delivery_state'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @ddl := IF (
    EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'delivery_country'),
    'SELECT 1',
    'ALTER TABLE orders ADD COLUMN delivery_country VARCHAR(120) NULL AFTER delivery_postal_code'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
