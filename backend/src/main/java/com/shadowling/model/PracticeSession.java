package com.shadowling.model;

import com.shadowling.model.enums.PracticeMode;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "practice_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PracticeSession {

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

    private Double score;

    @Column(name = "accuracy_percent")
    private Double accuracyPercent;

    @Column(name = "recording_url")
    private String recordingUrl;

    @Column(columnDefinition = "TEXT")
    private String errors;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
