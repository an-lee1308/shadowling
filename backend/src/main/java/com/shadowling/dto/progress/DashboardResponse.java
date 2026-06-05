package com.shadowling.dto.progress;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class DashboardResponse {
    private int streakCount;
    private long lessonsCompleted;
    private long totalSessions;
    private Double recentAccuracy;
    private long wordsDueForReview;
    private long totalWordsLearned;
    private List<RecentSessionDto> recentSessions;
    private long todaySessionCount;

    @Data
    @Builder
    public static class RecentSessionDto {
        private String lessonTitle;
        private String mode;
        private Double score;
        private String createdAt;
    }
}
