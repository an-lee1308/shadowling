# Checklist Shadowling — Theo Plan 20 Tuần

> Cập nhật: 2026-05-16

---

## Phase 1 — Foundation & Dictation MVP (Tuần 1–4)

### Tuần 1 — Project Setup
- [x] Next.js 14 + TypeScript + Tailwind CSS *(shadcn/ui không dùng, thay bằng Tailwind custom)*
- [x] Database — Spring Boot + PostgreSQL + Flyway *(thay Prisma + Supabase)*
- [x] Auth — JWT custom *(thay Clerk)*
- [x] Layout cơ bản: Navbar sidebar, responsive
- [ ] Deploy lên Vercel / server production

### Tuần 2 — Lesson System
- [x] Schema: `Lesson`, `UserLessonProgress` (Flyway migrations)
- [ ] Seed 5–10 bài học mẫu thực tế (nội dung + audio)
- [x] Trang `/lessons`: card grid, filter level + topic, search, sort
- [x] Trang lesson detail: audio player + transcript tab

### Tuần 3 — Dictation Mode
- [x] WaveSurfer.js: play/pause, rewind 5s, tốc độ 0.5×/0.75×/1×
- [x] Sentence-by-sentence: từng câu theo transcript
- [x] Text input + Levenshtein diff chấm điểm
- [x] Highlight: xanh = đúng, đỏ = sai
- [x] Reveal answer (nút "Xem đáp án")

### Tuần 4 — Progress & Dashboard
- [x] Lưu `PracticeSession` sau mỗi bài
- [x] Dashboard: streak, bài hoàn thành, accuracy gần nhất
- [x] Trạng thái bài học trên lesson card (in-progress / completed)
- [x] Trang `/progress`: lịch sử session

---

## Phase 2 — Shadowing + Vocabulary (Tuần 5–10)

### Tuần 5 — Audio Recording
- [x] MediaRecorder API: ghi âm microphone trong trình duyệt
- [x] Waveform visualization real-time khi ghi âm (Web Audio API AnalyserNode canvas)
- [ ] Upload recording lên cloud storage (R2/S3) — hiện chỉ gửi trực tiếp lên API
- [ ] Playback recording để người dùng tự nghe lại sau khi ghi

### Tuần 6 — AI Pronunciation Scoring
- [x] Gọi OpenAI Whisper: transcribe recording → so sánh với transcript
- [x] Scoring API (Azure Speech / custom): overall, accuracy, fluency
- [x] Parse kết quả: overall score, accuracy, fluency
- [x] Hiển thị feedback: từng từ đánh dấu đúng/sai
- [x] Lưu kết quả vào `PracticeSession`

### Tuần 7 — Vocabulary Auto-Save
- [x] Tự động thêm từ vào `UserWord` sau khi hoàn thành bài
- [x] Pre-populated word DB với definition, pronunciation
- [x] Trang `/vocabulary`: danh sách từ đã lưu, search, filter
- [x] Toast thông báo từ đã được lưu

### Tuần 8 — Spaced Repetition Engine
- [x] Thuật toán SM-2 trong backend
- [x] Tính `next_review_at` sau mỗi lần review (AGAIN/HARD/GOOD/EASY)
- [x] API `words.due` → danh sách từ cần ôn hôm nay
- [x] Flashcard UI: flip animation, 4 nút đánh giá
- [x] Badge dashboard "X từ cần ôn hôm nay"

### Tuần 9 — Shadowing Mode Hoàn Chỉnh
- [x] Sentence-level shadowing: play 1 câu → ghi âm → score → next
- [x] Progress bar theo câu
- [x] Kết quả cuối bài: overall + breakdown từng câu
- [ ] So sánh waveform: native vs user (visualization song song)

### Tuần 10 — Polish Phase 2
- [x] Loading states, error handling cho API calls
- [x] Retry logic khi gọi AI thất bại (`withRetry` 3 lần, exponential backoff)
- [ ] Mobile responsive audit đầy đủ (chưa test kỹ trên mobile)
- [x] Lazy load WaveSurfer (dynamic import trong `useEffect`)

---

## Phase 3 — Analytics, UX & Content (Tuần 11–16)

### Tuần 11 — Analytics Dashboard
- [x] Recharts: biểu đồ accuracy theo ngày (30 ngày gần nhất, AreaChart)
- [x] Activity heatmap 365 ngày (GitHub-style, 5 mức intensity)
- [x] Thống kê: tổng sessions, tổng từ học, bài hoàn thành, accuracy tổng thể
- [x] Điểm yếu: "Từ khó nhất" (SM-2 ease factor thấp nhất)

### Tuần 12 — Dark Mode + Design System
- [x] Dark mode với Tailwind + next-themes (`attribute="class"`)
- [x] Color tokens nhất quán (`primary-*` = indigo)
- [x] Audit toàn bộ components: Navbar, Dashboard, Lesson, Dictation, Shadowing, WaveformPlayer, Vocabulary, Progress, Settings, Leaderboard, Admin
- [ ] Micro-animations hover cards *(Framer Motion dùng ở onboarding/results, chưa có hover card animation)*

