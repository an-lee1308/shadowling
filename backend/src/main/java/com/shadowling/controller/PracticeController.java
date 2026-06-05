package com.shadowling.controller;

import com.shadowling.dto.ApiResponse;
import com.shadowling.dto.practice.*;
import com.shadowling.model.User;
import com.shadowling.repository.UserRepository;
import com.shadowling.service.LevenshteinService;
import com.shadowling.service.PracticeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/practice")
@RequiredArgsConstructor
public class PracticeController {

    private final PracticeService practiceService;
    private final LevenshteinService levenshteinService;
    private final UserRepository userRepository;

    @PostMapping("/dictation")
    public ResponseEntity<ApiResponse<PracticeSessionDto>> saveDictation(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody SaveDictationRequest request) {

        UUID userId = resolveUserId(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(practiceService.saveDictation(userId, request)));
    }

    @PostMapping("/shadowing")
    public ResponseEntity<ApiResponse<PracticeSessionDto>> saveShadowing(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody SaveShadowingRequest request) {

        UUID userId = resolveUserId(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(practiceService.saveShadowing(userId, request)));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<PracticeSessionDto>>> getHistory(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        UUID userId = resolveUserId(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(practiceService.getHistory(userId, page, size)));
    }

    @GetMapping("/history/{lessonId}")
    public ResponseEntity<ApiResponse<List<PracticeSessionDto>>> getHistoryByLesson(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID lessonId) {

        UUID userId = resolveUserId(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(practiceService.getHistoryByLesson(userId, lessonId)));
    }

    @PostMapping("/score/dictation")
    public ResponseEntity<ApiResponse<DictationScoreResponse>> scoreDictation(
            @Valid @RequestBody DictationScoreRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(levenshteinService.compare(request.getExpected(), request.getActual())));
    }

    private UUID resolveUserId(String email) {
        return userRepository.findByEmail(email).map(User::getId).orElseThrow();
    }
}
