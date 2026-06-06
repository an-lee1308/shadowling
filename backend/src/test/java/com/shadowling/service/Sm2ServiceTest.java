package com.shadowling.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

class Sm2ServiceTest {

    private Sm2Service sm2;

    @BeforeEach
    void setUp() {
        sm2 = new Sm2Service();
    }

    // --- First repetition (rep=0) ---

    @Test
    void firstRepGoodQuality_intervalOne() {
        var result = sm2.calculate(2.5, 1, 0, 4);
        assertThat(result.repetitions()).isEqualTo(1);
        assertThat(result.intervalDays()).isEqualTo(1);
    }

    @Test
    void firstRepEasyQuality_intervalOne() {
        var result = sm2.calculate(2.5, 1, 0, 5);
        assertThat(result.repetitions()).isEqualTo(1);
        assertThat(result.intervalDays()).isEqualTo(1);
    }

    // --- Second repetition (rep=1) ---

    @Test
    void secondRepGoodQuality_intervalSix() {
        var result = sm2.calculate(2.5, 1, 1, 4);
        assertThat(result.repetitions()).isEqualTo(2);
        assertThat(result.intervalDays()).isBetween(5, 7);
    }

    // --- Subsequent repetitions (rep>=2) ---

    @Test
    void thirdRepGoodQuality_usesEaseFactor() {
        var result = sm2.calculate(2.5, 6, 2, 4);
        int expectedInterval = (int) Math.round(6 * 2.5); // 15
        int fuzz = Math.max(1, (int) (expectedInterval * 0.1)); // 1
        assertThat(result.intervalDays()).isBetween(expectedInterval - fuzz, expectedInterval + fuzz);
        assertThat(result.repetitions()).isEqualTo(3);
    }

    // --- Ease factor changes ---

    @Test
    void easyQuality_increasesEaseFactor() {
        double ef = 2.5;
        var result = sm2.calculate(ef, 1, 1, 5);
        assertThat(result.easeFactor()).isGreaterThan(ef);
    }

    @Test
    void goodQuality_maintainsEaseFactor() {
        double ef = 2.5;
        var result = sm2.calculate(ef, 1, 1, 4);
        assertThat(result.easeFactor()).isCloseTo(ef + 0.1 - (5 - 4) * (0.08 + (5 - 4) * 0.02), within(0.001));
    }

    @Test
    void hardQuality_decreasesEaseFactor() {
        double ef = 2.5;
        var result = sm2.calculate(ef, 1, 1, 3);
        assertThat(result.easeFactor()).isLessThan(ef);
    }

    // --- Failed quality (< 3) resets ---

    @Test
    void failedQuality_resetsRepetitions() {
        var result = sm2.calculate(2.5, 10, 5, 0);
        assertThat(result.repetitions()).isEqualTo(0);
        assertThat(result.intervalDays()).isEqualTo(1);
    }

    @Test
    void failedQuality_decreasesEaseFactor() {
        double ef = 2.5;
        var result = sm2.calculate(ef, 10, 5, 2);
        assertThat(result.easeFactor()).isCloseTo(ef - 0.2, within(0.001));
    }

    @Test
    void failedQuality_againKeyword_resetsRepetitions() {
        var result = sm2.calculate(2.5, 1, 1, 0);
        assertThat(result.repetitions()).isEqualTo(0);
        assertThat(result.intervalDays()).isEqualTo(1);
    }

    // --- Ease factor floor ---

    @Test
    void easeFactorNeverDropsBelowMinimum() {
        // After many failures, ef should stay >= 1.3
        var result1 = sm2.calculate(1.4, 1, 0, 0);
        assertThat(result1.easeFactor()).isGreaterThanOrEqualTo(1.3);

        var result2 = sm2.calculate(1.3, 1, 0, 0);
        assertThat(result2.easeFactor()).isGreaterThanOrEqualTo(1.3);
    }

    // --- Boundary: quality=3 (HARD, still passes) ---

    @Test
    void hardBoundary_qualityThree_doesNotReset() {
        var result = sm2.calculate(2.5, 1, 2, 3);
        assertThat(result.repetitions()).isEqualTo(3);
        assertThat(result.intervalDays()).isGreaterThanOrEqualTo(1);
    }

    // --- Sequence test: simulate 5 reviews ---

    @Test
    void fullSequence_progressesCorrectly() {
        double ef = 2.5;
        int interval = 1;
        int reps = 0;

        // Day 0: GOOD
        var r1 = sm2.calculate(ef, interval, reps, 4);
        assertThat(r1.repetitions()).isEqualTo(1);
        assertThat(r1.intervalDays()).isEqualTo(1);
        ef = r1.easeFactor();
        interval = r1.intervalDays();
        reps = r1.repetitions();

        // Day 1: GOOD
        var r2 = sm2.calculate(ef, interval, reps, 4);
        assertThat(r2.repetitions()).isEqualTo(2);
        assertThat(r2.intervalDays()).isBetween(5, 7);
        ef = r2.easeFactor();
        interval = r2.intervalDays();
        reps = r2.repetitions();

        // Day 7: EASY
        var r3 = sm2.calculate(ef, interval, reps, 5);
        assertThat(r3.repetitions()).isEqualTo(3);
        assertThat(r3.intervalDays()).isGreaterThan(6);

        // Day after: AGAIN (fail)
        var r4 = sm2.calculate(r3.easeFactor(), r3.intervalDays(), r3.repetitions(), 0);
        assertThat(r4.repetitions()).isEqualTo(0);
        assertThat(r4.intervalDays()).isEqualTo(1);
    }
}
