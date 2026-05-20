package com.amitra.commercemesh.batch.repository;

import com.amitra.commercemesh.batch.domain.BatchJobExecutionRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BatchJobExecutionRecordRepository extends JpaRepository<BatchJobExecutionRecord, Long> {
    List<BatchJobExecutionRecord> findTop20ByOrderByStartedAtDesc();
}
