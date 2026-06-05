package com.shadowling.model;

import com.shadowling.model.enums.PracticeMode;
import com.shadowling.model.enums.ProgressStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "user_lesson_progress",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "lesson_id", "mode"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserLessonProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "lesson_id", nullable = false)
    private UUID lessonId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PracticeMode mode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ProgressStatus status = ProgressStatus.NOT_STARTED;

    @Column(name = "best_score", nullable = false)
    @Builder.Default
    private double bestScore = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private int attempts = 0;

    @Column(name = "time_spent_seconds", nullable = false)
    @Builder.Default
    private int timeSpentSeconds = 0;

    @Column(name = "last_practiced_at")
    private LocalDateTime lastPracticedAt;
}
