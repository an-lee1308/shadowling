package com.shadowling.dto.word;

import com.shadowling.model.enums.DeckType;
import com.shadowling.model.enums.StudyMode;
import lombok.Data;

import java.util.UUID;

@Data
public class StartSessionRequest {
    private StudyMode mode = StudyMode.NORMAL;
    private DeckType deckType = DeckType.TODAY;
    private UUID lessonId; // only used when deckType = LESSON
}
