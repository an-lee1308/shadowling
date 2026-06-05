package com.shadowling.service;

import com.shadowling.dto.practice.DictationScoreResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

class LevenshteinServiceTest {

    private LevenshteinService service;

    @BeforeEach
    void setUp() {
        service = new LevenshteinService();
    }

    // --- Perfect match ---

    @Test
    void perfectMatch_100Percent() {
        var result = service.compare("hello world", "hello world");
        assertThat(result.getAccuracyPercent()).isEqualTo(100.0);
        assertThat(result.getCorrectWords()).isEqualTo(2);
        assertThat(result.getTotalWords()).isEqualTo(2);
        assertThat(result.getWordResults()).allMatch(DictationScoreResponse.WordResult::isCorrect);
    }

    // --- Case insensitive ---

    @Test
    void caseInsensitive_treatedAsCorrect() {
        var result = service.compare("Hello World", "hello world");
        assertThat(result.getAccuracyPercent()).isEqualTo(100.0);
    }

    // --- Punctuation stripped ---

    @Test
    void punctuationStripped_treatedAsCorrect() {
        var result = service.compare("don't stop", "don't stop");
        assertThat(result.getAccuracyPercent()).isEqualTo(100.0);
    }

    @Test
    void trailingPunctuation_ignoredInComparison() {
        var result = service.compare("hello, world!", "hello world");
        assertThat(result.getAccuracyPercent()).isEqualTo(100.0);
    }

    // --- Partial match ---

    @Test
    void halfCorrect_50Percent() {
        var result = service.compare("one two three four", "one two wrong wrong");
        assertThat(result.getCorrectWords()).isEqualTo(2);
        assertThat(result.getTotalWords()).isEqualTo(4);
        assertThat(result.getAccuracyPercent()).isEqualTo(50.0);
    }

    // --- Empty actual input ---

    @Test
    void emptyActual_zeroPercent() {
        var result = service.compare("hello world", "");
        assertThat(result.getAccuracyPercent()).isEqualTo(0.0);
        assertThat(result.getCorrectWords()).isEqualTo(0);
        assertThat(result.getTotalWords()).isEqualTo(2);
    }

    // --- Single word ---

    @Test
    void singleWordCorrect() {
        var result = service.compare("hello", "hello");
        assertThat(result.getAccuracyPercent()).isEqualTo(100.0);
    }

    @Test
    void singleWordWrong() {
        var result = service.compare("hello", "world");
        assertThat(result.getAccuracyPercent()).isEqualTo(0.0);
    }

    // --- Extra words in actual are ignored (only expected length counts) ---

    @Test
    void extraWordsInActual_scoredByExpectedLength() {
        var result = service.compare("hello", "hello extra words");
        assertThat(result.getTotalWords()).isEqualTo(1);
        assertThat(result.getCorrectWords()).isEqualTo(1);
    }

    // --- Word result positions ---

    @Test
    void wordResultsHaveCorrectPositions() {
        var result = service.compare("a b c", "a x c");
        assertThat(result.getWordResults()).hasSize(3);
        assertThat(result.getWordResults().get(0).isCorrect()).isTrue();
        assertThat(result.getWordResults().get(1).isCorrect()).isFalse();
        assertThat(result.getWordResults().get(2).isCorrect()).isTrue();
    }

    // --- Levenshtein static method ---

    @Test
    void levenshtein_identicalStrings_zero() {
        assertThat(LevenshteinService.levenshtein("hello", "hello")).isEqualTo(0);
    }

    @Test
    void levenshtein_oneSubstitution() {
        assertThat(LevenshteinService.levenshtein("hello", "hella")).isEqualTo(1);
    }

    @Test
    void levenshtein_emptyVsString() {
        assertThat(LevenshteinService.levenshtein("", "abc")).isEqualTo(3);
    }

    @Test
    void levenshtein_bothEmpty_zero() {
        assertThat(LevenshteinService.levenshtein("", "")).isEqualTo(0);
    }

    @Test
    void levenshtein_insertAndDelete() {
        assertThat(LevenshteinService.levenshtein("kitten", "sitting")).isEqualTo(3);
    }
}