### Tuần 13 — i18n
- [ ] Setup next-intl / next-i18next *(bỏ qua — app native tiếng Việt)*
- [x] Toàn bộ UI string bằng tiếng Việt
- [ ] Route `/vi/` và `/en/` *(không làm)*
- [ ] Language switcher *(không làm)*

### Tuần 14 — Onboarding Flow
- [x] Màn hình chọn mục tiêu (GENERAL / IELTS / TOEIC / BUSINESS)
- [x] Placement test 4 câu grammar → tự động xác định level
- [x] Gợi ý bài học phù hợp ngay sau onboarding (recommendations engine)
- [x] Tooltip hướng dẫn lần đầu vào lesson page (dismissible banner)

### Tuần 15 — Content & CMS
- [x] Admin page: tạo / sửa / xóa bài học
- [x] Bulk import transcript từ file SRT/VTT
- [ ] Thêm 50+ bài học thực tế *(việc nội dung, chưa làm)*
- [ ] Thumbnail generation tự động *(không làm)*

### Tuần 16 — Recommendation Engine
- [x] Gợi ý bài cùng level + chủ đề chưa học (`/api/recommendations`)
- [x] "Tiếp tục từ chỗ dừng" (`/api/recommendations/continue`)
- [x] "Bài phổ biến" (sort `play_count DESC`, tăng mỗi lần mở bài)
- [x] Section riêng trên dashboard (Continue + Gợi ý)

---

## Phase 4 — Gamification & Growth (Tuần 17–20)

### Tuần 17 — Gamification
- [x] XP system: +30 dictation, +40 shadowing, +5 word review
- [x] Level badges: 10 cấp (Newcomer → Legend)
- [x] Leaderboard top 20 theo XP tuần
- [x] Achievement system: 12 achievements (streak, bài học, từ vựng, điểm cao)

### Tuần 18 — Notifications & Reminders
- [ ] Email reminder *(cần SendGrid/Resend — ngoài scope)*
- [x] Browser push notification (Service Worker `sw.js`)
- [x] Cài đặt nhắc nhở trong `/settings` (toggle + request permission)
- [x] Daily goal: đặt mục tiêu phút/ngày, progress bar trên dashboard

### Tuần 19 — Performance & SEO
- [ ] Static generation cho lesson pages *(page dùng auth nên không áp dụng SSG)*
- [x] Lazy load WaveSurfer (dynamic import)
- [ ] Core Web Vitals audit (LCP, CLS, FID) *(chưa đo)*
- [x] PWA manifest (`manifest.json`, Service Worker, installable)

### Tuần 20 — Testing & Launch Prep
- [x] Unit tests SM-2 algorithm (`Sm2ServiceTest.java` — 12 tests)
- [x] Integration tests dictation scoring (`LevenshteinServiceTest.java` — 14 tests)
- [ ] Load testing API với k6 *(chưa làm)*
- [x] Rate limiting (120 req/min per IP, `RateLimitFilter.java`)
- [x] Monitoring: `monitoring.ts` (Sentry-ready stub), error boundary, global 404

---

## Tóm Tắt

| Phase | Hoàn thành | Còn lại |
|---|---|---|
| Phase 1 — MVP | 15/16 | 1 (deploy) |
| Phase 2 — Shadowing + Vocab | 14/17 | 3 (R2 upload, playback, waveform compare) |
| Phase 3 — Analytics + UX | 18/22 | 4 (i18n, micro-anim, 50+ bài, thumbnail) |
| Phase 4 — Gamification | 11/15 | 4 (email, static gen, CWV audit, k6) |
| **Tổng** | **58/70** | **12** |

## Việc Còn Lại (Ưu Tiên)

### Nên làm tiếp (có giá trị thực)
- [ ] **Deploy** lên server (Vercel frontend + Railway/Render backend)
- [ ] **Seed nội dung** — thêm 10–20 bài học thực tế với audio
- [ ] **Playback recording** — cho user nghe lại giọng mình sau khi ghi
- [ ] **Mobile responsive** — test và fix layout trên màn nhỏ

### Có thể bỏ qua (low ROI)
- [ ] So sánh waveform native vs user *(phức tạp, UX benefit thấp)*
- [ ] R2/S3 upload recording *(cần infra, thay thế bằng stream trực tiếp)*
- [ ] Static generation lesson pages *(auth-protected → SSG không áp dụng)*
- [ ] i18n / language switcher *(app đã native Vietnamese)*
- [ ] Thumbnail generation tự động *(upload manual đủ dùng)*
- [ ] Core Web Vitals audit *(sau khi có traffic thực)*
- [ ] Load testing k6 *(sau khi deploy)*
- [ ] Email reminders *(cần external service)*
