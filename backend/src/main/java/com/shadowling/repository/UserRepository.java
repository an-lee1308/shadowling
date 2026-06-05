package com.shadowling.repository;

import com.shadowling.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u ORDER BY u.totalXp DESC")
    java.util.List<User> findTopByTotalXp(org.springframework.data.domain.Pageable pageable);
}
