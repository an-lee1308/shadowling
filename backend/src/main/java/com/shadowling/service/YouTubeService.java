package com.shadowling.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shadowling.dto.youtube.*;
import com.shadowling.model.User;
import com.shadowling.model.YouTubeLesson;
import com.shadowling.model.YouTubeSentenceProgress;
import com.shadowling.repository.UserRepository;
import com.shadowling.repository.YouTubeLessonRepository;
import com.shadowling.repository.YouTubeSentenceProgressRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class YouTubeService {

    private final YouTubeLessonRepository youtubeLessonRepository;
    private final YouTubeSentenceProgressRepository sentenceProgressRepository;
    private final UserRepository userRepository;
    private final GamificationService gamificationService;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    @Value("${openai.api-key:}")
    private String openaiApiKey;

    @Value("${openai.whisper-url}")
    private String whisperUrl;

    private static final int PASS_THRESHOLD = 70;
    private static final int XP_PER_SENTENCE = 10;

    @Transactional
    public YouTubeLessonDto createLesson(UUID userId, String url) {
        String videoId = extractVideoId(url);

        Optional<YouTubeLesson> existing = youtubeLessonRepository.findByUserIdAndYoutubeVideoId(userId, videoId);
        if (existing.isPresent()) {
            return toDto(existing.get());
        }

        String[] info = fetchVideoInfo(videoId);
        String title = info[0], thumbnailUrl = info[1], channelName = info[2];

        List<CaptionSegment> captions = null;
        try {
            captions = fetchCaptions(videoId);
        } catch (Exception e) {
            log.warn("Caption fetch failed for {}, falling back to Whisper: {}", videoId, e.getMessage());
        }

        if (captions == null || captions.isEmpty()) {
            log.info("No captions found for {}, generating via Whisper", videoId);
            captions = generateCaptionsViaWhisper(videoId);
        }

        User user = userRepository.findById(userId).orElseThrow();
        YouTubeLesson lesson = YouTubeLesson.builder()
                .user(user)
                .youtubeVideoId(videoId)
                .youtubeUrl(url)
                .title(title)
                .thumbnailUrl(thumbnailUrl)
                .channelName(channelName)
                .captions(serializeCaptions(captions))
                .totalSentences(captions.size())
                .build();

        return toDto(youtubeLessonRepository.save(lesson));
    }

    public List<YouTubeLessonDto> getUserLessons(UUID userId) {
        return youtubeLessonRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public YouTubeLessonDto getLessonById(UUID userId, UUID lessonId) {
        YouTubeLesson lesson = youtubeLessonRepository.findByIdAndUserId(lessonId, userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài học"));
        return toDto(lesson);
    }

    @Transactional
    public void deleteLesson(UUID userId, UUID lessonId) {
        YouTubeLesson lesson = youtubeLessonRepository.findByIdAndUserId(lessonId, userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài học"));
        youtubeLessonRepository.delete(lesson);
    }

    @Transactional
    public SentenceProgressDto updateSentenceProgress(UUID userId, UUID lessonId, UpdateSentenceProgressRequest req) {
        YouTubeLesson lesson = youtubeLessonRepository.findByIdAndUserId(lessonId, userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài học"));

        int score = (int) req.getScore();
        boolean passed = score >= PASS_THRESHOLD;

        YouTubeSentenceProgress progress = sentenceProgressRepository
                .findByYoutubeLessonIdAndSentenceIndex(lessonId, req.getSentenceIndex())
                .orElse(YouTubeSentenceProgress.builder()
                        .youtubeLesson(lesson)
                        .sentenceIndex(req.getSentenceIndex())
                        .bestScore(0)
                        .attemptCount(0)
                        .completed(false)
                        .build());

        boolean wasCompleted = progress.isCompleted();

        if (score > progress.getBestScore()) progress.setBestScore(score);
        progress.setAttemptCount(progress.getAttemptCount() + 1);
        if (passed) progress.setCompleted(true);
        progress.setUpdatedAt(LocalDateTime.now());

        progress = sentenceProgressRepository.save(progress);

        if (!wasCompleted && passed) {
            gamificationService.awardXpAndCheck(userId, XP_PER_SENTENCE, "youtube_sentence");
        }

        lesson.setLastPracticedAt(LocalDateTime.now());
        youtubeLessonRepository.save(lesson);

        return new SentenceProgressDto(
                progress.getSentenceIndex(),
                progress.getBestScore(),
                progress.getAttemptCount(),
                progress.isCompleted());
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    private YouTubeLessonDto toDto(YouTubeLesson lesson) {
        List<CaptionSegment> captions = deserializeCaptions(lesson.getCaptions());
        List<YouTubeSentenceProgress> progressList = sentenceProgressRepository.findByYoutubeLessonId(lesson.getId());

        List<SentenceProgressDto> progressDtos = progressList.stream()
                .map(p -> new SentenceProgressDto(p.getSentenceIndex(), p.getBestScore(), p.getAttemptCount(), p.isCompleted()))
                .collect(Collectors.toList());

        int completedCount = (int) progressList.stream().filter(YouTubeSentenceProgress::isCompleted).count();

        return new YouTubeLessonDto(
                lesson.getId(),
                lesson.getYoutubeVideoId(),
                lesson.getYoutubeUrl(),
                lesson.getTitle(),
                lesson.getThumbnailUrl(),
                lesson.getChannelName(),
                lesson.getDurationSeconds(),
                captions,
                lesson.getTotalSentences(),
                completedCount,
                lesson.getCreatedAt(),
                lesson.getLastPracticedAt(),
                progressDtos);
    }

    private String extractVideoId(String url) {
        Pattern p = Pattern.compile("(?:v=|youtu\\.be/|shorts/)([a-zA-Z0-9_-]{11})");
        Matcher m = p.matcher(url);
        if (m.find()) return m.group(1);
        throw new IllegalArgumentException("URL YouTube không hợp lệ. Hãy dán đúng link YouTube.");
    }

    // Returns [title, thumbnailUrl, channelName]
    private String[] fetchVideoInfo(String videoId) {
        String oembedUrl = "https://www.youtube.com/oembed?url="
                + URLEncoder.encode("https://www.youtube.com/watch?v=" + videoId, StandardCharsets.UTF_8)
                + "&format=json";
        try {
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(oembedUrl))
                    .header("User-Agent", "Mozilla/5.0")
                    .GET().build();
            HttpResponse<String> resp = client.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() != 200) throw new RuntimeException("oEmbed 404");
            JsonNode node = objectMapper.readTree(resp.body());
            return new String[]{
                node.path("title").asText("YouTube Video"),
                node.path("thumbnail_url").asText("https://img.youtube.com/vi/" + videoId + "/hqdefault.jpg"),
                node.path("author_name").asText("")
            };
        } catch (Exception e) {
            log.warn("oEmbed failed for {}: {}", videoId, e.getMessage());
            return new String[]{
                "YouTube Video",
                "https://img.youtube.com/vi/" + videoId + "/hqdefault.jpg",
                ""
            };
        }
    }

    private List<CaptionSegment> fetchCaptions(String videoId) throws Exception {
        HttpClient client = HttpClient.newBuilder()
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();

        // 1. Fetch watch page to extract caption URL
        HttpRequest pageReq = HttpRequest.newBuilder()
                .uri(URI.create("https://www.youtube.com/watch?v=" + videoId))
                .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36")
                .header("Accept-Language", "en-US,en;q=0.9")
                .header("Accept", "text/html,application/xhtml+xml")
                .GET().build();

        HttpResponse<String> pageResp = client.send(pageReq, HttpResponse.BodyHandlers.ofString());
        String html = pageResp.body();

        // 2. Find caption track base URL (prefer English, fall back to first found)
        Pattern urlPat = Pattern.compile("\"baseUrl\":\"(https://www\\.youtube\\.com/api/timedtext[^\"]+)\"");
        Matcher m = urlPat.matcher(html);

        String captionUrl = null;
        String fallback = null;
        while (m.find()) {
            String decoded = unescapeUrl(m.group(1));
            if (fallback == null) fallback = decoded;
            if (decoded.contains("lang=en")) {
                captionUrl = decoded;
                break;
            }
        }
        if (captionUrl == null) captionUrl = fallback;
        if (captionUrl == null) throw new RuntimeException("No captions found in page");

        // 3. Add json3 format
        if (!captionUrl.contains("fmt=")) {
            captionUrl += "&fmt=json3";
        } else {
            captionUrl = captionUrl.replaceAll("fmt=[^&]+", "fmt=json3");
        }

        HttpRequest captionReq = HttpRequest.newBuilder()
                .uri(URI.create(captionUrl))
                .header("User-Agent", "Mozilla/5.0")
                .GET().build();

        HttpResponse<String> captionResp = client.send(captionReq, HttpResponse.BodyHandlers.ofString());
        return parseJson3(captionResp.body());
    }

    private String unescapeUrl(String s) {
        return s.replace("\\u0026", "&")
                .replace("\\u003d", "=")
                .replace("\\u003D", "=")
                .replace("\\/", "/");
    }

    private List<CaptionSegment> parseJson3(String json) throws Exception {
        JsonNode root = objectMapper.readTree(json);
        JsonNode events = root.path("events");
        List<CaptionSegment> raw = new ArrayList<>();

        for (JsonNode event : events) {
            long startMs = event.path("tStartMs").asLong(0);
            long durationMs = event.path("dDurationMs").asLong(2000);
            JsonNode segs = event.path("segs");
            if (!segs.isArray()) continue;

            StringBuilder text = new StringBuilder();
            for (JsonNode seg : segs) {
                text.append(seg.path("utf8").asText(""));
            }
            String clean = text.toString().trim().replace("\n", " ").replaceAll("\\s+", " ");
            if (!clean.isEmpty()) {
                raw.add(new CaptionSegment(startMs, startMs + durationMs, clean));
            }
        }

        return mergeSegments(raw);
    }

    private List<CaptionSegment> mergeSegments(List<CaptionSegment> segments) {
        List<CaptionSegment> result = new ArrayList<>();
        CaptionSegment current = null;

        for (CaptionSegment seg : segments) {
            if (current == null) {
                current = seg;
                continue;
            }
            boolean endsWithPunct = current.text().matches(".*[.!?;]\\s*$");
            long gap = seg.startMs() - current.endMs();
            long currentDuration = current.endMs() - current.startMs();

            if (!endsWithPunct && gap < 600 && currentDuration < 8000) {
                current = new CaptionSegment(current.startMs(), seg.endMs(),
                        (current.text() + " " + seg.text()).trim());
            } else {
                result.add(current);
                current = seg;
            }
        }
        if (current != null) result.add(current);
        return result;
    }

    private String serializeCaptions(List<CaptionSegment> captions) {
        try {
            return objectMapper.writeValueAsString(captions);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }

    private List<CaptionSegment> deserializeCaptions(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, CaptionSegment.class));
        } catch (JsonProcessingException e) {
            return List.of();
        }
    }

    // ─── Whisper fallback ─────────────────────────────────────────────────────

    private List<CaptionSegment> generateCaptionsViaWhisper(String videoId) {
        if (!StringUtils.hasText(openaiApiKey)) {
            throw new RuntimeException("Video không có phụ đề và chưa cấu hình OpenAI API key.");
        }

        Path tempDir;
        try {
            tempDir = Files.createTempDirectory("yt_");
        } catch (Exception e) {
            throw new RuntimeException("Lỗi tạo thư mục tạm.");
        }

        Path audioFile = tempDir.resolve(videoId + ".mp3");
        String outputTemplate = tempDir.resolve(videoId + ".%(ext)s").toString();

        try {
            downloadAudio(videoId, outputTemplate, audioFile);
            byte[] audioBytes = Files.readAllBytes(audioFile);
            List<CaptionSegment> segments = callWhisper(audioBytes);
            if (segments.isEmpty()) {
                throw new RuntimeException("Không thể tạo phụ đề cho video này.");
            }
            return segments;
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi tạo phụ đề tự động: " + e.getMessage());
        } finally {
            try { Files.deleteIfExists(audioFile); } catch (Exception ignored) {}
            try { Files.deleteIfExists(tempDir); } catch (Exception ignored) {}
        }
    }

    private void downloadAudio(String videoId, String outputTemplate, Path expectedFile) throws Exception {
        String ytDlp = System.getProperty("os.name", "").toLowerCase().contains("win") ? "yt-dlp.exe" : "yt-dlp";
        ProcessBuilder pb = new ProcessBuilder(
                ytDlp,
                "--no-playlist",
                "-x", "--audio-format", "mp3",
                "--audio-quality", "5",
                "--max-filesize", "24m",
                "-o", outputTemplate,
                "https://www.youtube.com/watch?v=" + videoId
        );
        pb.redirectErrorStream(true);
        Process process = pb.start();
        String output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        int exitCode = process.waitFor();

        if (exitCode != 0 || !Files.exists(expectedFile)) {
            log.warn("yt-dlp failed (exit {}) for {}: {}", exitCode, videoId, output);
            throw new RuntimeException("Không thể tải audio từ video này. Hãy thử video khác.");
        }
    }

    private List<CaptionSegment> callWhisper(byte[] audioBytes) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.setBearerAuth(openaiApiKey);

        ByteArrayResource fileResource = new ByteArrayResource(audioBytes) {
            @Override public String getFilename() { return "audio.mp3"; }
        };

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", fileResource);
        body.add("model", "whisper-1");
        body.add("language", "en");
        body.add("response_format", "verbose_json");

        ResponseEntity<JsonNode> resp = restTemplate.postForEntity(
                whisperUrl, new HttpEntity<>(body, headers), JsonNode.class);

        JsonNode root = resp.getBody();
        if (root == null) return List.of();

        List<CaptionSegment> segments = new ArrayList<>();
        for (JsonNode seg : root.path("segments")) {
            long startMs = (long) (seg.path("start").asDouble() * 1000);
            long endMs = (long) (seg.path("end").asDouble() * 1000);
            String text = seg.path("text").asText("").trim();
            if (!text.isEmpty()) {
                segments.add(new CaptionSegment(startMs, endMs, text));
            }
        }
        return segments;
    }
}
