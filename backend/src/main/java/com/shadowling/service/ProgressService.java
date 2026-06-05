package com.shadowling.service;

import com.shadowling.dto.progress.AnalyticsResponse;
import com.shadowling.dto.progress.DashboardResponse;
import com.shadowling.model.PracticeSession;
import com.shadowling.model.User;
import com.shadowling.repository.PracticeSessionRepository;
import com.shadowling.repository.UserLessonProgressRepository;
import com.shadowling.repository.UserRepository;
import com.shadowling.repository.UserWordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProgressService {

    private final UserRepository userRepository;
    private final PracticeSessionRepository sessionRepository;
    private final UserLessonProgressRepository progressRepository;
    private final UserWordRepository userWordRepository;

    public DashboardResponse getDashboard(UUID userId) {
        User user = userRepository.findById(userId).orElseThrow();

        long completed = progressRepository.countCompletedByUserId(userId);
        long totalSessions = sessionRepository.countByUserId(userId);
        Double recentAccuracy = sessionRepository.avgAccuracySince(userId, LocalDateTime.now().minusDays(7));
        long wordsDue = userWordRepository.countDueForReview(userId, LocalDateTime.now());
        long totalWords = userWordRepository.countByUserId(userId);
        long todaySessions = sessionRepository.countTodaySessions(userId, LocalDateTime.now().toLocalDate().atStartOfDay());

        List<PracticeSession> recent = sessionRepository.findByUserIdOrderByCreatedAtDesc(
                userId, PageRequest.of(0, 5)).getContent();

        List<DashboardResponse.RecentSessionDto> recentDtos = recent.stream()
                .map(s -> DashboardResponse.RecentSessionDto.builder()
                        .mode(s.getMode().name())
                        .score(s.getScore())
                        .createdAt(s.getCreatedAt().toString())
                        .build())
                .collect(Collectors.toList());

        return DashboardResponse.builder()
                .streakCount(user.getStreakCount())
                .lessonsCompleted(completed)
                .totalSessions(totalSessions)
                .recentAccuracy(recentAccuracy)
                .wordsDueForReview(wordsDue)
                .totalWordsLearned(totalWords)
                .recentSessions(recentDtos)
                .todaySessionCount(todaySessions)
                .build();
    }

    public AnalyticsResponse getAnalytics(UUID userId, int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        List<PracticeSession> sessions = sessionRepository
                .findByUserIdAndCreatedAtAfterOrderByCreatedAtAsc(userId, since);

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        Map<String, List<PracticeSession>> byDay = sessions.stream()
                .collect(Collectors.groupingBy(s -> s.getCreatedAt().format(fmt)));

        List<AnalyticsResponse.DailyStatDto> dailyStats = new ArrayList<>();
        byDay.forEach((date, daySessions) -> {
            double avgAccuracy = daySessions.stream()
                    .filter(s -> s.getAccuracyPercent() != null)
                    .mapToDouble(PracticeSession::getAccuracyPercent)
                    .average().orElse(0.0);

            dailyStats.add(AnalyticsResponse.DailyStatDto.builder()
                    .date(date)
                    .accuracy(Math.round(avgAccuracy * 10.0) / 10.0)
                    .sessions(daySessions.size())
                    .timeSeconds(0)
                    .build());
        });

        dailyStats.sort((a, b) -> a.getDate().compareTo(b.getDate()));

        double overall = sessions.stream()
                .filter(s -> s.getAccuracyPercent() != null)
                .mapToDouble(PracticeSession::getAccuracyPercent)
                .average().orElse(0.0);

        return AnalyticsResponse.builder()
                .dailyStats(dailyStats)
                .overallAccuracy(Math.round(overall * 10.0) / 10.0)
                .totalSessions(sessions.size())
                .totalTimeSeconds(0)
                .build();
    }
}
