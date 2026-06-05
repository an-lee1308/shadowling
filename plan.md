# Plan: Xây Dựng Web App Học Tiếng Anh (Parroto Clone)

---

## Tổng Quan

Xây dựng một nền tảng học tiếng Anh web-based với ba tính năng cốt lõi:
- **Dictation** — nghe và gõ lại, chấm điểm tự động
- **Shadowing** — ghi âm và so sánh với native speaker bằng AI
- **Spaced Repetition** — ôn từ vựng theo lịch tối ưu

Mục tiêu: ra mắt MVP trong **8 tuần**, đầy đủ tính năng trong **20 tuần**.

---

## Tech Stack

### Frontend
| Mục | Lựa chọn | Lý do |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSR, routing, fullstack trong 1 repo |
| Language | TypeScript | Type-safe, dễ maintain |
| Styling | Tailwind CSS + shadcn/ui | Nhanh, consistent, có dark mode sẵn |
| State | Zustand | Nhẹ, đủ dùng cho auth + lesson state |
| Audio | WaveSurfer.js | Waveform visualization cho dictation/shadowing |
| Animation | Framer Motion | Flashcard flip, transition mượt |
| Charts | Recharts | Progress/analytics dashboard |

### Backend
| Mục | Lựa chọn | Lý do |
|---|---|---|
| API | Next.js API Routes + tRPC | Type-safe API, cùng repo với frontend |
| Auth | Clerk hoặc NextAuth.js | OAuth (Google), JWT, session quản lý đơn giản |
| Database | PostgreSQL (Supabase) | Relational, mạnh cho SRS queries, free tier |
| Cache | Upstash Redis | Caching lesson content, SRS scheduling |
| ORM | Prisma | Type-safe DB queries, migration dễ |

### AI / Speech
| Mục | Lựa chọn | Lý do |
|---|---|---|
| Speech-to-Text | OpenAI Whisper API | Chính xác cao, hỗ trợ tiếng Anh tốt |
| Pronunciation Scoring | Azure Speech SDK (Pronunciation Assessment) | API chuyên dụng, cho điểm phoneme-level |
| Text Comparison | Custom diff algorithm (Levenshtein) | Chấm dictation, highlight từng từ đúng/sai |

### Infrastructure
| Mục | Lựa chọn | Lý do |
|---|---|---|
| Hosting | Vercel | Tích hợp Next.js hoàn hảo, CI/CD tự động |
| File Storage | Cloudflare R2 | Giá rẻ, CDN global cho audio/video |
| Database | Supabase (PostgreSQL) | Free tier rộng rãi, built-in auth có thể dùng sau |

---

## Database Schema

```
User
  id, email, name, avatar
  level (beginner/intermediate/advanced)
  goal (general/ielts/toeic/business)
  streak_count, last_active_at
  created_at

Lesson
  id, title, description
  audio_url, video_url, thumbnail_url
  transcript (JSON: [{start, end, text}])
  level, topic, duration_seconds
  published_at

UserLessonProgress
  user_id, lesson_id
  mode (dictation/shadowing)
  status (not_started/in_progress/completed)
  best_score, attempts, time_spent_seconds
  last_practiced_at

Word
  id, text, definition, pronunciation
  audio_url, example_sentence

UserWord (Spaced Repetition)
  user_id, word_id
  ease_factor (SM-2: default 2.5)
  interval_days
  repetitions
  next_review_at
  last_reviewed_at

PracticeSession
  id, user_id, lesson_id, mode
  score, accuracy_percent
  recording_url (shadowing)
  errors (JSON: [{word, expected, got}])
  created_at
```

---

## Kiến Trúc Hệ Thống

```
Browser
  └── Next.js App (Vercel)
        ├── Pages: /, /dashboard, /lessons, /lesson/[id], /vocabulary, /progress
        ├── API Routes (tRPC)
        │     ├── auth.*
        │     ├── lessons.list / lessons.get
        │     ├── progress.save / progress.get
        │     ├── words.save / words.review
        │     └── speech.transcribe / speech.score
        └── External Calls
              ├── OpenAI Whisper (STT)
              ├── Azure Speech (Pronunciation)
              └── Cloudflare R2 (Audio/Video)

Database
  ├── PostgreSQL (Supabase) — user data, lessons, progress
  └── Redis (Upstash) — session cache, SRS queue
```

---

## Kế Hoạch Theo Phase

---

### Phase 1 — Foundation & Dictation MVP (Tuần 1–4)

**Mục tiêu:** Người dùng có thể đăng ký, chọn bài, và luyện Dictation.

#### Tuần 1 — Project Setup
- [ ] Khởi tạo Next.js 14 + TypeScript + Tailwind + shadcn/ui
- [ ] Setup Prisma + Supabase PostgreSQL
- [ ] Setup Clerk auth (Google OAuth + email)
- [ ] Layout cơ bản: navbar, sidebar, responsive
- [ ] Deploy lên Vercel (CI/CD từ đầu)

