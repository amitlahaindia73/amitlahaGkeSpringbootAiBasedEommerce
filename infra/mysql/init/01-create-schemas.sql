-- ------------------------------------------------------------------
-- This script creates one logical schema per service.
-- In real production you might isolate these per database instance,
-- but for local development one MySQL container is simpler.
-- ------------------------------------------------------------------

CREATE DATABASE IF NOT EXISTS user_db;
CREATE DATABASE IF NOT EXISTS payment_db;
CREATE DATABASE IF NOT EXISTS delivery_db;
CREATE DATABASE IF NOT EXISTS notification_db;
CREATE DATABASE IF NOT EXISTS batch_db;
CREATE DATABASE IF NOT EXISTS order_db;
CREATE DATABASE IF NOT EXISTS cart_db;

-- Create an application user for the services.
CREATE USER IF NOT EXISTS 'appuser'@'%' IDENTIFIED BY 'apppass';

GRANT ALL PRIVILEGES ON user_db.* TO 'appuser'@'%';
GRANT ALL PRIVILEGES ON payment_db.* TO 'appuser'@'%';
GRANT ALL PRIVILEGES ON delivery_db.* TO 'appuser'@'%';
GRANT ALL PRIVILEGES ON notification_db.* TO 'appuser'@'%';
GRANT ALL PRIVILEGES ON batch_db.* TO 'appuser'@'%';
GRANT ALL PRIVILEGES ON order_db.* TO 'appuser'@'%';
GRANT ALL PRIVILEGES ON cart_db.* TO 'appuser'@'%';

FLUSH PRIVILEGES;
