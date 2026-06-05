package com.shadowling.controller;

import com.shadowling.dto.ApiResponse;
import com.shadowling.dto.speech.PronunciationScoreResponse;
import com.shadowling.service.SpeechService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/speech")
@RequiredArgsConstructor
public class SpeechController {

    private final SpeechService speechService;

    @PostMapping("/transcribe")
    public ResponseEntity<ApiResponse<String>> transcribe(
            @RequestParam("audio") MultipartFile audio) {
        String transcript = speechService.transcribe(audio);
        return ResponseEntity.ok(ApiResponse.ok(transcript));
    }

    @PostMapping("/score")
    public ResponseEntity<ApiResponse<PronunciationScoreResponse>> score(
            @RequestParam("audio") MultipartFile audio,
            @RequestParam("referenceText") String referenceText) {
        PronunciationScoreResponse result = speechService.score(audio, referenceText);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
