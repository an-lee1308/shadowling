package com.shadowling.dto.gamification;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class AchievementDto {
    private UUID id;
    private String code;
    private String name;
    private String description;
    private String icon;
    private int xpReward;
    private boolean earned;
    private LocalDateTime earnedAt;
}
