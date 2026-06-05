package com.shadowling.dto.practice;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class DictationScoreResponse {
    private double accuracyPercent;
    private int correctWords;
    private int totalWords;
    private List<WordResult> wordResults;

    @Data
    @Builder
    public static class WordResult {
        private int position;
        private String expected;
        private String got;
        private boolean correct;
    }
}
