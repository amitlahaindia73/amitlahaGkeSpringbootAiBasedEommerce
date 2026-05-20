package com.amitra.commercemesh.batch.dto;

import com.amitra.commercemesh.batch.domain.BatchJobExecutionRecord;
import java.util.List;

public record BatchDashboardResponse(long totalImportedFiles, long totalProductsInCatalog, BatchJobExecutionRecord latestJob, List<BatchJobExecutionRecord> recentJobs) {
}
