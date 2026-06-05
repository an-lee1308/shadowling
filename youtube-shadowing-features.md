# YouTube Shadowing — Feature Brainstorm

> Tính năng cho phép người dùng nhập URL YouTube bất kỳ, tự động lấy transcript, rồi luyện shadowing theo từng câu với AI chấm điểm phát âm.

---

## Vấn đề cần giải quyết

| Vấn đề | Ghi chú |
|---|---|
| Content hiện tại là fixed (admin tạo) | Người dùng muốn luyện theo video yêu thích |
| Shadowing cần audio gốc có chất lượng cao | YouTube là nguồn vô tận content native speaker |
| Transcript phải sync chính xác theo từng câu | YouTube caption API có timestamp sẵn |

---

## Core User Flow

```
Nhập YouTube URL
  → Validate + fetch video info
  → Lấy transcript (auto-caption hoặc upload tay)
  → Chọn đoạn muốn luyện (hoặc luyện toàn bộ)
  → Vòng lặp cho từng câu:
      1. Nghe câu gốc (video phát đoạn đó)
      2. Video pause, người dùng nói theo
      3. AI chấm điểm phát âm
      4. Repeat câu nếu điểm thấp, next nếu pass
  → Kết thúc: tổng kết điểm, lưu từ vựng
```

---

## Tính Năng Chi Tiết

### 1. YouTube Video Input

- Input field nhập URL, hỗ trợ mọi format:
  - `youtube.com/watch?v=xxx`
  - `youtu.be/xxx`
  - `youtube.com/shorts/xxx`
- Fetch video metadata qua YouTube Data API v3: title, thumbnail, duration, channel name
- Kiểm tra video có thể embed không (embeddable flag)
- Preview card trước khi bắt đầu luyện

### 2. Transcript / Caption

**Auto-fetch:**
- Dùng YouTube Data API v3 (Captions resource) hoặc scrape caption track
- Ưu tiên: English manual > English auto-generated > auto-translate
- Parse WebVTT/SRT → array `{ start, end, text }`
- Tách thành câu đơn nếu một caption segment chứa nhiều câu

**Manual fallback:**
- Upload SRT/VTT file thủ công
- Paste transcript dạng text (hệ thống auto-split thành câu, không có timestamp → dùng chế độ không sync)

**Sentence segmentation:**
- Gộp các segment ngắn < 2 giây thành câu hoàn chỉnh
- Tách segment dài > 10 giây thành nhiều câu
- Mỗi câu lưu: `{ id, startMs, endMs, text }`

### 3. Video Player (YouTube IFrame API)

- Embed YouTube qua `youtube.com/embed/{id}?enablejsapi=1`
- Ẩn UI gốc của YouTube, chỉ dùng JS API để điều khiển
- Controls tự build:
  - Play / Pause
  - Tốc độ phát lại: 0.5x / 0.75x / 1.0x / 1.25x
  - Seek đến đầu câu hiện tại (rewind sentence)
  - Prev sentence / Next sentence
- Loop câu (A-B repeat): phát đoạn `[startMs, endMs]`, tự động pause khi đến `endMs`
- Highlight waveform / progress bar theo câu

### 4. Shadowing Mode — Vòng Lặp Từng Câu

**Bước 1 — Listen:**
- Video phát đúng đoạn câu đó (loop 1-3 lần tuỳ setting)
- Transcript hiện bên dưới (hoặc ẩn để tập nghe thuần)

**Bước 2 — Shadow:**
- Video pause
- Countdown nhỏ (3-2-1) → microphone bật
- Người dùng nói theo câu vừa nghe
- Hiển thị waveform trực tiếp khi đang ghi âm

**Bước 3 — Score:**
- Gửi audio recording + reference text lên AI (OpenAI Whisper + scoring)
- Trả về:
  - Tổng điểm (0–100)
  - Transcript nhận diện được
  - Từ phát âm sai (highlight đỏ)
  - Gợi ý: "Try again slower" / "Good, move on"

**Bước 4 — Decision:**
- Điểm < 60: auto-repeat câu (giới hạn 3 lần)
- Điểm 60–80: suggest repeat, người dùng quyết định
- Điểm > 80: next sentence, cộng XP

**Settings của mode:**
- Số lần nghe trước khi shadow (1 / 2 / 3)
- Pass threshold (mặc định 70)
- Auto-advance vs manual advance
- Show/hide transcript khi nghe

### 5. Transcript Display

- Danh sách câu bên cạnh player (scrollable sidebar)
- Câu đang active: highlight nền, scroll vào view
- Click câu bất kỳ → seek video đến đó
- Toggle transcript visibility (ẩn để luyện nghe thuần)
- Từ đã luyện: checkmark xanh
- Từ phát âm sai nhiều lần: icon đỏ

### 6. Vocabulary Extraction

- Sau khi hoàn thành video, hệ thống extract danh sách từ từ transcript
- Filter theo CEFR level (loại từ quá dễ như "the", "a")
- Người dùng chọn từ muốn save vào vocab deck
- Từ được add vào SM-2 queue, nhắc ôn theo lịch

