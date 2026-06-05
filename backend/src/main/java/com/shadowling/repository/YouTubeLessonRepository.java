package com.shadowling.repository;

import com.shadowling.model.YouTubeLesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface YouTubeLessonRepository extends JpaRepository<YouTubeLesson, UUID> {
    @Query("SELECT l FROM YouTubeLesson l WHERE l.user.id = :userId ORDER BY l.createdAt DESC")
    List<YouTubeLesson> findByUserIdOrderByCreatedAtDesc(@Param("userId") UUID userId);

    @Query("SELECT l FROM YouTubeLesson l WHERE l.user.id = :userId AND l.youtubeVideoId = :videoId")
    Optional<YouTubeLesson> findByUserIdAndYoutubeVideoId(@Param("userId") UUID userId, @Param("videoId") String videoId);

    @Query("SELECT l FROM YouTubeLesson l WHERE l.id = :id AND l.user.id = :userId")
    Optional<YouTubeLesson> findByIdAndUserId(@Param("id") UUID id, @Param("userId") UUID userId);
}
