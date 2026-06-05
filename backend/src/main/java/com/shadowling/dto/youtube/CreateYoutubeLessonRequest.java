package com.shadowling.dto.youtube;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateYoutubeLessonRequest {
    @NotBlank(message = "URL không được để trống")
    private String url;
}
