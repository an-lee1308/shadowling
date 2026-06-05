package com.shadowling.controller;

import com.shadowling.dto.ApiResponse;
import com.shadowling.dto.lesson.LessonDto;
import com.shadowling.model.User;
import com.shadowling.repository.UserRepository;
import com.shadowling.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final UserRepository userRepository;

    @GetMapping("/continue")
    public ResponseEntity<ApiResponse<List<LessonDto>>> getContinueLessons(
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = resolveUserId(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(recommendationService.getContinueLessons(userId)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<LessonDto>>> getRecommended(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "6") int limit) {
        UUID userId = resolveUserId(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(recommendationService.getRecommended(userId, Math.min(limit, 20))));
    }

    private UUID resolveUserId(String email) {
        return userRepository.findByEmail(email).map(User::getId).orElseThrow();
    }
}
