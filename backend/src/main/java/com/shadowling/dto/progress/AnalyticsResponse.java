package com.shadowling.dto.progress;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AnalyticsResponse {
    private List<DailyStatDto> dailyStats;
    private double overallAccuracy;
    private long totalTimeSeconds;
    private long totalSessions;

    @Data
    @Builder
    public static class DailyStatDto {
        private String date;
        private double accuracy;
        private int sessions;
        private int timeSeconds;
    }
}
