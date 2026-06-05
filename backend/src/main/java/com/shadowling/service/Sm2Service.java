package com.shadowling.service;

import org.springframework.stereotype.Service;

import java.util.concurrent.ThreadLocalRandom;

@Service
public class Sm2Service {

    public record Sm2Result(double easeFactor, int intervalDays, int repetitions) {}

    public Sm2Result calculate(double easeFactor, int intervalDays, int repetitions, int quality) {
        if (quality >= 3) {
            int nextInterval = switch (repetitions) {
                case 0 -> 1;
                case 1 -> 6;
                default -> (int) Math.round(intervalDays * easeFactor);
            };

            double newEf = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
            newEf = Math.max(1.3, newEf);

            return new Sm2Result(newEf, applyFuzz(nextInterval), repetitions + 1);
        } else {
            return new Sm2Result(Math.max(1.3, easeFactor - 0.2), 1, 0);
        }
    }

    // Adds ±10% fuzz to prevent all cards reviewed on the same day from being due again on the same day
    private int applyFuzz(int intervalDays) {
        if (intervalDays <= 1) return intervalDays;
        int fuzz = Math.max(1, (int) (intervalDays * 0.1));
        int offset = ThreadLocalRandom.current().nextInt(-fuzz, fuzz + 1);
        return Math.max(1, intervalDays + offset);
    }
}
