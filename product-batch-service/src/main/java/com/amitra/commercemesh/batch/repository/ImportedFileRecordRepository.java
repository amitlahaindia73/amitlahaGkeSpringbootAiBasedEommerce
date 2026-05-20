package com.amitra.commercemesh.batch.repository;

import com.amitra.commercemesh.batch.domain.ImportedFileRecord;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ImportedFileRecordRepository extends JpaRepository<ImportedFileRecord, Long> {
    boolean existsByFileName(String fileName);
}
