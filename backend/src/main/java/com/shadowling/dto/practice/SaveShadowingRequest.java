package com.shadowling.dto.practice;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class SaveShadowingRequest {

    @NotNull
    private UUID lessonId;

    @NotNull
    private double score;

    @NotNull
    private double accuracyPercent;

    private String recordingUrl;

    private int timeSpentSeconds;
}
