package com.shadowling.controller;

import com.shadowling.dto.ApiResponse;
import com.shadowling.dto.lesson.LessonDto;
import com.shadowling.model.User;
import com.shadowling.repository.UserRepository;
import com.shadowling.service.LessonService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/lessons")
@RequiredArgsConstructor
public class LessonController {

    private final LessonService lessonService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<LessonDto>>> list(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String topic,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "newest") String sort) {

        UUID userId = resolveUserId(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(lessonService.list(level, topic, page, size, sort, userId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<LessonDto>> getById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id) {

        UUID userId = resolveUserId(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(lessonService.getById(id, userId)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<LessonDto>>> search(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        UUID userId = resolveUserId(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(lessonService.search(q, page, size, userId)));
    }

    private UUID resolveUserId(String email) {
        return userRepository.findByEmail(email).map(User::getId).orElseThrow();
    }
}
