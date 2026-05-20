package com.amitra.commercemesh.batch.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "imported_files")
public class ImportedFileRecord {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 500)
    private String fileName;
    private Instant processedAt;
    public ImportedFileRecord() {}
    public ImportedFileRecord(String fileName, Instant processedAt) { this.fileName = fileName; this.processedAt = processedAt; }
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public String getFileName() { return fileName; } public void setFileName(String fileName) { this.fileName = fileName; }
    public Instant getProcessedAt() { return processedAt; } public void setProcessedAt(Instant processedAt) { this.processedAt = processedAt; }
}
