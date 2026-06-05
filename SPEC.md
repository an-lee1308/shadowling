# Shadowling — Technical Specification (As-Built)

> Đặc tả kỹ thuật mô tả hệ thống **như đang tồn tại** tại thời điểm viết.
> Đây là tài liệu tham chiếu (reference), không phải roadmap. Roadmap xem [ROADMAP.md](./ROADMAP.md).
>
> Cập nhật: 2026-06-02 · Nguồn: đọc trực tiếp source code `backend/` + `frontend/`.

---

## 1. Tổng Quan

Shadowling là web app học tiếng Anh (Parroto clone) tập trung vào ba phương pháp:

- **Dictation** — nghe audio, gõ lại, chấm điểm từng từ bằng Levenshtein.
- **Shadowing** — ghi âm giọng nói, chấm phát âm bằng OpenAI Whisper.
- **Spaced Repetition** — flashcard từ vựng theo thuật toán SM-2.

Bổ sung: gamification (XP, level, achievements, leaderboard), analytics, onboarding, admin CMS, dark mode, PWA + push notification.

**Ngôn ngữ UI:** Tiếng Việt (hardcoded, không có i18n framework).

### Kiến trúc tổng thể

```
Browser (Next.js 14, PWA)
  │  Bearer JWT trong localStorage
  ▼
Spring Boot 3.2.5 REST API (:8080)   ──►  OpenAI Whisper API (transcribe/score)
  ├── PostgreSQL 16 (Flyway migrations)
  └── Redis 7 (dependency có mặt, chưa dùng trong business logic)
```

- Frontend gọi backend qua REST, base URL `NEXT_PUBLIC_API_URL` (mặc định `http://localhost:8080`).
- Auth stateless: JWT ký HS256, gửi qua header `Authorization: Bearer <token>`.
- Không có file storage ngoài (R2/S3); recording shadowing gửi thẳng lên `/api/speech/*` dưới dạng multipart, không lưu trữ lâu dài.

---

## 2. Tech Stack

### Backend (`backend/`)

| Mục | Lựa chọn |
|---|---|
| Framework | Spring Boot 3.2.5 |
| Language | Java 21 |
| Security | spring-boot-starter-security + BCrypt |
| JWT | jjwt 0.12.5 (HS256) |
| Database | PostgreSQL (driver runtime) |
| ORM | Spring Data JPA / Hibernate (`ddl-auto: validate`) |
| Migration | Flyway Core (`classpath:db/migration`) |
| Cache | spring-boot-starter-data-redis *(infra có, chưa dùng)* |
| Validation | spring-boot-starter-validation (Jakarta) |
| Utilities | Lombok |
| Test | JUnit 5 + AssertJ |

### Frontend (`frontend/`)

| Mục | Lựa chọn |
|---|---|
| Framework | Next.js 14.2.3 (App Router) |
| Language | TypeScript 5.4.5 (strict) |
| React | 18.3.1 |
| Styling | Tailwind CSS 3.4 (darkMode `class`), primary = indigo |
| State | Zustand 4.5 (+ persist middleware) |
| Audio | wavesurfer.js 7.7 (playback), Web Audio API (recording viz) |
| Charts | Recharts 2.12 |
| Animation | Framer Motion 11 |
| Theme | next-themes 0.4 |
| UI primitives | Radix UI (dialog, progress, select, tabs, toast) |
| Icons | lucide-react |

### Infrastructure (dev)

`docker-compose.yml` cung cấp PostgreSQL 16-alpine (port 5432) + Redis 7-alpine (port 6379). Chưa có cấu hình production/deploy.

---

## 3. Data Model

PostgreSQL, quản lý bằng Flyway. Migrations: `backend/src/main/resources/db/migration/`.

### 3.1 Migration history

