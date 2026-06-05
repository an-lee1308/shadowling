package com.shadowling.dto.word;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class WordDto {
    private UUID id;
    private String text;
    private String definition;
    private String pronunciation;
    private String audioUrl;
    private String exampleSentence;
    // SM-2 state
    private Double easeFactor;
    private Integer intervalDays;
    private Integer repetitions;
    private LocalDateTime nextReviewAt;
    private LocalDateTime lastReviewedAt;
    // Leech / suspend tracking
    private Boolean leech;
    private Boolean suspended;
    private Integer againCount;
    // Card type hint: CLASSIC_FLIP | MULTIPLE_CHOICE | FILL_IN_BLANK
    private String cardType;
}
