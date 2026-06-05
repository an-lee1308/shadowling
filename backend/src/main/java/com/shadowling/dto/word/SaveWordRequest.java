package com.shadowling.dto.word;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class SaveWordRequest {

    @NotNull
    private UUID wordId;
}
