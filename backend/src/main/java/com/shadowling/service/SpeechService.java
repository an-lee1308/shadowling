package com.shadowling.service;

import com.shadowling.dto.practice.DictationScoreResponse;
import com.shadowling.dto.speech.PronunciationScoreResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SpeechService {

    private final LevenshteinService levenshteinService;
    private final RestTemplate restTemplate;

    @Value("${openai.api-key:}")
    private String openaiApiKey;

    @Value("${openai.whisper-url}")
    private String whisperUrl;

    public String transcribe(MultipartFile audioFile) {
        if (!StringUtils.hasText(openaiApiKey)) {
            log.warn("OpenAI API key not configured, skipping transcription");
            return "";
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            headers.setBearerAuth(openaiApiKey);

            String filename = StringUtils.hasText(audioFile.getOriginalFilename())
                    ? audioFile.getOriginalFilename() : "audio.webm";

            ByteArrayResource fileResource = new ByteArrayResource(audioFile.getBytes()) {
                @Override
                public String getFilename() {
                    return filename;
                }
            };

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", fileResource);
            body.add("model", "whisper-1");
            body.add("language", "en");

            HttpEntity<MultiValueMap<String, Object>> entity = new HttpEntity<>(body, headers);

            @SuppressWarnings("unchecked")
            ResponseEntity<Map<String, Object>> response =
                    restTemplate.postForEntity(whisperUrl, entity, (Class<Map<String, Object>>) (Class<?>) Map.class);

            Map<String, Object> responseBody = response.getBody();
            return responseBody != null ? (String) responseBody.getOrDefault("text", "") : "";

        } catch (Exception e) {
            log.error("Whisper transcription failed: {}", e.getMessage());
            return "";
        }
    }

    public PronunciationScoreResponse score(MultipartFile audioFile, String referenceText) {
        String transcript = transcribe(audioFile);

        if (!StringUtils.hasText(transcript)) {
            return PronunciationScoreResponse.builder()
                    .transcript("")
                    .overallScore(0.0)
                    .accuracyScore(0.0)
                    .fluencyScore(0.0)
                    .correctWords(0)
                    .totalWords(referenceText.trim().split("\\s+").length)
                    .wordScores(List.of())
                    .build();
        }

        DictationScoreResponse comparison = levenshteinService.compare(referenceText, transcript);

        List<PronunciationScoreResponse.WordScore> wordScores = comparison.getWordResults()
                .stream()
                .map(w -> PronunciationScoreResponse.WordScore.builder()
                        .word(w.getExpected())
                        .recognized(w.getGot())
                        .correct(w.isCorrect())
                        .score(w.isCorrect() ? 100.0 : computePartialScore(w.getExpected(), w.getGot()))
                        .build())
                .collect(Collectors.toList());

        double accuracy = comparison.getAccuracyPercent();
        double fluency = estimateFluency(transcript, referenceText);

        return PronunciationScoreResponse.builder()
                .transcript(transcript)
                .overallScore(Math.round((accuracy * 0.7 + fluency * 0.3) * 10.0) / 10.0)
                .accuracyScore(Math.round(accuracy * 10.0) / 10.0)
                .fluencyScore(Math.round(fluency * 10.0) / 10.0)
                .correctWords(comparison.getCorrectWords())
                .totalWords(comparison.getTotalWords())
                .wordScores(wordScores)
                .build();
    }

    private double computePartialScore(String expected, String got) {
        if (!StringUtils.hasText(got)) return 0.0;
        int dist = LevenshteinService.levenshtein(expected.toLowerCase(), got.toLowerCase());
        int maxLen = Math.max(expected.length(), got.length());
        return maxLen > 0 ? Math.max(0, (1.0 - (double) dist / maxLen) * 100.0) : 0.0;
    }

    private double estimateFluency(String transcript, String reference) {
        String[] transcriptWords = transcript.trim().split("\\s+");
        String[] referenceWords = reference.trim().split("\\s+");
        if (referenceWords.length == 0) return 0.0;
        double ratio = (double) transcriptWords.length / referenceWords.length;
        return Math.min(100.0, ratio * 100.0);
    }
}
