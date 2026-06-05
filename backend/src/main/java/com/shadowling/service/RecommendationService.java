package com.shadowling.service;

import com.shadowling.dto.lesson.LessonDto;
import com.shadowling.model.Lesson;
import com.shadowling.model.User;
import com.shadowling.model.UserLessonProgress;
import com.shadowling.model.enums.ProgressStatus;
import com.shadowling.repository.LessonRepository;
import com.shadowling.repository.UserLessonProgressRepository;
import com.shadowling.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final UserRepository userRepository;
    private final LessonRepository lessonRepository;
    private final UserLessonProgressRepository progressRepository;

    public List<LessonDto> getContinueLessons(UUID userId) {
        return progressRepository.findByUserIdAndStatus(userId, ProgressStatus.IN_PROGRESS)
                .stream()
                .map(p -> lessonRepository.findById(p.getLessonId()).orElse(null))
                .filter(Objects::nonNull)
                .limit(3)
                .map(l -> toDto(l, ProgressStatus.IN_PROGRESS))
                .collect(Collectors.toList());
    }

    public List<LessonDto> getRecommended(UUID userId, int limit) {
        User user = userRepository.findById(userId).orElseThrow();

        Set<UUID> doneIds = progressRepository.findByUserIdAndStatus(userId, ProgressStatus.COMPLETED)
                .stream().map(UserLessonProgress::getLessonId).collect(Collectors.toSet());

        Set<UUID> inProgressIds = progressRepository.findByUserIdAndStatus(userId, ProgressStatus.IN_PROGRESS)
                .stream().map(UserLessonProgress::getLessonId).collect(Collectors.toSet());

        // Primary: same level, not done
        List<Lesson> candidates = lessonRepository
                .findByLevel(user.getLevel(), PageRequest.of(0, limit * 3))
                .getContent()
                .stream()
                .filter(l -> !doneIds.contains(l.getId()) && !inProgressIds.contains(l.getId()))
                .limit(limit)
                .collect(Collectors.toList());

        // If not enough, fill from all levels
        if (candidates.size() < limit) {
            List<Lesson> all = lessonRepository.findAll(PageRequest.of(0, 50)).getContent();
            all.stream()
                    .filter(l -> !doneIds.contains(l.getId())
                            && !inProgressIds.contains(l.getId())
                            && candidates.stream().noneMatch(c -> c.getId().equals(l.getId())))
                    .limit(limit - candidates.size())
                    .forEach(candidates::add);
        }

        return candidates.stream()
                .map(l -> toDto(l, ProgressStatus.NOT_STARTED))
                .collect(Collectors.toList());
    }

    private LessonDto toDto(Lesson l, ProgressStatus status) {
        return LessonDto.builder()
                .id(l.getId())
                .title(l.getTitle())
                .description(l.getDescription())
                .audioUrl(l.getAudioUrl())
                .thumbnailUrl(l.getThumbnailUrl())
                .level(l.getLevel())
                .topic(l.getTopic())
                .durationSeconds(l.getDurationSeconds())
                .publishedAt(l.getPublishedAt())
                .userStatus(status.name())
                .build();
    }
}
