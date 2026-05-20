package com.amitra.commercemesh.batch.controller;

import com.amitra.commercemesh.batch.domain.BatchJobExecutionRecord;
import com.amitra.commercemesh.batch.dto.BatchDashboardResponse;
import com.amitra.commercemesh.batch.service.BatchImportService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin/batch")
public class BatchAdminController {
    private final BatchImportService batchImportService;
    public BatchAdminController(BatchImportService batchImportService) { this.batchImportService = batchImportService; }
    @GetMapping("/dashboard")
    public BatchDashboardResponse dashboard() { return batchImportService.getDashboard(); }
    @GetMapping("/jobs")
    public List<BatchJobExecutionRecord> jobs() { return batchImportService.recentJobs(); }
    @PostMapping("/run")
    public ResponseEntity<String> runNow() {
        boolean processed = batchImportService.runIfFileAvailable();
        return ResponseEntity.ok(processed ? "Manual batch trigger processed one file." : "Manual batch trigger found no new file.");
    }
}