#### Tuần 2 — Lesson System
- [ ] Schema: `Lesson`, `UserLessonProgress`
- [ ] Seed 5–10 bài học mẫu (upload audio lên R2)
- [ ] Trang `/lessons`: card grid, filter theo level + topic
- [ ] Trang lesson detail: audio player + transcript hiển thị

#### Tuần 3 — Dictation Mode
- [ ] WaveSurfer.js player: play/pause, rewind 5s, tốc độ 0.5x/0.75x/1x
- [ ] Sentence-by-sentence: hiện từng câu khi phát audio
- [ ] Text input: người dùng gõ, so sánh real-time bằng Levenshtein diff
- [ ] Highlight: xanh = đúng, đỏ = sai, xám = chưa gõ
- [ ] Auto-reveal sau N lần sai hoặc bấm hint

#### Tuần 4 — Progress & Dashboard cơ bản
- [ ] Lưu `PracticeSession` sau mỗi bài
- [ ] Dashboard: streak, số bài hoàn thành, accuracy gần nhất
- [ ] Trạng thái bài học (in-progress / completed) trên lesson card
- [ ] Trang `/progress`: bảng lịch sử các session

**Verify Phase 1:** Người dùng mới → đăng ký → chọn bài → luyện dictation → thấy điểm → quay lại dashboard thấy streak.

---

### Phase 2 — Shadowing + Vocabulary (Tuần 5–10)

**Mục tiêu:** Thêm shadowing với AI scoring và hệ thống từ vựng SRS.

#### Tuần 5 — Audio Recording
- [ ] MediaRecorder API: ghi âm microphone trong trình duyệt
- [ ] Waveform visualization real-time khi ghi âm (WaveSurfer)
- [ ] Upload recording lên R2 sau khi hoàn thành
- [ ] Playback recording để người dùng tự nghe lại

#### Tuần 6 — AI Pronunciation Scoring
- [ ] Gọi OpenAI Whisper để transcribe recording → so sánh với transcript
- [ ] Gọi Azure Speech Pronunciation Assessment API
- [ ] Parse kết quả: overall score, accuracy, fluency, completeness
- [ ] Hiển thị feedback: từng từ được đánh dấu theo điểm
- [ ] Lưu kết quả vào `PracticeSession`

#### Tuần 7 — Vocabulary Auto-Save
- [ ] Parse transcript → extract tất cả từ trong bài
- [ ] Lookup từ điển (Dictionary API hoặc pre-populated DB)
- [ ] Tự động thêm từ vào `UserWord` sau khi hoàn thành bài
- [ ] Trang `/vocabulary`: danh sách từ đã lưu, search, filter

#### Tuần 8 — Spaced Repetition Engine
- [ ] Implement thuật toán SM-2 trong backend
- [ ] Tính `next_review_at` sau mỗi lần review (again/hard/good/easy)
- [ ] API: `words.getDueToday` → trả về danh sách từ cần ôn hôm nay
- [ ] Flashcard UI: flip animation, 4 nút đánh giá
- [ ] Badge trên dashboard: "X từ cần ôn hôm nay"

#### Tuần 9 — Shadowing Mode Hoàn Chỉnh
- [ ] Sentence-level shadowing: play 1 câu → ghi âm → score → next câu
- [ ] Progress bar theo câu
- [ ] Kết quả cuối bài: overall + breakdown từng câu
- [ ] So sánh waveform: native vs user (visualization đơn giản)

#### Tuần 10 — Polish Phase 2
- [ ] Loading states, error handling cho API calls
- [ ] Retry logic khi gọi AI thất bại
- [ ] Mobile responsive cho tất cả trang mới
- [ ] Performance: lazy load WaveSurfer, optimize bundle size

**Verify Phase 2:** Luyện shadowing → nhận điểm AI → từ tự lưu → ôn flashcard → streak cập nhật.

---

### Phase 3 — Analytics, UX & Content (Tuần 11–16)

**Mục tiêu:** Dashboard analytics đầy đủ, dark mode, i18n, nội dung phong phú.

#### Tuần 11 — Analytics Dashboard
- [ ] Recharts: biểu đồ accuracy theo ngày/tuần
- [ ] Heatmap hoạt động học (như GitHub contribution graph)
- [ ] Thống kê: tổng giờ học, tổng từ đã học, bài hoàn thành
- [ ] Điểm yếu: từ sai nhiều nhất, câu khó nhất

#### Tuần 12 — Dark Mode + Design System
- [ ] Implement dark mode với Tailwind + next-themes
- [ ] Color tokens nhất quán cho toàn bộ app
- [ ] Audit lại tất cả components, đảm bảo dark mode đúng
- [ ] Micro-animations: hover cards, button feedback

#### Tuần 13 — i18n (Tiếng Việt)
- [ ] Setup next-intl hoặc next-i18next
- [ ] Dịch toàn bộ UI string sang tiếng Việt
- [ ] Route `/vi/` và `/en/` 
- [ ] Language switcher trong settings

#### Tuần 14 — Onboarding Flow
- [ ] Màn hình chọn mục tiêu (IELTS / giao tiếp / công việc)
- [ ] Placement test nhanh: 5 câu dictation → xác định level
- [ ] Gợi ý bài học đầu tiên phù hợp
- [ ] Tooltip hướng dẫn lần đầu dùng các tính năng

