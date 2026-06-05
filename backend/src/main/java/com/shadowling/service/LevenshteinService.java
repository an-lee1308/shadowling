package com.shadowling.service;

import com.shadowling.dto.practice.DictationScoreResponse;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class LevenshteinService {

    public DictationScoreResponse compare(String expected, String actual) {
        String[] expectedWords = expected.trim().toLowerCase().split("\\s+");
        String[] actualWords = actual.trim().isEmpty() ? new String[0] : actual.trim().toLowerCase().split("\\s+");

        List<DictationScoreResponse.WordResult> results = new ArrayList<>();
        int correctCount = 0;

        for (int i = 0; i < expectedWords.length; i++) {
            String exp = normalize(expectedWords[i]);
            String got = i < actualWords.length ? normalize(actualWords[i]) : "";
            boolean correct = exp.equals(got);
            if (correct) correctCount++;

            results.add(DictationScoreResponse.WordResult.builder()
                    .position(i)
                    .expected(expectedWords[i])
                    .got(i < actualWords.length ? actualWords[i] : "")
                    .correct(correct)
                    .build());
        }

        double accuracy = expectedWords.length > 0
                ? (double) correctCount / expectedWords.length * 100.0
                : 0.0;

        return DictationScoreResponse.builder()
                .accuracyPercent(Math.round(accuracy * 10.0) / 10.0)
                .correctWords(correctCount)
                .totalWords(expectedWords.length)
                .wordResults(results)
                .build();
    }

    private String normalize(String word) {
        return word.replaceAll("[^a-z0-9']", "");
    }

    public static int levenshtein(String a, String b) {
        int m = a.length(), n = b.length();
        int[][] dp = new int[m + 1][n + 1];
        for (int i = 0; i <= m; i++) dp[i][0] = i;
        for (int j = 0; j <= n; j++) dp[0][j] = j;
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                dp[i][j] = a.charAt(i - 1) == b.charAt(j - 1)
                        ? dp[i - 1][j - 1]
                        : 1 + Math.min(dp[i - 1][j - 1], Math.min(dp[i - 1][j], dp[i][j - 1]));
            }
        }
        return dp[m][n];
    }
}
