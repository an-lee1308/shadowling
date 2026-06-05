package com.shadowling.controller;

import com.shadowling.dto.ApiResponse;
import com.shadowling.dto.word.*;
import com.shadowling.model.User;
import com.shadowling.repository.UserRepository;
import com.shadowling.service.WordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/words")
@RequiredArgsConstructor
public class WordController {

    private final WordService wordService;
    private final UserRepository userRepository;

    @GetMapping("/lesson/{lessonId}")
    public ResponseEntity<ApiResponse<List<WordDto>>> getForLesson(@PathVariable UUID lessonId) {
        return ResponseEntity.ok(ApiResponse.ok(wordService.getForLesson(lessonId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<WordDto>> save(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody SaveWordRequest request) {

        UUID userId = resolveUserId(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(wordService.save(userId, request)));
    }

    @GetMapping("/due")
    public ResponseEntity<ApiResponse<List<WordDto>>> getDueToday(
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID userId = resolveUserId(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(wordService.getDueToday(userId)));
    }

    @PostMapping("/sessions/start")
    public ResponseEntity<ApiResponse<StartSessionResponse>> startSession(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody StartSessionRequest request) {

        UUID userId = resolveUserId(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(wordService.startSession(userId, request)));
    }

    @PostMapping("/sessions/{sessionId}/end")
    public ResponseEntity<ApiResponse<SessionResultDto>> endSession(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID sessionId) {

        UUID userId = resolveUserId(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(wordService.endSession(userId, sessionId)));
    }

    @PostMapping("/{wordId}/review")
    public ResponseEntity<ApiResponse<WordDto>> review(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID wordId,
            @Valid @RequestBody ReviewWordRequest request) {

        UUID userId = resolveUserId(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(wordService.review(userId, wordId, request)));
    }

    @GetMapping("/weak")
    public ResponseEntity<ApiResponse<List<WordDto>>> getWeakWords(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "5") int limit) {

        UUID userId = resolveUserId(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(wordService.getWeakWords(userId, Math.min(limit, 20))));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<WordDto>>> list(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        UUID userId = resolveUserId(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(wordService.list(userId, page, size)));
    }

    private UUID resolveUserId(String email) {
        return userRepository.findByEmail(email).map(User::getId).orElseThrow();
    }
}
