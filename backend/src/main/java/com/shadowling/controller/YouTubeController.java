package com.shadowling.controller;

import com.shadowling.dto.ApiResponse;
import com.shadowling.dto.youtube.*;
import com.shadowling.model.User;
import com.shadowling.repository.UserRepository;
import com.shadowling.service.YouTubeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/youtube")
@RequiredArgsConstructor
public class YouTubeController {

    private final YouTubeService youTubeService;
    private final UserRepository userRepository;

    @PostMapping("/lessons")
    public ResponseEntity<ApiResponse<YouTubeLessonDto>> addLesson(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateYoutubeLessonRequest request) {
        UUID userId = resolveUserId(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(youTubeService.createLesson(userId, request.getUrl())));
    }

    @GetMapping("/lessons")
    public ResponseEntity<ApiResponse<List<YouTubeLessonDto>>> getLessons(
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = resolveUserId(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(youTubeService.getUserLessons(userId)));
    }

    @GetMapping("/lessons/{id}")
    public ResponseEntity<ApiResponse<YouTubeLessonDto>> getLesson(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id) {
        UUID userId = resolveUserId(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(youTubeService.getLessonById(userId, id)));
    }

    @DeleteMapping("/lessons/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteLesson(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id) {
        UUID userId = resolveUserId(userDetails.getUsername());
        youTubeService.deleteLesson(userId, id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PutMapping("/lessons/{id}/progress")
    public ResponseEntity<ApiResponse<SentenceProgressDto>> updateProgress(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateSentenceProgressRequest request) {
        UUID userId = resolveUserId(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(youTubeService.updateSentenceProgress(userId, id, request)));
    }

    private UUID resolveUserId(String email) {
        return userRepository.findByEmail(email).map(User::getId).orElseThrow();
    }
}
