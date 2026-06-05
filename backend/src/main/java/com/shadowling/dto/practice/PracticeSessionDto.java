package com.shadowling.dto.practice;

import com.shadowling.model.enums.PracticeMode;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class PracticeSessionDto {
    private UUID id;
    private UUID lessonId;
    private String lessonTitle;
    private PracticeMode mode;
    private Double score;
    private Double accuracyPercent;
    private String recordingUrl;
    private String errors;
    private LocalDateTime createdAt;
}
