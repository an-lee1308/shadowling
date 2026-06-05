package com.shadowling.dto.admin;

import com.shadowling.model.enums.UserLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateLessonRequest {

    @NotBlank
    private String title;

    private String description;
    private String audioUrl;
    private String videoUrl;
    private String thumbnailUrl;

    @NotBlank(message = "Transcript is required (JSON array)")
    private String transcript;

    @NotNull
    private UserLevel level;

    private String topic;
    private Integer durationSeconds;
}
