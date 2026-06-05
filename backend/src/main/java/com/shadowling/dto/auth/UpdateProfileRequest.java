package com.shadowling.dto.auth;

import com.shadowling.model.enums.UserGoal;
import com.shadowling.model.enums.UserLevel;
import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String name;
    private String avatar;
    private UserLevel level;
    private UserGoal goal;
    private Integer dailyGoalMinutes;
    private String pushSubscription;
}
