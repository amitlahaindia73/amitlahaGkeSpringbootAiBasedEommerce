package com.amitra.commercemesh.batch.service;

import com.amitra.commercemesh.batch.domain.BatchJobExecutionRecord;
import com.amitra.commercemesh.batch.domain.BatchProductDocument;
import com.amitra.commercemesh.batch.domain.ImportedFileRecord;
import com.amitra.commercemesh.batch.dto.BatchDashboardResponse;
import com.amitra.commercemesh.batch.repository.BatchJobExecutionRecordRepository;
import com.amitra.commercemesh.batch.repository.BatchProductRepository;
import com.amitra.commercemesh.batch.repository.ImportedFileRecordRepository;
import com.google.cloud.storage.Blob;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.nio.file.*;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Stream;

@Service
public class BatchImportService {
    private static final Logger log = LoggerFactory.getLogger(BatchImportService.class);
    private static final String IMPORTED_BY = "product-batch-service";
    private static final String GCS_MODE = "gcs";

    private final ImportedFileRecordRepository importedFileRepository;
    private final BatchJobExecutionRecordRepository jobRepository;
    private final BatchProductRepository productRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final Path inputDirectory;
    private final Path reportDirectory;
    private final String storageMode;
    private final String gcsInputBucket;
    private final String gcsReportBucket;
    private final Storage storage;

    public BatchImportService(ImportedFileRecordRepository importedFileRepository,
                              BatchJobExecutionRecordRepository jobRepository,
                              BatchProductRepository productRepository,
                              KafkaTemplate<String, Object> kafkaTemplate,
                              @Value("${batch.input.directory}") String inputDirectory,
                              @Value("${batch.report.directory}") String reportDirectory,
                              @Value("${batch.storage.mode:local}") String storageMode,
                              @Value("${batch.gcs.input-bucket:}") String gcsInputBucket,
                              @Value("${batch.gcs.report-bucket:}") String gcsReportBucket) {
        this.importedFileRepository = importedFileRepository;
        this.jobRepository = jobRepository;
        this.productRepository = productRepository;
        this.kafkaTemplate = kafkaTemplate;
        this.inputDirectory = Paths.get(inputDirectory);
        this.reportDirectory = Paths.get(reportDirectory);
        this.storageMode = storageMode;
        this.gcsInputBucket = gcsInputBucket;
        this.gcsReportBucket = gcsReportBucket;
        this.storage = GCS_MODE.equalsIgnoreCase(storageMode) ? StorageOptions.getDefaultInstance().getService() : null;
    }

    public BatchDashboardResponse getDashboard() {
        List<BatchJobExecutionRecord> recentJobs = jobRepository.findTop20ByOrderByStartedAtDesc();
        BatchJobExecutionRecord latestJob = recentJobs.isEmpty() ? null : recentJobs.get(0);
        return new BatchDashboardResponse(importedFileRepository.count(), productRepository.count(), latestJob, recentJobs);
    }

    public List<BatchJobExecutionRecord> recentJobs() { return jobRepository.findTop20ByOrderByStartedAtDesc(); }

    public boolean runIfFileAvailable() {
        Path nextFile = isGcsMode() ? findNextGcsImportFile() : findNextLocalImportFile();
        if (nextFile == null) return false;

        BatchJobExecutionRecord job = processFile(nextFile);
        if (isGcsMode() && job != null && StringUtils.hasText(job.getReportFile())) {
            uploadReportToGcs(job.getReportFile());
        }
        return true;
    }

    private boolean isGcsMode() {
        return GCS_MODE.equalsIgnoreCase(storageMode);
    }

    private Path findNextGcsImportFile() {
        validateGcsConfiguration();
        try {
            Files.createDirectories(inputDirectory);
            log.info("GCS batch mode enabled. Looking for CSV files in gs://{}", gcsInputBucket);

            Blob nextBlob = storage.list(gcsInputBucket).iterateAll().iterator().hasNext()
                    ? findNextUnprocessedCsvBlob()
                    : null;

            if (nextBlob == null) {
                log.info("No new CSV file found in GCS input bucket gs://{}", gcsInputBucket);
                return null;
            }

            Path localPath = inputDirectory.resolve(Paths.get(nextBlob.getName()).getFileName().toString());
            nextBlob.downloadTo(localPath);
            log.info("Downloaded GCS product import file gs://{}/{} to {}", gcsInputBucket, nextBlob.getName(), localPath);
            return localPath;
        } catch (IOException e) {
            throw new IllegalStateException("Unable to prepare local batch input directory for GCS download", e);
        } catch (Exception e) {
            throw new IllegalStateException("Unable to read product import file from GCS bucket " + gcsInputBucket, e);
        }
    }

    private Blob findNextUnprocessedCsvBlob() {
        Blob selected = null;
        for (Blob blob : storage.list(gcsInputBucket).iterateAll()) {
            if (blob == null) continue;
            String objectName = blob.getName();
            if (objectName == null || objectName.endsWith("/")) continue;
            String fileName = Paths.get(objectName).getFileName().toString();
            if (!fileName.endsWith(".csv")) continue;
            if (importedFileRepository.existsByFileName(fileName)) continue;
            if (selected == null || objectName.compareTo(selected.getName()) < 0) {
                selected = blob;
            }
        }
        return selected;
    }

    private Path findNextLocalImportFile() {
        try {
            Files.createDirectories(inputDirectory);
            log.info("Local batch mode enabled. Looking for CSV files in {}", inputDirectory);
            try (Stream<Path> paths = Files.list(inputDirectory)) {
                return paths.filter(Files::isRegularFile)
                        .filter(path -> path.getFileName().toString().endsWith(".csv"))
                        .filter(path -> !importedFileRepository.existsByFileName(path.getFileName().toString()))
                        .min(Comparator.comparing(path -> path.getFileName().toString()))
                        .orElse(null);
            }
        } catch (IOException e) {
            throw new IllegalStateException("Unable to inspect batch input directory", e);
        }
    }

