# Parroto.app — Phân Tích Tính Năng

> Parroto là ứng dụng học tiếng Anh tập trung vào kỹ năng nghe và nói qua hai phương pháp: **Dictation** (nghe chép chính tả) và **Shadowing** (nói nhại theo), kết hợp với **Spaced Repetition** để ghi nhớ từ vựng lâu dài.

---

## Tính Năng Cốt Lõi

### 1. Dictation (Nghe Chép Chính Tả)
- Người dùng nghe audio/video từ người bản xứ và gõ lại nội dung
- Hệ thống tự động kiểm tra độ chính xác theo từng từ
- Text tự động hiện ra khi người dùng gõ đúng (auto-reveal)
- Highlight lỗi sai, gợi ý sửa ngay lập tức
- Hỗ trợ điều chỉnh tốc độ phát lại (slow down / speed up)

### 2. Shadowing (Nói Nhại Theo)
- Người dùng nghe và nói nhại theo nhịp điệu, ngữ điệu của native speaker
- Ghi âm giọng nói người dùng
- AI chấm điểm phát âm, độ lưu loát và ngữ điệu
- Phản hồi chi tiết: chỉ ra âm sai, đề xuất cách phát âm chuẩn

### 3. Spaced Repetition — Vocabulary
- Tự động lưu từ mới xuất hiện trong bài
- Hệ thống flashcard theo thuật toán Spaced Repetition (SM-2 hoặc tương tự)
- Nhắc ôn từ đúng thời điểm trước khi quên
- Thống kê số từ đã học / đang ôn / thuộc lòng

---

## Frontend

### Dashboard
- Tổng quan tiến độ học: streak, số bài hoàn thành, thời gian học
- Bài học đang dang dở (in-progress lessons)
- Gợi ý bài học tiếp theo theo level và mục tiêu
- Progress bar trực quan theo từng kỹ năng

### Lesson Browser
- Bộ lọc theo cấp độ: Beginner / Intermediate / Advanced
- Bộ lọc theo chủ đề: Giao tiếp hàng ngày, Business, Du lịch, Phim ảnh, Truyện cổ tích, IELTS/TOEIC/TOEFL
- Card bài học hiển thị: thumbnail, thời lượng, level, chủ đề
- Trạng thái bài học: chưa học / đang học / hoàn thành

### Giao Diện Luyện Tập
- Audio/video player tích hợp với thanh waveform
- Nút điều khiển: play/pause, rewind, tốc độ phát lại
- Text input cho Dictation mode
- Recording button + waveform visualization cho Shadowing mode
- Hiển thị transcript từng câu (sentence-by-sentence)
- Màu sắc phân biệt đúng/sai theo từ

### Progress & Analytics
- Tab tiến độ riêng biệt
- Biểu đồ lịch sử học tập theo ngày/tuần
- Báo cáo điểm mạnh / điểm yếu theo âm, từ loại
- Lịch học và streak tracking

### Vocabulary Manager
- Danh sách từ đã lưu
- Flashcard review theo session
- Lịch ôn tập đề xuất theo Spaced Repetition

### UX / Accessibility
- Dark Mode / Light Mode toggle
- Hỗ trợ đa ngôn ngữ UI (Tiếng Việt `/vi/`)
- Responsive design: web + mobile
- Onboarding flow cho người dùng mới

---

## Backend

### Authentication & User Management
- Đăng ký / đăng nhập (email, Google OAuth)
- Quản lý hồ sơ người dùng: level, mục tiêu, ngôn ngữ UI
- JWT / session-based authentication

### Lesson Content System
- CMS quản lý bài học: audio/video, transcript, metadata
- Hệ thống tag: level, topic, duration
- CDN để serve audio/video (latency thấp toàn cầu)
- Versioning nội dung bài học

### AI / Speech Processing
- Speech-to-text engine (nhận diện giọng nói người dùng)
- Pronunciation scoring model: so sánh giọng người dùng với native speaker
- Fluency & intonation analysis
- Error detection: phoneme-level feedback

### Spaced Repetition Engine
- Lưu trữ lịch sử ôn tập từng từ của từng user
- Tính toán interval tiếp theo (SM-2 algorithm)
- Notification/reminder trigger khi đến lịch ôn

### Progress & Analytics Engine
- Ghi nhận event: bài học hoàn thành, điểm số, thời gian
- Tính toán streak, tổng giờ học, accuracy rate
- Recommendation engine: gợi ý bài học phù hợp level hiện tại
- Analytics dashboard (internal): DAU, retention, completion rate

### API Layer
- RESTful API (hoặc GraphQL) phục vụ web + mobile app (iOS/Android)
- Rate limiting, caching (Redis) cho nội dung tĩnh
- Webhook / push notification cho nhắc nhở ôn từ

### Infrastructure
- Multi-platform: web app + iOS app + Android app (hoặc React Native)
- Chrome Extension (đã có trên Chrome Web Store)
- Storage: audio recordings của người dùng (temporary hoặc lưu để phân tích)

---

## Design

### Visual Language
- UI tối giản, tập trung vào nội dung học
- Color system: màu accent rõ ràng để phân biệt đúng/sai, level, trạng thái
- Typography dễ đọc, hỗ trợ cả Latin và Unicode (tiếng Việt)

### Component System
- Card-based layout cho lesson browser
- Progress ring / bar cho streak và completion
- Waveform visualizer cho audio playback và recording
- Flashcard flip animation cho vocabulary review
- Modal/drawer cho settings trong khi luyện tập

### Luồng UX Chính
```
Onboarding → Chọn mục tiêu & level → Dashboard
→ Chọn bài → Dictation/Shadowing → Xem kết quả
→ Ôn từ vựng → Quay lại Dashboard
```

### Mobile-First Considerations
- Touch-friendly controls (recording button dễ nhấn)
- Audio playback hoạt động khi khóa màn hình
- Offline mode cho bài đã tải (nice-to-have)

---

## Tiềm Năng Mở Rộng

| Tính năng | Giá trị |
|---|---|
| Leaderboard / Gamification | Tăng retention, tạo cộng đồng |
| Lộ trình học cá nhân hóa (AI-driven) | Tối ưu tốc độ tiến bộ |
| User-generated content | Scale nội dung bài học |
| Live pronunciation class | Monetization |
| Integration với Netflix/YouTube | Học qua nội dung yêu thích |
| B2B / Edu platform | Bán cho trường học, doanh nghiệp |

---

## Nguồn Tham Khảo

- [Parroto.app — Trang chủ](https://parroto.app/)
- [Parroto trên App Store](https://apps.apple.com/us/app/parroto-shadowing-dictation/id6752111996)
- [Review Parroto — VniTeach](https://www.vniteach.com/2026/01/19/parroto-ung-dung-luyen-nghe-noi-tieng-anh-bang-dictation-va-shadowing-hieu-qua/)
- [Parroto Blog](https://parroto.app/blog)
- [Parroto — Chrome Extension](https://chromewebstore.google.com/detail/parroto/dcbalimnhcojlnncmpekpipealmjepod)
