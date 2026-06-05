package com.shadowling.dto.gamification;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class XpStatusResponse {
    private int totalXp;
    private int currentLevelXp;
    private int nextLevelXp;
    private int level;
    private String levelName;
    private List<AchievementDto> achievements;
    private List<AchievementDto> newAchievements;
}
