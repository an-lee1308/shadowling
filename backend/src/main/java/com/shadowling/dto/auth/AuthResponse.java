package com.shadowling.dto.auth;

import com.shadowling.model.enums.UserGoal;
import com.shadowling.model.enums.UserLevel;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class AuthResponse {
    private String token;
    private UUID id;
    private String email;
    private String name;
    private String avatar;
    private UserLevel level;
    private UserGoal goal;
    private int streakCount;
    private int totalXp;
    private String role;
    private int dailyGoalMinutes;
}
