package com.shadowling.controller;

import com.shadowling.dto.ApiResponse;
import com.shadowling.dto.speech.PronunciationScoreResponse;
import com.shadowling.model.RecordingUpload;
import com.shadowling.model.User;
import com.shadowling.repository.RecordingUploadRepository;
import com.shadowling.repository.UserRepository;
import com.shadowling.service.SpeechService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/speech")
@RequiredArgsConstructor
public class SpeechController {

    private final SpeechService speechService;
    private final RecordingUploadRepository recordingUploadRepository;
    private final UserRepository userRepository;

    @PostMapping("/transcribe")
    public ResponseEntity<ApiResponse<String>> transcribe(
            @RequestParam("audio") MultipartFile audio) {
        return ResponseEntity.ok(ApiResponse.ok(speechService.transcribe(audio)));
    }

    @PostMapping("/score")
    public ResponseEntity<ApiResponse<PronunciationScoreResponse>> score(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("audio") MultipartFile audio,
            @RequestParam("referenceText") String referenceText) {

        PronunciationScoreResponse result = speechService.score(audio, referenceText);

        // Track recording metadata (binary not stored without cloud storage)
        try {
            UUID userId = userRepository.findByEmail(userDetails.getUsername())
                    .map(User::getId).orElseThrow();
            recordingUploadRepository.save(RecordingUpload.builder()
                    .userId(userId)
                    .filename(audio.getOriginalFilename() != null ? audio.getOriginalFilename() : "recording.webm")
                    .contentType(audio.getContentType())
                    .sizeBytes(audio.getSize())
                    .build());
        } catch (Exception e) {
            log.warn("Failed to track recording upload: {}", e.getMessage());
        }

        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
