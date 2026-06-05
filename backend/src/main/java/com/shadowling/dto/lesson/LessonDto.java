package com.shadowling.dto.lesson;

import com.shadowling.model.enums.UserLevel;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class LessonDto {
    private UUID id;
    private String title;
    private String description;
    private String audioUrl;
    private String videoUrl;
    private String thumbnailUrl;
    private String transcript;
    private UserLevel level;
    private String topic;
    private Integer durationSeconds;
    private LocalDateTime publishedAt;
    private String userStatus;
    private Double userBestScore;
    private int playCount;
}
