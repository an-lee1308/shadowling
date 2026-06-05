package com.shadowling.repository;

import com.shadowling.model.UserLessonProgress;
import com.shadowling.model.enums.PracticeMode;
import com.shadowling.model.enums.ProgressStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserLessonProgressRepository extends JpaRepository<UserLessonProgress, UUID> {

    Optional<UserLessonProgress> findByUserIdAndLessonIdAndMode(UUID userId, UUID lessonId, PracticeMode mode);

    List<UserLessonProgress> findByUserId(UUID userId);

    List<UserLessonProgress> findByUserIdAndStatus(UUID userId, ProgressStatus status);

    @Query("SELECT COUNT(p) FROM UserLessonProgress p WHERE p.userId = :userId AND p.status = 'COMPLETED'")
    long countCompletedByUserId(@Param("userId") UUID userId);
}
