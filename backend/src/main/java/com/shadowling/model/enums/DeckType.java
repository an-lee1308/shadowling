package com.shadowling.model.enums;

public enum DeckType {
    TODAY,   // words with nextReviewAt <= now
    ALL,     // all words in vocabulary
    WEAK,    // words with lowest easeFactor
    LESSON   // words from a specific lesson
}
