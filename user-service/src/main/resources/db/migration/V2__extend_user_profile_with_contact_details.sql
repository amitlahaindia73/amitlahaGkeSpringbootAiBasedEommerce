SET @schema_name = DATABASE();

SET @sql = IF(
    EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = @schema_name
          AND table_name = 'user_profile'
          AND column_name = 'external_auth_id'
    ),
    'SELECT 1',
    'ALTER TABLE user_profile ADD COLUMN external_auth_id VARCHAR(120) NULL'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
    EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = @schema_name
          AND table_name = 'user_profile'
          AND column_name = 'phone_number'
    ),
    'SELECT 1',
    'ALTER TABLE user_profile ADD COLUMN phone_number VARCHAR(40) NULL'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
    EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = @schema_name
          AND table_name = 'user_profile'
          AND column_name = 'address_line_1'
    ),
    'SELECT 1',
    'ALTER TABLE user_profile ADD COLUMN address_line_1 VARCHAR(200) NULL'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
    EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = @schema_name
          AND table_name = 'user_profile'
          AND column_name = 'address_line_2'
    ),
    'SELECT 1',
    'ALTER TABLE user_profile ADD COLUMN address_line_2 VARCHAR(200) NULL'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
    EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = @schema_name
          AND table_name = 'user_profile'
          AND column_name = 'city'
    ),
    'SELECT 1',
    'ALTER TABLE user_profile ADD COLUMN city VARCHAR(120) NULL'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
    EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = @schema_name
          AND table_name = 'user_profile'
          AND column_name = 'state'
    ),
    'SELECT 1',
    'ALTER TABLE user_profile ADD COLUMN state VARCHAR(120) NULL'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
    EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = @schema_name
          AND table_name = 'user_profile'
          AND column_name = 'postal_code'
    ),
    'SELECT 1',
    'ALTER TABLE user_profile ADD COLUMN postal_code VARCHAR(40) NULL'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
    EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = @schema_name
          AND table_name = 'user_profile'
          AND column_name = 'country'
    ),
    'SELECT 1',
    'ALTER TABLE user_profile ADD COLUMN country VARCHAR(120) NULL'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
    EXISTS(
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = @schema_name
          AND table_name = 'user_profile'
          AND index_name = 'uk_user_profile_external_auth_id'
    ),
    'SELECT 1',
    'ALTER TABLE user_profile ADD CONSTRAINT uk_user_profile_external_auth_id UNIQUE (external_auth_id)'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
