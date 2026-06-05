package com.shadowling.dto.gamification;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class LeaderboardEntryDto {
    private int rank;
    private UUID userId;
    private String name;
    private String avatar;
    private int totalXp;
    private int streakCount;
    private String level;
}
