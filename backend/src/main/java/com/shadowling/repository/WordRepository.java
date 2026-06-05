package com.shadowling.repository;

import com.shadowling.model.Word;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WordRepository extends JpaRepository<Word, UUID> {

    Optional<Word> findByText(String text);

    @Query(value = "SELECT w.* FROM words w JOIN lesson_words lw ON w.id = lw.word_id WHERE lw.lesson_id = :lessonId", nativeQuery = true)
    List<Word> findByLessonId(@Param("lessonId") UUID lessonId);
}