### 7. Progress & Gamification

| Action | XP |
|---|---|
| Hoàn thành 1 câu shadowing (pass) | +10 XP |
| Hoàn thành toàn bộ video | +100 XP bonus |
| Perfect score (>90) trên 1 câu | +15 XP |

**Achievements mới:**
- "YouTube Pioneer" — hoàn thành video YouTube đầu tiên
- "Binge Learner" — hoàn thành 10 video YouTube
- "Perfect Shadow" — đạt >90 điểm 20 câu liên tiếp

**Lưu progress:**
- Resume từ câu cuối nếu thoát giữa chừng
- History: video đã học, % hoàn thành, điểm trung bình

### 8. Content Library (My Videos)

- Danh sách video YouTube mà người dùng đã add
- Card mỗi video: thumbnail, title, progress %, ngày học gần nhất
- Xoá video khỏi library
- Filter: In Progress / Completed / Not Started

### 9. Admin / Curated Playlists (Optional)

- Admin có thể tạo "Official Playlist" từ YouTube URLs
- Gắn tag: level (A1–C2), topic, duration
- Hiện trong Lesson Browser như bài học thường
- Phân biệt visual: badge "YouTube" màu đỏ

---

## Phân Tích Kỹ Thuật

### YouTube IFrame Player API

```
Không cần backend để embed — chạy hoàn toàn frontend.
Dùng postMessage API để control playback.
Caveats:
- Một số video bị tắt embed bởi chủ kênh → hiển thị error rõ ràng
- YouTube không cho phép tua trên mobile embedded trong một số browser
```

### Caption Fetching

```
Option A: YouTube Data API v3
  - Cần API key (miễn phí, quota 10,000 units/day)
  - Chỉ lấy được captions nếu video có caption track dạng ASR/manual
  - Cần OAuth nếu caption là "private"

Option B: yt-dlp / third-party API (backend)
  - Không cần API key
  - Lấy được auto-generated subtitle (tiformat srv3/vtt)
  - Cần backend endpoint: POST /api/youtube/captions { url }

Recommendation: Option B qua backend (ít giới hạn hơn)
```

### Backend endpoints cần thêm

```
POST /api/youtube/info        → { title, thumbnail, duration, channelName }
POST /api/youtube/captions    → [{ startMs, endMs, text }]
POST /api/youtube/lessons     → Tạo "bài học" từ video YouTube (lưu vào DB)
GET  /api/youtube/lessons     → Danh sách video user đã add
DELETE /api/youtube/lessons/{id}
PUT  /api/youtube/lessons/{id}/progress → { sentenceId, score }
```

### DB Schema mới

```sql
-- Bảng lưu YouTube lesson của từng user
CREATE TABLE youtube_lessons (
  id UUID PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  youtube_url VARCHAR(500),
  youtube_video_id VARCHAR(20),
  title VARCHAR(500),
  thumbnail_url VARCHAR(500),
  duration_seconds INT,
  captions JSONB,            -- array of { startMs, endMs, text }
  created_at TIMESTAMP,
  last_practiced_at TIMESTAMP
);

-- Bảng lưu progress từng câu
CREATE TABLE youtube_sentence_progress (
  id UUID PRIMARY KEY,
  youtube_lesson_id UUID REFERENCES youtube_lessons(id),
  sentence_index INT,
  best_score INT,
  attempt_count INT,
  completed BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP
);
```

---

## Phân Kỳ Triển Khai

### Phase 1 — MVP (2–3 tuần)
- [ ] Input URL + fetch video info + embed player
- [ ] Backend fetch caption qua yt-dlp
- [ ] Sentence-by-sentence playback loop
- [ ] Record + Whisper scoring (tái dùng flow hiện tại)
- [ ] Lưu progress vào DB
- [ ] "My Videos" library cơ bản

### Phase 2 — Polish (1–2 tuần)
- [ ] Transcript sidebar với click-to-seek
- [ ] Speed control + loop settings
- [ ] Vocabulary extraction sau video
- [ ] XP + achievements mới
- [ ] Resume từ câu cuối

### Phase 3 — Content Curation (1 tuần)
- [ ] Admin tạo curated playlist từ YouTube URLs
- [ ] Badge "YouTube" trên Lesson Browser
- [ ] Recommend video theo level người dùng

---

## Rủi Ro & Giải Pháp

| Rủi Ro | Giải Pháp |
|---|---|
| Video bị tắt embed | Hiển thị error, suggest mở trực tiếp YouTube |
| Không có caption | Cho phép upload SRT thủ công |
| yt-dlp bị chặn / YouTube thay đổi format | Fallback sang YouTube Data API v3; cache caption trong DB sau lần đầu |
| Copyright / ToS YouTube | Không download video, chỉ embed. Caption fetch là gray area nhưng phổ biến |
| Latency khi fetch caption | Cache trong DB sau lần đầu; loading skeleton UI |
| AI scoring latency (Whisper) | Hiển thị "scoring..." animation; non-blocking UX |
