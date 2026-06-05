package com.shadowling.model.enums;

public enum ReviewQuality {
    AGAIN(0), HARD(2), GOOD(4), EASY(5);

    public final int value;

    ReviewQuality(int value) {
        this.value = value;
    }
}
