package com.shadowling.dto.word;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Builder
public class StartSessionResponse {
    private UUID sessionId;
    private List<WordDto> cards;
    private int totalCards;
}
