package com.shadowling.dto.word;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class SessionResultDto {
    private UUID sessionId;
    private int totalCards;
    private int correctCount;
    private int againCount;
    private int xpEarned;
    private long durationSeconds;
}