| Version | Nội dung |
|---|---|
| V1 `__init` | users, lessons, user_lesson_progress, words, lesson_words, user_words, practice_sessions |
| V2 `__seed_data` | seed lessons (Morning Greetings, Coffee Shop, Job Interview, IELTS) + words mẫu |
| V3 `__add_recording_uploads` | recording_uploads |
| V4 `__gamification` | thêm `total_xp`, `role` vào users; achievements; user_achievements; seed 12 achievements |
| V5 `__user_settings` | thêm `daily_goal_minutes`, `push_subscription` vào users |
| V6 `__lesson_play_count` | thêm `play_count` vào lessons |
| V7 `__flashcard_sessions` | thêm `again_count`, `leech`, `suspended` vào user_words; word_review_sessions |

### 3.2 Bảng

**users**
| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | UUID PK | |
| email | VARCHAR(255) | UNIQUE NOT NULL |
| name, avatar, password_hash | VARCHAR | BCrypt hash |
| level | VARCHAR(20) | default `BEGINNER` |
| goal | VARCHAR(20) | default `GENERAL` |
| streak_count | INT | default 0 |
| total_xp | INT | default 0 (V4) |
| role | VARCHAR(20) | default `USER` (V4) |
| daily_goal_minutes | INT | default 15 (V5) |
| push_subscription | TEXT | JSON subscription (V5) |
| last_active_at, created_at | TIMESTAMP | |

**lessons** — id, title, description, audio_url, video_url, thumbnail_url, transcript (TEXT, JSON `[{start,end,text}]`), level, topic, duration_seconds, published_at, play_count (V6). Index: level, topic.

**user_lesson_progress** — id, user_id, lesson_id, mode (DICTATION/SHADOWING), status (NOT_STARTED/IN_PROGRESS/COMPLETED), best_score, attempts, time_spent_seconds, last_practiced_at. `UNIQUE(user_id, lesson_id, mode)`.

**words** — id, text, definition, pronunciation, audio_url, example_sentence.

**lesson_words** — join M:N (lesson_id, word_id).

**user_words** — id, user_id, word_id, ease_factor (default 2.5), interval_days (default 1), repetitions (default 0), next_review_at, last_reviewed_at, again_count (V7), leech (V7), suspended (V7). `UNIQUE(user_id, word_id)`. Index: next_review_at.

**practice_sessions** — id, user_id, lesson_id, mode, score, accuracy_percent, recording_url, errors (TEXT/JSON), created_at. Index: user_id, created_at.

**recording_uploads** — id, user_id, session_id, filename, content_type, size_bytes, url, created_at.

**achievements** — id, code (UNIQUE), name, description, icon, xp_reward.

**user_achievements** — id, user_id, achievement_id, earned_at. `UNIQUE(user_id, achievement_id)`.

**word_review_sessions** — id, user_id, mode (default NORMAL), started_at, ended_at, total_cards, correct_count, again_count, xp_earned.

### 3.3 Enums

| Enum | Giá trị |
|---|---|
| UserLevel | BEGINNER, INTERMEDIATE, ADVANCED |
| UserGoal | GENERAL, IELTS, TOEIC, BUSINESS |
| PracticeMode | DICTATION, SHADOWING |
| ProgressStatus | NOT_STARTED, IN_PROGRESS, COMPLETED |
| ReviewQuality | AGAIN(0), HARD(2), GOOD(4), EASY(5) |
| DeckType | TODAY, ALL, WEAK, LESSON |

---

## 4. REST API Contract

Tất cả prefix `/api/`. Mặc định **yêu cầu xác thực** trừ khi ghi PUBLIC.
Định dạng: JSON. Response thường bọc trong `ApiResponse { success, data, message }`.

### 4.1 Auth — `AuthController`

| Method | Path | Auth | Body / Params | Response |
|---|---|---|---|---|
| POST | `/api/auth/register` | PUBLIC | `{email, name, password}` | AuthResponse (token + profile) |
| POST | `/api/auth/login` | PUBLIC | `{email, password}` | AuthResponse |
| GET | `/api/auth/me` | USER | — | AuthResponse |
| PUT | `/api/auth/profile` | USER | `{name?, avatar?, level?, goal?, dailyGoalMinutes?, pushSubscription?}` | AuthResponse (partial update, null bỏ qua) |

`AuthResponse`: token, id, email, name, avatar, level, goal, streakCount, totalXp, role, dailyGoalMinutes.

