package com.shadowling.repository;

import com.shadowling.model.YouTubeSentenceProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface YouTubeSentenceProgressRepository extends JpaRepository<YouTubeSentenceProgress, UUID> {
    List<YouTubeSentenceProgress> findByYoutubeLessonId(UUID youtubeLessonId);
    Optional<YouTubeSentenceProgress> findByYoutubeLessonIdAndSentenceIndex(UUID youtubeLessonId, int sentenceIndex);
}
