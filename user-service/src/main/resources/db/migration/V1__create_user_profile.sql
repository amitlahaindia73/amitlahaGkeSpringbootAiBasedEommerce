CREATE TABLE IF NOT EXISTS user_profile (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(80) NOT NULL,
    email VARCHAR(160) NOT NULL,
    full_name VARCHAR(160) NOT NULL,
    CONSTRAINT uk_user_profile_username UNIQUE (username),
    CONSTRAINT uk_user_profile_email UNIQUE (email)
);