### 4.2 Lessons — `LessonController`

| Method | Path | Auth | Params | Response |
|---|---|---|---|---|
| GET | `/api/lessons` | USER | level?, topic?, page=0, size=20, sort=newest\|popular | `Page<LessonDto>` |
| GET | `/api/lessons/{id}` | USER | — | LessonDto (tăng `play_count` mỗi lần fetch) |
| GET | `/api/lessons/search` | USER | q (required), page, size | `Page<LessonDto>` (title/description/transcript) |

`LessonDto`: + `userStatus`, `userBestScore` (theo user hiện tại).

### 4.3 Practice — `PracticeController`

| Method | Path | Auth | Body / Params | Notes |
|---|---|---|---|---|
| POST | `/api/practice/dictation` | USER | `{lessonId, score, accuracyPercent, timeSpentSeconds, errors}` | +30 XP; nếu accuracy=100% → achievement PERFECT_DICTATION |
| POST | `/api/practice/shadowing` | USER | `{lessonId, score, accuracyPercent, timeSpentSeconds, recordingUrl}` | +40 XP |
| GET | `/api/practice/history` | USER | page, size | newest first |
| GET | `/api/practice/history/{lessonId}` | USER | — | sessions của 1 lesson |
| POST | `/api/practice/score/dictation` | PUBLIC | `{expected, actual}` | Levenshtein, không ghi DB |

`DictationScoreResponse`: accuracyPercent, correctWords, totalWords, wordResults[`{position, expected, got, correct}`].

### 4.4 Speech — `SpeechController`

| Method | Path | Auth | Params | Notes |
|---|---|---|---|---|
| POST | `/api/speech/transcribe` | PUBLIC | `audio` (multipart) | OpenAI Whisper `whisper-1`; cần `OPENAI_API_KEY`, trả `""` nếu thiếu |
| POST | `/api/speech/score` | PUBLIC | `audio` (multipart), `referenceText` | transcribe + so sánh, trả word-level score |

`PronunciationScoreResponse`: transcript, overallScore (`accuracy*0.7 + fluency*0.3`), accuracyScore, fluencyScore, correctWords, totalWords, wordScores[`{word, recognized, correct, score}`].

### 4.5 Words — `WordController`

| Method | Path | Auth | Params / Body | Notes |
|---|---|---|---|---|
| GET | `/api/words/lesson/{lessonId}` | PUBLIC | — | từ trong 1 lesson |
| POST | `/api/words` | USER | `{wordId}` | lưu vào vocabulary user |
| GET | `/api/words/due` | USER | — | `next_review_at <= now` |
| GET | `/api/words` | USER | page, size | full vocabulary (paginated) |
| GET | `/api/words/weak` | USER | limit=5 (max 20) | ease_factor thấp nhất |
| POST | `/api/words/sessions/start` | USER | `{mode: DeckType, lessonId?}` | tạo session, lấy ≤50 cards |
| POST | `/api/words/sessions/{id}/end` | USER | — | đóng session, XP = correctCount*5 |
| POST | `/api/words/{wordId}/review` | USER | `{quality, sessionId?, cramMode?}` | cập nhật SM-2; +5 XP nếu không cram |

`WordDto`: + ease_factor, interval_days, repetitions, next_review_at, leech, suspended, again_count, `cardType` (MULTIPLE_CHOICE nếu repetitions=0, FILL_IN_BLANK / CLASSIC_FLIP theo repetitions).

DeckType: TODAY (due), ALL, WEAK (ease thấp), LESSON (cần `lessonId`). Cards sort theo repetitions rồi next_review_at.

### 4.6 Progress — `ProgressController`

| Method | Path | Auth | Params | Response |
|---|---|---|---|---|
| GET | `/api/progress/dashboard` | USER | — | streakCount, lessonsCompleted, totalSessions, recentAccuracy (7d), wordsDueForReview, totalWordsLearned, recentSessions[5], todaySessionCount |
| GET | `/api/progress/analytics` | USER | days=30 | daily `[{date, accuracy, sessions, timeSeconds}]` + overall accuracy/sessions/time |

### 4.7 Gamification — `GamificationController`

