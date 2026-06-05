package com.shadowling.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "user_words",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "word_id"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserWord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "word_id", nullable = false)
    private UUID wordId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "word_id", insertable = false, updatable = false)
    private Word word;

    @Column(name = "ease_factor", nullable = false)
    @Builder.Default
    private double easeFactor = 2.5;

    @Column(name = "interval_days", nullable = false)
    @Builder.Default
    private int intervalDays = 1;

    @Column(nullable = false)
    @Builder.Default
    private int repetitions = 0;

    @Column(name = "next_review_at", nullable = false)
    @Builder.Default
    private LocalDateTime nextReviewAt = LocalDateTime.now();

    @Column(name = "last_reviewed_at")
    private LocalDateTime lastReviewedAt;

    @Column(name = "again_count", nullable = false)
    @Builder.Default
    private int againCount = 0;

    @Column(nullable = false)
    @Builder.Default
    private boolean leech = false;

    @Column(nullable = false)
    @Builder.Default
    private boolean suspended = false;
}
