# Shadowling — Go-Forward Roadmap

> Kế hoạch cho công việc **còn lại**. Hệ thống as-built mô tả trong [SPEC.md](./SPEC.md).
> Lịch sử 20-tuần & trạng thái chi tiết: [plan.md](./plan.md) (gốc), [checklist.md](./checklist.md).
>
> Cập nhật: 2026-06-02.

---

## Bối Cảnh

4 phase MVP→Gamification đã implement (58/70 mục trong checklist). App chạy được local nhưng **chưa lên production và nội dung còn mỏng**. Roadmap này gom phần còn lại thành các đợt theo giá trị thực tế, mỗi mục kèm tiêu chí verify để loop độc lập.

**Nguyên tắc ưu tiên:** ship được cho người dùng thật trước (deploy + nội dung), rồi đến trải nghiệm/độ tin cậy, cuối cùng là tính năng "nice-to-have".

---

## Đợt 1 — Đưa Lên Production (ưu tiên cao nhất)

Mục tiêu: một người lạ truy cập URL công khai và học được một bài hoàn chỉnh.

### 1.1 Deploy hạ tầng
- Backend: Railway / Render / Fly.io — Spring Boot + managed PostgreSQL + Redis.
- Frontend: Vercel — set `NEXT_PUBLIC_API_URL` trỏ về backend public.
- Set secrets thật: `JWT_SECRET` (đừng dùng default), `OPENAI_API_KEY`, DB creds.
- → **Verify:** truy cập domain frontend, đăng ký tài khoản mới, làm 1 bài dictation, điểm lưu lại sau khi reload.

### 1.2 CORS & cấu hình production
- Thay `allowedOriginPatterns=*` bằng allowlist domain frontend thật (xem `config/SecurityConfig.java`).
- → **Verify:** request từ domain lạ bị chặn; từ frontend chính hoạt động.

### 1.3 Siết bảo mật endpoint PUBLIC (xem SPEC mục 5)
- Cân nhắc chuyển sang authenticated: `/api/speech/*`, `/api/practice/score/dictation`, `/api/words/lesson/{id}`. Giữ PUBLIC có chủ đích: `/api/gamification/leaderboard`.
- Rate limit hiện in-memory per-JVM — nếu scale >1 instance, chuyển sang Redis-backed (Redis đã có sẵn dependency).
- → **Verify:** gọi endpoint nhạy cảm không kèm token → 401.

---

## Đợt 2 — Nội Dung Thực (ưu tiên cao)

App rỗng nội dung thì không giữ chân được người dùng. Đây là việc nội dung + một ít công cụ.

### 2.1 Seed 10–20 bài học thật
- Audio native (license rõ ràng) + transcript chuẩn `[{start,end,text}]`.
- Phủ đủ level (BEGINNER/INTERMEDIATE/ADVANCED) và topic (giao tiếp, business, IELTS/TOEIC, du lịch).
- Dùng Admin CMS có sẵn (`/admin/lessons`) + import SRT/VTT.
- → **Verify:** `/lessons` filter theo từng level/topic đều có ≥3 bài; mỗi bài play audio + transcript khớp.

### 2.2 Host audio
- Quyết định nơi lưu audio bài học (R2/S3/CDN) thay vì URL rời rạc.
- → **Verify:** audio load nhanh, không 404, chạy được trên mạng di động.

---

## Đợt 3 — Hoàn Thiện Trải Nghiệm (ưu tiên trung)

### 3.1 Playback recording shadowing
- Sau khi ghi âm, cho người dùng nghe lại giọng mình trước/sau khi chấm (`ShadowingMode.tsx`).
- → **Verify:** ghi âm → bấm play → nghe lại được; không cần round-trip server.

### 3.2 Mobile responsive audit
- Rà toàn bộ trang trên màn nhỏ (≤375px): Navbar sidebar, flashcard, dictation input, charts.
- → **Verify:** không tràn ngang, nút recording/flashcard chạm được, sidebar collapse hợp lý.

### 3.3 Lưu recording (tùy chọn)
- Nếu cần phân tích/nghe lại sau: upload lên R2/S3, ghi vào `recording_uploads` (bảng đã có).
- → **Verify:** recording xuất hiện trong history, mở lại được.

---

## Đợt 4 — Độ Tin Cậy & Chất Lượng (ưu tiên trung)

### 4.1 Mở rộng test
- Backend: integration test cho `AuthController` (register/login/JWT), `PracticeController` (XP award), `WordController` (SM-2 review flow). Hiện chỉ có 2 unit test service.
- Frontend: smoke test cho luồng login → dictation → save.
- → **Verify:** `mvn test` xanh; CI chạy test mỗi push.

### 4.2 Monitoring thật
- Nối `lib/monitoring.ts` (đang là Sentry-ready stub) vào Sentry thật + backend error tracking.
- → **Verify:** lỗi cố tình ở prod hiện trong dashboard Sentry.

### 4.3 CI/CD
- GitHub Actions: build + test backend & frontend, auto-deploy khi merge `main`.
- → **Verify:** PR chạy test; merge → deploy tự động.

---

## Đợt 5 — Tăng Trưởng & Nice-to-Have (ưu tiên thấp)

Cân nhắc làm sau khi có traffic thật.

| Mục | Ghi chú |
|---|---|
| Email reminder ("X từ cần ôn hôm nay") | cần SendGrid/Resend; bổ sung cho push đã có |
| Core Web Vitals audit (LCP/CLS/INP) | đo sau khi có người dùng thật |
| Load testing (k6) | sau deploy, trước khi scale |
| Waveform compare native vs user | UX benefit thấp, phức tạp — cân nhắc bỏ |
| Vocabulary analytics (retention, forgetting curve) | xem [flashcardPlan.md](./flashcardPlan.md) Phase C |
| New-card graduation steps (Anki-style) | xem [flashcardPlan.md](./flashcardPlan.md) Phase C |

**Có thể bỏ hẳn (low ROI, đã quyết trong checklist):** i18n/language switcher (app native tiếng Việt), thumbnail tự động, static generation cho lesson page (auth-protected).

---

## Tóm Tắt Ưu Tiên

```
Đợt 1  Deploy + bảo mật prod        ← làm trước, mở khóa mọi thứ
Đợt 2  Nội dung thật (10–20 bài)    ← song song được với Đợt 1
Đợt 3  Playback + mobile            ← sau khi có người dùng thật
Đợt 4  Test + monitoring + CI       ← củng cố trước khi scale
Đợt 5  Email, analytics, k6...      ← khi có traffic
```

**Bước kế tiếp đề xuất:** chốt nền tảng deploy (Đợt 1.1) và bắt đầu gom audio/transcript cho Đợt 2 — hai việc này không chặn nhau.