| Method | Path | Auth | Params | Response |
|---|---|---|---|---|
| GET | `/api/gamification/xp` | USER | — | totalXp, level (0–9), levelName, currentLevelXp, nextLevelXp, achievements[] (kèm cờ earned) |
| GET | `/api/gamification/leaderboard` | PUBLIC | limit=10 (max 50) | top theo total_xp: rank, userId, name, avatar, totalXp, streakCount, level |

### 4.8 Recommendations — `RecommendationController`

| Method | Path | Auth | Params | Response |
|---|---|---|---|---|
| GET | `/api/recommendations/continue` | USER | — | ≤3 lesson IN_PROGRESS |
| GET | `/api/recommendations` | USER | limit=6 (max 20) | lesson theo level, chưa hoàn thành; fill từ level khác nếu thiếu |

### 4.9 Admin — `AdminController` (role = ADMIN)

| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/api/admin/lessons` | CreateLessonRequest | tạo lesson (HTTP 201) |
| PUT | `/api/admin/lessons/{id}` | CreateLessonRequest | partial update |
| DELETE | `/api/admin/lessons/{id}` | — | xóa lesson |

Kiểm tra quyền thủ công trong `requireAdmin()` → ném `AccessDeniedException` nếu `role != "ADMIN"`.

---

## 5. Authentication & Security

- **Token:** JWT HS256 (jjwt 0.12.5). Subject = email. `JWT_SECRET` (default dài ≥256-bit), `JWT_EXPIRATION` mặc định 86400000ms (24h). — `security/JwtTokenProvider.java`.
- **Filter:** `JwtAuthenticationFilter` (OncePerRequestFilter) đọc header `Authorization: Bearer`, validate, set `SecurityContextHolder`. — `security/JwtAuthenticationFilter.java`.
- **UserDetails:** `CustomUserDetailsService` load theo email, authorities rỗng.
- **SecurityConfig** (`config/SecurityConfig.java`): CSRF off; CORS `allowedOriginPatterns=*`, methods GET/POST/PUT/DELETE/OPTIONS, credentials true; session STATELESS; password BCrypt.
  - **Public:** `/api/auth/register`, `/api/auth/login`, `/actuator/health`.
  - Còn lại: yêu cầu authenticated.
- **Role:** không dùng authorities của Spring Security — `role` chỉ là field String trên `User`; `AdminController` tự kiểm tra.
- **Rate limiting:** `filter/RateLimitFilter.java` — 120 req/phút/IP cho `/api/*`, in-memory `ConcurrentHashMap` per-JVM (không phân tán qua Redis), trả HTTP 429 khi vượt.

> ⚠️ Một số endpoint đáng lẽ cần auth lại đang PUBLIC: `/api/speech/*`, `/api/words/lesson/{id}`, `/api/practice/score/dictation`, `/api/gamification/leaderboard`. Xem [ROADMAP.md](./ROADMAP.md) mục bảo mật.

---

## 6. Core Algorithms

### 6.1 SM-2 Spaced Repetition — `service/Sm2Service.java`

Input: easeFactor, intervalDays, repetitions, quality(0–5).

```
if quality >= 3 (HARD/GOOD/EASY):
    interval = repetitions==0 ? 1
             : repetitions==1 ? 6
             : round(intervalDays * easeFactor)
    newEf   = max(1.3, easeFactor + (0.1 - (5-quality)*(0.08 + (5-quality)*0.02)))
    interval = applyFuzz(interval)          // ±10% chống pile-up, min 1 ngày
    repetitions += 1
else (quality < 3, AGAIN):
    easeFactor = max(1.3, easeFactor - 0.2)
    interval = 1
    repetitions = 0
```

Hệ quả ease factor: EASY +0.1 · GOOD ±0 · HARD −0.14 · AGAIN −0.2 (floor 1.3).
Test: `Sm2ServiceTest.java` (16 test).

### 6.2 Levenshtein Dictation — `service/LevenshteinService.java`

- `compare(expected, actual)`: tách theo whitespace, lowercase, strip ký tự ngoài `[a-z0-9']`; so từng từ theo vị trí; accuracy = correct/total*100 (làm tròn 1 chữ số); trả `wordResults`.
- `levenshtein(a,b)` static: edit distance DP cổ điển — dùng lại trong SpeechService cho partial word score.
- Test: `LevenshteinServiceTest.java` (16 test).

### 6.3 Speech Scoring — `service/SpeechService.java`

- `transcribe(file)`: multipart POST tới Whisper (`model=whisper-1`, `language=en`); thiếu key → log warn, trả `""`.
- `score(file, ref)`: transcribe → `LevenshteinService.compare` → word score (đúng=100, sai=partial qua Levenshtein); fluency = `min(100, transcriptWords/refWords*100)`; overall = `accuracy*0.7 + fluency*0.3`.
- Azure Speech: có config (`AZURE_SPEECH_KEY/REGION`) nhưng **không được dùng** trong logic.

### 6.4 Gamification — `service/GamificationService.java`

XP awards: dictation 30 · shadowing 40 · word review 5/từ · session correct*5 · achievement bonus.

Level thresholds (0→9): 0 / 100 / 300 / 600 / 1000 / 1500 / 2500 / 4000 / 6000 / 10000 — tên: Newbie → Beginner → Elementary → Pre-Intermediate → Intermediate → Upper-Intermediate → Advanced → Expert → Master → Legend.

12 achievements (code: xp): FIRST_LESSON 50 · STREAK_3 30 · STREAK_7 100 · STREAK_30 500 · WORDS_10 25 · WORDS_50 75 · WORDS_200 300 · PERFECT_DICTATION 150 · LESSONS_10 200 · LESSONS_50 500 · SHADOWING_FIRST 75 · HIGH_SCORE_90 200.

---

## 7. Frontend Architecture

### 7.1 Routes (App Router — `frontend/src/app/`)

| Route | Mô tả |
|---|---|
| `/` | redirect theo auth → dashboard / login |
| `/dashboard` | stats, continue + recommended lessons, XP badge, daily goal, words-due reminder |
| `/lessons` | catalog: search, filter level/topic, sort newest/popular |
| `/lessons/[id]` | tabs Dictation / Shadowing / Transcript; first-time guide |
| `/vocabulary` | flashcard SRS: 3 loại thẻ, mode Normal/Cram, deck Today/All/Weak/Lesson |
| `/progress` | heatmap 365 ngày, accuracy chart 30 ngày, weak words, history |
| `/settings` | profile (name/level/goal/daily goal) + push opt-in |
| `/leaderboard` | top 20 theo XP |
| `/onboarding` | wizard 4 bước (welcome → placement test → goal → done) |
| `/(auth)/login`, `/(auth)/register` | auth forms |
| `/admin/lessons` | CRUD lesson + import SRT/VTT (ADMIN only) |

### 7.2 Components chính (`frontend/src/components/`)

- **practice/**: `WaveformPlayer` (wavesurfer; speed 0.5–1×, rewind 5s), `DictationMode` (segment-by-segment + word feedback + reveal), `ShadowingMode` (record + frequency viz + scoring), `AudioPlayer`.
- **flashcard/**: `ClassicFlipCard` (3D flip, audio/TTS, phím 1–4, hiện interval kế), `MultipleChoiceCard`, `FillInBlankCard`, `DeckSelector`, `SessionSummary`.
- **layout/Navbar** (sidebar 256px, theme toggle, admin link theo role), **dashboard/DashboardStats**, **analytics/ActivityHeatmap** (52×7 GitHub-style), **gamification/XpBar**, **lesson/LessonCard**, **ui/Toast** (`showToast()`), **ServiceWorkerRegistration**, **providers/ThemeProvider**.

### 7.3 API client — `frontend/src/lib/api.ts`

- `request<T>()`: base `NEXT_PUBLIC_API_URL`, gắn `Authorization: Bearer` từ `localStorage["token"]`; ném lỗi khi !ok hoặc `!json.success`; 500+ → `captureError()` (`lib/monitoring.ts`, Sentry-ready stub).
- `withRetry<T>()`: 3 lần, backoff 1s/2s/3s — dùng cho `speech.transcribe` / `speech.score`.
- Nhóm: auth, lessons, practice, words, progress, gamification, recommendations, admin, speech.

### 7.4 State — `frontend/src/store/authStore.ts`

Zustand `{ user, token, setAuth, logout, isAuthenticated }`, persist localStorage key `shadowling-auth`; token cũng lưu riêng key `token` cho fetch wrapper. Không có global state khác — UI state cục bộ.

### 7.5 Features

- **Dark mode:** next-themes + Tailwind `class`, mặc định system preference.
- **PWA:** `public/manifest.json` (standalone, icon 192/512, theme #4f46e5) + `public/sw.js` (cache `shadowling-v1`, cache-first trừ `/api/*`, push handler).
- **Push:** Settings xin permission → `pushManager.subscribe()` (VAPID `NEXT_PUBLIC_VAPID_PUBLIC_KEY`) → lưu qua `updateProfile`.
- **Onboarding:** placement test 4 câu grammar → auto level (≥4 ADVANCED, ≥2 INTERMEDIATE, else BEGINNER); set `localStorage.onboarding_done`.
- **i18n:** không có — toàn bộ string tiếng Việt, `lang="vi"`.

---

## 8. Configuration / Environment

### Backend (`application.yml`)

| Var | Default | Dùng cho |
|---|---|---|
| `PORT` | 8080 | server |
| `DATABASE_URL` | `jdbc:postgresql://localhost:5432/shadowling` | DB |
| `DB_USERNAME` / `DB_PASSWORD` | postgres / password | DB |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | localhost / 6379 / — | cache (chưa dùng) |
| `JWT_SECRET` | (chuỗi mặc định ≥256-bit) | ký token |
| `JWT_EXPIRATION` | 86400000 | TTL token (ms) |
| `OPENAI_API_KEY` | — | Whisper (bắt buộc để chấm shadowing) |
| `OPENAI_WHISPER_URL` | `https://api.openai.com/v1/audio/transcriptions` | Whisper |
| `AZURE_SPEECH_KEY` / `AZURE_SPEECH_REGION` | — / eastus | (cấu hình, chưa dùng) |

JPA `ddl-auto: validate` → schema chỉ do Flyway quản lý.

### Frontend (`.env.local`)

| Var | Default | Dùng cho |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080` | base URL API |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | — | push notification (optional) |

---

## 9. Tests

| File | Phạm vi |
|---|---|
| `backend/.../service/Sm2ServiceTest.java` | 16 test — rep đầu/2/sau, đổi ease, fail, biên, chuỗi 5 review |
| `backend/.../service/LevenshteinServiceTest.java` | 16 test — match hoàn hảo, case-insensitive, strip dấu, partial, rỗng, dư từ, edit distance |

**Chưa có:** controller/integration test, security test, repository test, frontend test (unit/e2e). Xem [ROADMAP.md](./ROADMAP.md).

---

## 10. Cách Chạy

```bash
# Hạ tầng (Postgres + Redis)
docker compose up -d

# Backend
cd backend && mvn spring-boot:run          # → :8080
#   set OPENAI_API_KEY để chấm phát âm (fallback graceful nếu thiếu)

# Frontend
cd frontend && npm install && npm run dev   # → :3000
#   cp .env.local.example .env.local
```

---

## 11. Khoảng Cách Đã Biết (Known Gaps)

Tóm tắt — chi tiết & ưu tiên trong [ROADMAP.md](./ROADMAP.md):

- Chưa deploy production (chỉ chạy local).
- Nội dung mỏng: ~4 lesson seed, cần audio thực + 10–20 bài.
- Recording shadowing không lưu trữ (no R2/S3); không playback lại được.
- Redis có dependency nhưng chưa dùng (rate limit in-memory, không phân tán).
- Một số endpoint PUBLIC chưa hợp lý về bảo mật (mục 5).
- Test coverage chỉ ở 2 service thuần; thiếu integration/e2e.
- Mobile responsive chưa audit kỹ; chưa đo Core Web Vitals.
- Email reminder, waveform compare native-vs-user: chưa làm.
