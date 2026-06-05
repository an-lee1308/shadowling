package com.shadowling.dto.speech;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class PronunciationScoreResponse {
    private String transcript;
    private double overallScore;
    private double accuracyScore;
    private double fluencyScore;
    private int correctWords;
    private int totalWords;
    private List<WordScore> wordScores;

    @Data
    @Builder
    public static class WordScore {
        private String word;
        private String recognized;
        private boolean correct;
        private double score;
    }
}
