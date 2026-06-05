package com.shadowling.repository;

import com.shadowling.model.PracticeSession;
import com.shadowling.model.enums.PracticeMode;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface PracticeSessionRepository extends JpaRepository<PracticeSession, UUID> {

    Page<PracticeSession> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    List<PracticeSession> findByUserIdAndLessonId(UUID userId, UUID lessonId);

    List<PracticeSession> findByUserIdAndCreatedAtAfterOrderByCreatedAtAsc(UUID userId, LocalDateTime after);

    @Query("SELECT AVG(p.accuracyPercent) FROM PracticeSession p WHERE p.userId = :userId AND p.createdAt >= :since")
    Double avgAccuracySince(@Param("userId") UUID userId, @Param("since") LocalDateTime since);

    @Query("SELECT COUNT(DISTINCT p.lessonId) FROM PracticeSession p WHERE p.userId = :userId")
    long countDistinctLessons(@Param("userId") UUID userId);

    long countByUserId(UUID userId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(p) FROM PracticeSession p WHERE p.userId = :userId AND p.mode = com.shadowling.model.enums.PracticeMode.SHADOWING")
    long countShadowingByUserId(@org.springframework.data.repository.query.Param("userId") UUID userId);

    @Query("SELECT COUNT(p) FROM PracticeSession p WHERE p.userId = :userId AND p.createdAt >= :startOfDay")
    long countTodaySessions(@Param("userId") UUID userId, @Param("startOfDay") LocalDateTime startOfDay);
}
