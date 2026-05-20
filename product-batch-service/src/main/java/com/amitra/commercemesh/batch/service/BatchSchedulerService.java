package com.amitra.commercemesh.batch.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class BatchSchedulerService {
    private static final Logger log = LoggerFactory.getLogger(BatchSchedulerService.class);
    private final BatchImportService batchImportService;
    public BatchSchedulerService(BatchImportService batchImportService) { this.batchImportService = batchImportService; }
    @Scheduled(cron = "${batch.schedule.cron}")
    public void scheduledImport() {
        boolean processed = batchImportService.runIfFileAvailable();
        if (!processed) log.info("No new product file found in watched directory. Batch job skipped.");
    }
}
