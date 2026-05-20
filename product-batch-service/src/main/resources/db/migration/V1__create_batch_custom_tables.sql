CREATE TABLE IF NOT EXISTS batch_job_execution (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    job_name VARCHAR(100) NOT NULL,
    status VARCHAR(100) NOT NULL,
    source_file VARCHAR(500) NOT NULL,
    started_at TIMESTAMP(6) NULL,
    completed_at TIMESTAMP(6) NULL,
    processed_count INT NULL,
    success_count INT NULL,
    skipped_count INT NULL,
    error_count INT NULL,
    details VARCHAR(4000) NULL,
    report_file VARCHAR(500) NULL
);

CREATE TABLE IF NOT EXISTS imported_files (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    file_name VARCHAR(500) NOT NULL,
    processed_at TIMESTAMP(6) NULL,
    CONSTRAINT uk_imported_files_file_name UNIQUE (file_name)
);
