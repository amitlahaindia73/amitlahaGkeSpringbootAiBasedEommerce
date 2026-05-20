package com.amitra.commercemesh.batch.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "batch_job_execution")
public class BatchJobExecutionRecord {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 100) private String jobName;
    @Column(nullable = false, length = 100) private String status;
    @Column(nullable = false, length = 500) private String sourceFile;
    private Instant startedAt;
    private Instant completedAt;
    private Integer processedCount;
    private Integer successCount;
    private Integer skippedCount;
    private Integer errorCount;
    @Column(length = 4000) private String details;
    @Column(length = 500) private String reportFile;
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public String getJobName() { return jobName; } public void setJobName(String jobName) { this.jobName = jobName; }
    public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
    public String getSourceFile() { return sourceFile; } public void setSourceFile(String sourceFile) { this.sourceFile = sourceFile; }
    public Instant getStartedAt() { return startedAt; } public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }
    public Instant getCompletedAt() { return completedAt; } public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
    public Integer getProcessedCount() { return processedCount; } public void setProcessedCount(Integer processedCount) { this.processedCount = processedCount; }
    public Integer getSuccessCount() { return successCount; } public void setSuccessCount(Integer successCount) { this.successCount = successCount; }
    public Integer getSkippedCount() { return skippedCount; } public void setSkippedCount(Integer skippedCount) { this.skippedCount = skippedCount; }
    public Integer getErrorCount() { return errorCount; } public void setErrorCount(Integer errorCount) { this.errorCount = errorCount; }
    public String getDetails() { return details; } public void setDetails(String details) { this.details = details; }
    public String getReportFile() { return reportFile; } public void setReportFile(String reportFile) { this.reportFile = reportFile; }
}
