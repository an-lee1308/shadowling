package com.shadowling.repository;

import com.shadowling.model.RecordingUpload;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RecordingUploadRepository extends JpaRepository<RecordingUpload, UUID> {
    List<RecordingUpload> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
