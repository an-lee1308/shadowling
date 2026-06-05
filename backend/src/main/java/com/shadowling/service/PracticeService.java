package com.shadowling.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shadowling.dto.practice.PracticeSessionDto;
import com.shadowling.dto.practice.SaveDictationRequest;
import com.shadowling.dto.practice.SaveShadowingRequest;
import com.shadowling.model.Lesson;
import com.shadowling.model.PracticeSession;
import com.shadowling.model.User;
import com.shadowling.model.UserLessonProgress;
import com.shadowling.model.enums.PracticeMode;
import com.shadowling.model.enums.ProgressStatus;
import com.shadowling.repository.LessonRepository;
import com.shadowling.repository.PracticeSessionRepository;
import com.shadowling.repository.UserLessonProgressRepository;
import com.shadowling.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PracticeService {

    private final PracticeSessionRepository sessionRepository;
    private final UserLessonProgressRepository progressRepository;
    private final UserRepository userRepository;
    private final LessonRepository lessonRepository;
    private final WordService wordService;
    private final GamificationService gamificationService;
    private final ObjectMapper objectMapper;

    @Transactional
    public PracticeSessionDto saveDictation(UUID userId, SaveDictationRequest req) {
        String errorsJson = serializeErrors(req.getErrors());

        PracticeSession session = PracticeSession.builder()
                .userId(userId)
                .lessonId(req.getLessonId())
                .mode(PracticeMode.DICTATION)
                .score(req.getScore())
                .accuracyPercent(req.getAccuracyPercent())
                .errors(errorsJson)
                .build();

        session = sessionRepository.save(session);
        updateProgress(userId, req.getLessonId(), PracticeMode.DICTATION, req.getScore(), req.getTimeSpentSeconds());
        updateStreak(userId);
        wordService.autoSaveForLesson(userId, req.getLessonId());
        gamificationService.awardXpAndCheck(userId, 30, "dictation");
        if (req.getAccuracyPercent() >= 100.0) {
            gamificationService.grantPerfectDictation(userId);
        }

        return toDto(session, null);
    }

    @Transactional
    public PracticeSessionDto saveShadowing(UUID userId, SaveShadowingRequest req) {
        PracticeSession session = PracticeSession.builder()
                .userId(userId)
                .lessonId(req.getLessonId())
                .mode(PracticeMode.SHADOWING)
                .score(req.getScore())
                .accuracyPercent(req.getAccuracyPercent())
                .recordingUrl(req.getRecordingUrl())
                .build();

        session = sessionRepository.save(session);
        updateProgress(userId, req.getLessonId(), PracticeMode.SHADOWING, req.getScore(), req.getTimeSpentSeconds());
        updateStreak(userId);
        wordService.autoSaveForLesson(userId, req.getLessonId());
        gamificationService.awardXpAndCheck(userId, 40, "shadowing");

        return toDto(session, null);
    }

    public List<PracticeSessionDto> getHistory(UUID userId, int page, int size) {
        List<PracticeSession> sessions = sessionRepository.findByUserIdOrderByCreatedAtDesc(
                userId, PageRequest.of(page, size)).getContent();

        return sessions.stream().map(s -> {
            String lessonTitle = lessonRepository.findById(s.getLessonId())
                    .map(Lesson::getTitle).orElse("Unknown");
            return toDto(s, lessonTitle);
        }).collect(Collectors.toList());
    }

    public List<PracticeSessionDto> getHistoryByLesson(UUID userId, UUID lessonId) {
        return sessionRepository.findByUserIdAndLessonId(userId, lessonId)
                .stream()
                .map(s -> toDto(s, null))
                .collect(Collectors.toList());
    }

    private void updateProgress(UUID userId, UUID lessonId, PracticeMode mode, double score, int timeSpent) {
        UserLessonProgress progress = progressRepository
                .findByUserIdAndLessonIdAndMode(userId, lessonId, mode)
                .orElse(UserLessonProgress.builder()
                        .userId(userId)
                        .lessonId(lessonId)
                        .mode(mode)
                        .build());

        progress.setAttempts(progress.getAttempts() + 1);
        progress.setTimeSpentSeconds(progress.getTimeSpentSeconds() + timeSpent);
        progress.setLastPracticedAt(LocalDateTime.now());

        if (score > progress.getBestScore()) {
            progress.setBestScore(score);
        }

        if (score >= 80.0) {
            progress.setStatus(ProgressStatus.COMPLETED);
        } else if (progress.getStatus() == ProgressStatus.NOT_STARTED) {
            progress.setStatus(ProgressStatus.IN_PROGRESS);
        }

        progressRepository.save(progress);
    }

    private void updateStreak(UUID userId) {
        User user = userRepository.findById(userId).orElseThrow();
        LocalDate today = LocalDate.now();
        LocalDate lastActive = user.getLastActiveAt() != null
                ? user.getLastActiveAt().toLocalDate() : null;

        if (lastActive == null || lastActive.isBefore(today.minusDays(1))) {
            user.setStreakCount(1);
        } else if (lastActive.isBefore(today)) {
            user.setStreakCount(user.getStreakCount() + 1);
        }

        user.setLastActiveAt(LocalDateTime.now());
        userRepository.save(user);
    }

    private PracticeSessionDto toDto(PracticeSession s, String lessonTitle) {
        return PracticeSessionDto.builder()
                .id(s.getId())
                .lessonId(s.getLessonId())
                .lessonTitle(lessonTitle)
                .mode(s.getMode())
                .score(s.getScore())
                .accuracyPercent(s.getAccuracyPercent())
                .recordingUrl(s.getRecordingUrl())
                .errors(s.getErrors())
                .createdAt(s.getCreatedAt())
                .build();
    }

    private String serializeErrors(Object errors) {
        if (errors == null) return null;
        try {
            return objectMapper.writeValueAsString(errors);
        } catch (JsonProcessingException e) {
            return null;
        }
    }
}
