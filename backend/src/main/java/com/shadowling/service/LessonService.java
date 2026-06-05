package com.shadowling.service;

import com.shadowling.dto.lesson.LessonDto;
import com.shadowling.model.Lesson;
import com.shadowling.model.UserLessonProgress;
import com.shadowling.model.enums.PracticeMode;
import com.shadowling.model.enums.UserLevel;
import com.shadowling.repository.LessonRepository;
import com.shadowling.repository.UserLessonProgressRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LessonService {

    private final LessonRepository lessonRepository;
    private final UserLessonProgressRepository progressRepository;

    public Page<LessonDto> list(String level, String topic, int page, int size, String sort, UUID userId) {
        Sort sortSpec = "popular".equalsIgnoreCase(sort)
                ? Sort.by("playCount").descending()
                : Sort.by("publishedAt").descending();

        PageRequest pageable = PageRequest.of(page, size, sortSpec);
        Page<Lesson> lessons;

        if (level != null && topic != null) {
            lessons = lessonRepository.findByLevelAndTopic(UserLevel.valueOf(level.toUpperCase()), topic, pageable);
        } else if (level != null) {
            lessons = lessonRepository.findByLevel(UserLevel.valueOf(level.toUpperCase()), pageable);
        } else if (topic != null) {
            lessons = lessonRepository.findByTopic(topic, pageable);
        } else {
            lessons = lessonRepository.findAll(pageable);
        }

        Map<UUID, UserLessonProgress> progressMap = progressRepository.findByUserId(userId)
                .stream()
                .collect(Collectors.toMap(UserLessonProgress::getLessonId, p -> p, (a, b) -> a));

        return lessons.map(l -> toDto(l, progressMap.get(l.getId())));
    }

    @Transactional
    public LessonDto getById(UUID id, UUID userId) {
        Lesson lesson = lessonRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Lesson not found"));

        lesson.setPlayCount(lesson.getPlayCount() + 1);
        lessonRepository.save(lesson);

        Optional<UserLessonProgress> progress =
                progressRepository.findByUserIdAndLessonIdAndMode(userId, id, PracticeMode.DICTATION);

        return toDto(lesson, progress.orElse(null));
    }

    public Page<LessonDto> search(String query, int page, int size, UUID userId) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("publishedAt").descending());
        Page<Lesson> lessons = lessonRepository.search(query, pageable);

        Map<UUID, UserLessonProgress> progressMap = progressRepository.findByUserId(userId)
                .stream()
                .collect(Collectors.toMap(UserLessonProgress::getLessonId, p -> p, (a, b) -> a));

        return lessons.map(l -> toDto(l, progressMap.get(l.getId())));
    }

    private LessonDto toDto(Lesson lesson, UserLessonProgress progress) {
        return LessonDto.builder()
                .id(lesson.getId())
                .title(lesson.getTitle())
                .description(lesson.getDescription())
                .audioUrl(lesson.getAudioUrl())
                .videoUrl(lesson.getVideoUrl())
                .thumbnailUrl(lesson.getThumbnailUrl())
                .transcript(lesson.getTranscript())
                .level(lesson.getLevel())
                .topic(lesson.getTopic())
                .durationSeconds(lesson.getDurationSeconds())
                .publishedAt(lesson.getPublishedAt())
                .playCount(lesson.getPlayCount())
                .userStatus(progress != null ? progress.getStatus().name() : "NOT_STARTED")
                .userBestScore(progress != null ? progress.getBestScore() : null)
                .build();
    }
}
