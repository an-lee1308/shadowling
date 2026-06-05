package com.shadowling.dto.word;

import com.shadowling.model.enums.ReviewQuality;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class ReviewWordRequest {

    @NotNull
    private ReviewQuality quality;

    private UUID sessionId;      // links review to an active session
    private boolean cramMode;    // if true, skip SM-2 update
    private Long responseTimeMs; // time taken to answer (ms)
}