    @Transactional
    public BatchJobExecutionRecord processFile(Path filePath) {
        BatchJobExecutionRecord job = new BatchJobExecutionRecord();
        job.setJobName("productFileImportJob");
        job.setSourceFile(filePath.getFileName().toString());
        job.setStatus("STARTED");
        job.setStartedAt(Instant.now());
        job.setProcessedCount(0); job.setSuccessCount(0); job.setSkippedCount(0); job.setErrorCount(0);
        job = jobRepository.save(job);

        List<String> errors = new ArrayList<>();
        Set<String> importedIds = new LinkedHashSet<>();
        int processed = 0, success = 0, skipped = 0;
        try {
            List<String> lines = Files.readAllLines(filePath);
            for (int index = 1; index < lines.size(); index++) {
                String line = lines.get(index);
                if (line == null || line.isBlank()) { skipped++; continue; }
                processed++;
                try {
                    String[] parts = line.split(",", 9);
                    if (parts.length < 9) {
                        throw new IllegalArgumentException("Expected 9 comma-separated values: id,sku,name,category,description,price,availableQuantity,imageUrl,active");
                    }
                    BatchProductDocument product = new BatchProductDocument();
                    product.setId(parts[0].trim());
                    product.setSku(parts[1].trim());
                    product.setName(parts[2].trim());
                    product.setCategory(parts[3].trim());
                    product.setDescription(parts[4].trim());
                    product.setPrice(Double.parseDouble(parts[5].trim()));
                    product.setAvailableQuantity(Integer.parseInt(parts[6].trim()));
                    product.setImageUrl(parts[7].trim());
                    product.setActive(Boolean.parseBoolean(parts[8].trim()));
                    product.setImportedBy(IMPORTED_BY);
                    product.setSourceFile(filePath.getFileName().toString());
                    productRepository.save(product);
                    importedIds.add(product.getId());
                    success++;
                } catch (Exception rowError) {
                    errors.add("row=" + (index + 1) + " -> " + rowError.getMessage());
                }
            }

            if (!importedIds.isEmpty()) {
                productRepository.deleteByImportedByAndIdNotIn(IMPORTED_BY, importedIds);
            }

            importedFileRepository.save(new ImportedFileRecord(filePath.getFileName().toString(), Instant.now()));
            String reportFile = writeReport(job.getId(), filePath.getFileName().toString(), processed, success, skipped, errors);
            job.setStatus(errors.isEmpty() ? "COMPLETED" : "COMPLETED_WITH_ERRORS");
            job.setCompletedAt(Instant.now());
            job.setProcessedCount(processed); job.setSuccessCount(success); job.setSkippedCount(skipped); job.setErrorCount(errors.size());
            job.setDetails(errors.isEmpty() ? "CSV synchronized successfully. Mongo products now match the imported file." : String.join(" | ", errors));
            job.setReportFile(reportFile);
            kafkaTemplate.send("product.import.completed", filePath.getFileName().toString(), job.getStatus());
            return jobRepository.save(job);
        } catch (Exception e) {
            job.setStatus("FAILED");
            job.setCompletedAt(Instant.now());
            job.setProcessedCount(processed); job.setSuccessCount(success); job.setSkippedCount(skipped); job.setErrorCount(errors.size() + 1);
            job.setDetails("Import failed: " + e.getMessage());
            return jobRepository.save(job);
        }
    }

    private String writeReport(Long jobId, String sourceFile, int processed, int success, int skipped, List<String> errors) throws IOException {
        Files.createDirectories(reportDirectory);
        String reportName = "product-import-report-" + jobId + "-" + DateTimeFormatter.ofPattern("yyyyMMddHHmmss").format(ZonedDateTime.now()) + ".csv";
        Path reportPath = reportDirectory.resolve(reportName);
        List<String> lines = new ArrayList<>();
        lines.add("metric,value");
        lines.add("sourceFile," + sourceFile);
        lines.add("processed," + processed);
        lines.add("success," + success);
        lines.add("skipped," + skipped);
        lines.add("errors," + errors.size());
        if (!errors.isEmpty()) {
            lines.add("errorDetails,\"" + String.join(" ; ", errors).replace("\"", "'") + "\"");
        }
        Files.write(reportPath, lines, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
        return reportPath.toString();
    }

    private void uploadReportToGcs(String reportFile) {
        validateGcsConfiguration();
        try {
            Path reportPath = Paths.get(reportFile);
            if (!Files.exists(reportPath)) {
                log.warn("Report file {} does not exist locally. Skipping GCS report upload.", reportFile);
                return;
            }
            String objectName = reportPath.getFileName().toString();
            BlobId blobId = BlobId.of(gcsReportBucket, objectName);
            BlobInfo blobInfo = BlobInfo.newBuilder(blobId).setContentType("text/csv").build();
            storage.create(blobInfo, Files.readAllBytes(reportPath));
            log.info("Uploaded batch report {} to gs://{}/{}", reportPath, gcsReportBucket, objectName);
        } catch (IOException e) {
            throw new IllegalStateException("Unable to upload batch report to GCS bucket " + gcsReportBucket, e);
        }
    }

    private void validateGcsConfiguration() {
        if (!StringUtils.hasText(gcsInputBucket)) {
            throw new IllegalStateException("batch.gcs.input-bucket is required when batch.storage.mode=gcs");
        }
        if (!StringUtils.hasText(gcsReportBucket)) {
            throw new IllegalStateException("batch.gcs.report-bucket is required when batch.storage.mode=gcs");
        }
    }
}
