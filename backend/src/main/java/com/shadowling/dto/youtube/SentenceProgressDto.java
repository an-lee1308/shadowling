package com.shadowling.dto.youtube;

public record SentenceProgressDto(
    int sentenceIndex,
    int bestScore,
    int attemptCount,
    boolean completed
) {}
