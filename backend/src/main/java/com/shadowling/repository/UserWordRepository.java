package com.shadowling.repository;

import com.shadowling.model.UserWord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserWordRepository extends JpaRepository<UserWord, UUID> {

    Optional<UserWord> findByUserIdAndWordId(UUID userId, UUID wordId);

    Page<UserWord> findByUserId(UUID userId, Pageable pageable);

    List<UserWord> findAllByUserId(UUID userId);

    List<UserWord> findByUserIdAndNextReviewAtBefore(UUID userId, LocalDateTime now);

    List<UserWord> findByUserIdAndWordIdIn(UUID userId, Collection<UUID> wordIds);

    long countByUserId(UUID userId);

    @Query("SELECT COUNT(uw) FROM UserWord uw WHERE uw.userId = :userId AND uw.nextReviewAt <= :now")
    long countDueForReview(@Param("userId") UUID userId, @Param("now") LocalDateTime now);

    @Query("SELECT uw FROM UserWord uw WHERE uw.userId = :userId AND uw.repetitions > 0 ORDER BY uw.easeFactor ASC")
    List<UserWord> findWeakestWords(@Param("userId") UUID userId, Pageable pageable);
}