#### Tuần 15 — Content & CMS
- [ ] Admin page đơn giản: upload bài học mới (audio, transcript JSON)
- [ ] Bulk upload transcript từ SRT/VTT file
- [ ] Thêm 50+ bài học đa dạng chủ đề
- [ ] Thumbnail generation tự động hoặc upload

#### Tuần 16 — Recommendation Engine
- [ ] Logic đơn giản: gợi ý bài cùng level + chủ đề chưa học
- [ ] "Tiếp tục từ chỗ dừng" — resume bài đang dở
- [ ] "Bài phổ biến" — sort theo số lượt học
- [ ] Section riêng trên dashboard

**Verify Phase 3:** Người dùng mới → onboarding → nhận gợi ý bài phù hợp → đổi sang tiếng Việt → xem analytics sau 1 tuần học.

---

### Phase 4 — Gamification & Growth (Tuần 17–20)

**Mục tiêu:** Tăng retention, chuẩn bị scale.

#### Tuần 17 — Gamification
- [ ] XP system: kiếm điểm khi hoàn thành bài, duy trì streak
- [ ] Level badges: Beginner → Intermediate → Advanced → Master
- [ ] Leaderboard tuần: top học viên theo XP
- [ ] Achievement system: "Hoàn thành 10 bài", "Streak 7 ngày"...

#### Tuần 18 — Notifications & Reminders
- [ ] Email reminder: "Bạn có X từ cần ôn hôm nay"
- [ ] Browser push notification (Service Worker)
- [ ] Cài đặt thời gian nhắc nhở trong settings
- [ ] Daily goal: đặt mục tiêu số phút/ngày

#### Tuần 19 — Performance & SEO
- [ ] Static generation cho lesson pages (SEO)
- [ ] Image/audio lazy loading
- [ ] Core Web Vitals audit (LCP, CLS, FID)
- [ ] PWA manifest: add to home screen trên mobile

#### Tuần 20 — Testing & Launch Prep
- [ ] Viết unit tests cho SM-2 algorithm
- [ ] Viết integration tests cho dictation scoring
- [ ] Load testing API với k6
- [ ] Security audit: rate limiting, input validation, auth middleware
- [ ] Setup monitoring: Sentry (errors) + Vercel Analytics

**Verify Phase 4:** 100 user test → retention D7 > 30% → không có critical bug trong 48h.

---

## API Endpoints Chính (tRPC)

```typescript
// Auth
auth.getSession
auth.updateProfile  // level, goal, language

// Lessons
lessons.list        // filter: level, topic, status
lessons.get         // by id, includes transcript
lessons.search      // full-text search

// Practice
practice.saveDictationResult   // score, errors, time
practice.saveShadowingResult   // score, recording_url
practice.getHistory            // by lesson or by user

// Speech (server-side, calls external APIs)
speech.transcribe   // audio blob → text (Whisper)
speech.score        // audio blob + reference text → pronunciation score (Azure)

// Vocabulary
words.getForLesson  // words in a lesson
words.save          // add to user's word list
words.getDueToday   // SRS: words due for review
words.review        // update ease_factor, interval (SM-2)
words.list          // user's full word list

// Progress
progress.getDashboard    // streak, stats, recent activity
progress.getAnalytics    // charts data (daily accuracy, time)
progress.getWeakWords    // most-missed words
```

---

## Ước Tính Chi Phí (Production)

| Dịch vụ | Plan | Chi phí/tháng |
|---|---|---|
| Vercel | Pro | $20 |
| Supabase | Pro | $25 |
| Upstash Redis | Pay-as-you-go | ~$5 |
| Cloudflare R2 | Pay-as-you-go | ~$5 (10GB) |
| OpenAI Whisper | Pay-as-you-go | ~$0.006/phút audio |
| Azure Speech | S0 tier | $1/1000 requests |
| Clerk Auth | Free tier (10k MAU) | $0 |
| **Tổng** | | **~$55–80/tháng** |

> Giai đoạn dev/staging: hoàn toàn free với free tiers.

---

## Rủi Ro & Phương Án Dự Phòng

| Rủi ro | Phương án |
|---|---|
| Azure Speech API đắt khi scale | Fallback sang Whisper diff thuần túy cho MVP |
| Upload audio chậm trên mobile | Compress WebM trước khi upload, dùng chunked upload |
| Transcript sync không chính xác | Dùng WebVTT format chuẩn, validate khi nhập liệu |
| Supabase free tier giới hạn | Migrate sang Railway PostgreSQL nếu cần |
| Bundle size lớn do WaveSurfer | Dynamic import, chỉ load khi vào lesson page |

---

## Thứ Tự Ưu Tiên (MoSCoW)

**Must Have (MVP):**
- Auth, Lesson browser, Dictation mode, Basic dashboard

**Should Have:**
- Shadowing + AI scoring, Vocabulary SRS, Analytics

**Could Have:**
- Dark mode, i18n, Gamification, Recommendations

**Won't Have (v1):**
- Mobile app native, Live classes, User-generated content
