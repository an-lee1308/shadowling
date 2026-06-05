package com.shadowling.repository;

import com.shadowling.model.Lesson;
import com.shadowling.model.enums.UserLevel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, UUID> {

    Page<Lesson> findByLevel(UserLevel level, Pageable pageable);

    Page<Lesson> findByTopic(String topic, Pageable pageable);

    Page<Lesson> findByLevelAndTopic(UserLevel level, String topic, Pageable pageable);

    @Query("SELECT l FROM Lesson l WHERE " +
           "LOWER(l.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(l.description) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<Lesson> search(@Param("query") String query, Pageable pageable);
}
