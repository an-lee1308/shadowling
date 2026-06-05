package com.shadowling.dto.youtube;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record YouTubeLessonDto(
    UUID id,
    String youtubeVideoId,
    String youtubeUrl,
    String title,
    String thumbnailUrl,
    String channelName,
    Integer durationSeconds,
    List<CaptionSegment> captions,
    int totalSentences,
    int completedSentences,
    LocalDateTime createdAt,
    LocalDateTime lastPracticedAt,
    List<SentenceProgressDto> sentenceProgress
) {}
