package com.shadowling.service;

import com.shadowling.dto.gamification.AchievementDto;
import com.shadowling.dto.gamification.LeaderboardEntryDto;
import com.shadowling.dto.gamification.XpStatusResponse;
import com.shadowling.model.Achievement;
import com.shadowling.model.User;
import com.shadowling.model.UserAchievement;
import com.shadowling.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Slf4j
@Service
@RequiredArgsConstructor
public class GamificationService {

    private final UserRepository userRepository;
    private final AchievementRepository achievementRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final UserLessonProgressRepository progressRepository;
    private final UserWordRepository userWordRepository;
    private final PracticeSessionRepository practiceSessionRepository;

    private static final int[] LEVEL_THRESHOLDS = {0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 10000};
    private static final String[] LEVEL_NAMES = {
        "Newbie", "Beginner", "Elementary", "Pre-Intermediate",
        "Intermediate", "Upper-Intermediate", "Advanced", "Expert", "Master", "Legend"
    };

    @Transactional
    public List<AchievementDto> awardXpAndCheck(UUID userId, int xpAmount, String reason) {
        User user = userRepository.findById(userId).orElseThrow();
        user.setTotalXp(user.getTotalXp() + xpAmount);
        userRepository.save(user);

        return checkAndGrantAchievements(userId);
    }

    @Transactional
    public List<AchievementDto> checkAndGrantAchievements(UUID userId) {
        List<AchievementDto> newlyEarned = new ArrayList<>();
        User user = userRepository.findById(userId).orElseThrow();

        long completedLessons = progressRepository.countCompletedByUserId(userId);
        long totalWords = userWordRepository.countByUserId(userId);
        long shadowingSessions = practiceSessionRepository.countShadowingByUserId(userId);

        tryAward(userId, "FIRST_LESSON", completedLessons >= 1, newlyEarned);
        tryAward(userId, "LESSONS_10", completedLessons >= 10, newlyEarned);
        tryAward(userId, "LESSONS_50", completedLessons >= 50, newlyEarned);
        tryAward(userId, "STREAK_3", user.getStreakCount() >= 3, newlyEarned);
        tryAward(userId, "STREAK_7", user.getStreakCount() >= 7, newlyEarned);
        tryAward(userId, "STREAK_30", user.getStreakCount() >= 30, newlyEarned);
        tryAward(userId, "WORDS_10", totalWords >= 10, newlyEarned);
        tryAward(userId, "WORDS_50", totalWords >= 50, newlyEarned);
        tryAward(userId, "WORDS_200", totalWords >= 200, newlyEarned);
        tryAward(userId, "SHADOWING_FIRST", shadowingSessions >= 1, newlyEarned);

        if (!newlyEarned.isEmpty()) {
            int bonusXp = newlyEarned.stream().mapToInt(AchievementDto::getXpReward).sum();
            if (bonusXp > 0) {
                user.setTotalXp(user.getTotalXp() + bonusXp);
                userRepository.save(user);
            }
        }

        return newlyEarned;
    }

    @Transactional
    public void grantPerfectDictation(UUID userId) {
        List<AchievementDto> earned = new ArrayList<>();
        tryAward(userId, "PERFECT_DICTATION", true, earned);
        if (!earned.isEmpty()) {
            User user = userRepository.findById(userId).orElseThrow();
            user.setTotalXp(user.getTotalXp() + earned.stream().mapToInt(AchievementDto::getXpReward).sum());
            userRepository.save(user);
        }
    }

    public XpStatusResponse getXpStatus(UUID userId) {
        User user = userRepository.findById(userId).orElseThrow();
        int xp = user.getTotalXp();
        int level = computeLevel(xp);
        int currentLevelXp = level > 0 ? LEVEL_THRESHOLDS[Math.min(level, LEVEL_THRESHOLDS.length - 1)] : 0;
        int nextLevelXp = level < LEVEL_THRESHOLDS.length - 1
                ? LEVEL_THRESHOLDS[level + 1] : LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];

        List<Achievement> allAchievements = achievementRepository.findAll();
        List<UserAchievement> earned = userAchievementRepository.findByUserId(userId);

        List<AchievementDto> dtos = allAchievements.stream().map(a -> {
            UserAchievement ua = earned.stream()
                    .filter(e -> e.getAchievementId().equals(a.getId()))
                    .findFirst().orElse(null);
            return AchievementDto.builder()
                    .id(a.getId())
                    .code(a.getCode())
                    .name(a.getName())
                    .description(a.getDescription())
                    .icon(a.getIcon())
                    .xpReward(a.getXpReward())
                    .earned(ua != null)
                    .earnedAt(ua != null ? ua.getEarnedAt() : null)
                    .build();
        }).collect(Collectors.toList());

        return XpStatusResponse.builder()
                .totalXp(xp)
                .level(level)
                .levelName(LEVEL_NAMES[Math.min(level, LEVEL_NAMES.length - 1)])
                .currentLevelXp(currentLevelXp)
                .nextLevelXp(nextLevelXp)
                .achievements(dtos)
                .build();
    }

    public List<LeaderboardEntryDto> getLeaderboard(int limit) {
        List<User> top = userRepository.findTopByTotalXp(PageRequest.of(0, limit));
        return IntStream.range(0, top.size())
                .mapToObj(i -> {
                    User u = top.get(i);
                    return LeaderboardEntryDto.builder()
                            .rank(i + 1)
                            .userId(u.getId())
                            .name(u.getName())
                            .avatar(u.getAvatar())
                            .totalXp(u.getTotalXp())
                            .streakCount(u.getStreakCount())
                            .level(u.getLevel().name())
                            .build();
                })
                .collect(Collectors.toList());
    }

    private void tryAward(UUID userId, String code, boolean condition, List<AchievementDto> newlyEarned) {
        if (!condition) return;
        achievementRepository.findByCode(code).ifPresent(achievement -> {
            boolean alreadyHas = userAchievementRepository
                    .existsByUserIdAndAchievementId(userId, achievement.getId());
            if (!alreadyHas) {
                userAchievementRepository.save(UserAchievement.builder()
                        .userId(userId)
                        .achievementId(achievement.getId())
                        .build());
                newlyEarned.add(AchievementDto.builder()
                        .id(achievement.getId())
                        .code(achievement.getCode())
                        .name(achievement.getName())
                        .description(achievement.getDescription())
                        .icon(achievement.getIcon())
                        .xpReward(achievement.getXpReward())
                        .earned(true)
                        .build());
            }
        });
    }

    private int computeLevel(int xp) {
        for (int i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
            if (xp >= LEVEL_THRESHOLDS[i]) return i;
        }
        return 0;
    }
}
