package com.shadowling.dto.practice;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DictationScoreRequest {

    @NotBlank
    private String expected;

    @NotBlank
    private String actual;
}
