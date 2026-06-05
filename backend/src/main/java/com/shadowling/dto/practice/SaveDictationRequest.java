package com.shadowling.dto.practice;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class SaveDictationRequest {

    @NotNull
    private UUID lessonId;

    @NotNull
    private double score;

    @NotNull
    private double accuracyPercent;

    private int timeSpentSeconds;

    private List<DictationError> errors;

    @Data
    public static class DictationError {
        private int position;
        private String expected;
        private String got;
    }
}
