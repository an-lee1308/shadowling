package com.shadowling.repository;

import com.shadowling.model.WordReviewSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface WordReviewSessionRepository extends JpaRepository<WordReviewSession, UUID> {
}
