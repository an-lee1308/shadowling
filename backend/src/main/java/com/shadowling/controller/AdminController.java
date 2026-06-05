package com.shadowling.controller;

import com.shadowling.dto.ApiResponse;
import com.shadowling.dto.admin.CreateLessonRequest;
import com.shadowling.dto.lesson.LessonDto;
import com.shadowling.model.Lesson;
import com.shadowling.model.User;
import com.shadowling.repository.LessonRepository;
import com.shadowling.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final LessonRepository lessonRepository;
    private final UserRepository userRepository;

    @PostMapping("/lessons")
    public ResponseEntity<ApiResponse<LessonDto>> createLesson(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateLessonRequest req) {

        requireAdmin(userDetails.getUsername());

        Lesson lesson = Lesson.builder()
                .title(req.getTitle())
                .description(req.getDescription())
                .audioUrl(req.getAudioUrl())
                .videoUrl(req.getVideoUrl())
                .thumbnailUrl(req.getThumbnailUrl())
                .transcript(req.getTranscript())
                .level(req.getLevel())
                .topic(req.getTopic())
                .durationSeconds(req.getDurationSeconds())
                .build();

        lesson = lessonRepository.save(lesson);

        LessonDto dto = LessonDto.builder()
                .id(lesson.getId())
                .title(lesson.getTitle())
                .description(lesson.getDescription())
                .audioUrl(lesson.getAudioUrl())
                .videoUrl(lesson.getVideoUrl())
                .thumbnailUrl(lesson.getThumbnailUrl())
                .transcript(lesson.getTranscript())
                .level(lesson.getLevel())
                .topic(lesson.getTopic())
                .durationSeconds(lesson.getDurationSeconds())
                .publishedAt(lesson.getPublishedAt())
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Bài học đã được tạo", dto));
    }

    @PutMapping("/lessons/{id}")
    public ResponseEntity<ApiResponse<Void>> updateLesson(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id,
            @RequestBody CreateLessonRequest req) {

        requireAdmin(userDetails.getUsername());

        Lesson lesson = lessonRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Lesson not found"));

        if (req.getTitle() != null) lesson.setTitle(req.getTitle());
        if (req.getDescription() != null) lesson.setDescription(req.getDescription());
        if (req.getAudioUrl() != null) lesson.setAudioUrl(req.getAudioUrl());
        if (req.getVideoUrl() != null) lesson.setVideoUrl(req.getVideoUrl());
        if (req.getThumbnailUrl() != null) lesson.setThumbnailUrl(req.getThumbnailUrl());
        if (req.getTranscript() != null) lesson.setTranscript(req.getTranscript());
        if (req.getLevel() != null) lesson.setLevel(req.getLevel());
        if (req.getTopic() != null) lesson.setTopic(req.getTopic());
        if (req.getDurationSeconds() != null) lesson.setDurationSeconds(req.getDurationSeconds());

        lessonRepository.save(lesson);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật thành công", null));
    }

    @DeleteMapping("/lessons/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteLesson(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id) {

        requireAdmin(userDetails.getUsername());
        lessonRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok("Đã xoá", null));
    }

    private void requireAdmin(String email) {
        User user = userRepository.findByEmail(email).orElseThrow();
        if (!"ADMIN".equals(user.getRole())) {
            throw new org.springframework.security.access.AccessDeniedException("Admin only");
        }
    }
}
