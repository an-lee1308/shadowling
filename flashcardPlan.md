# Kế Hoạch: Flashcard với Active Recall + Spaced Repetition

> Ngày: 2026-05-16
> Mục tiêu: Nâng cấp hệ thống flashcard hiện tại từ "lật thẻ đơn giản" thành hệ thống luyện tập chủ động thực sự.

---

## Vấn Đề Hiện Tại

Hệ thống hiện tại có SM-2 đầy đủ ở backend nhưng frontend chỉ làm một việc: **hiện từ → lật → bấm nút**. Đây là *passive recognition*, không phải active recall.

Người dùng nhìn thấy từ, sau đó nhìn đáp án và tự chấm "dễ/khó" — không có thách thức thực sự, não không buộc phải tự truy xuất thông tin trước khi nhìn đáp án.

---

## Nguyên Lý Active Recall Cần Đảm Bảo

1. **Testing effect** — Ép não tự truy xuất trước khi nhìn đáp án (gõ, chọn, nói)
2. **Desirable difficulty** — Đủ khó để não phải cố gắng, không quá dễ đến mức lướt qua
3. **Immediate feedback** — Phản hồi ngay sau khi trả lời, không delay
4. **Varied retrieval** — Nhiều hướng hỏi để tránh "nhớ vẹt theo pattern"

---

## Brainstorm: Các Loại Thẻ (Card Types)

### Type 1: Word → Definition *(hiện có, cải thiện)*
- Hiện: lật thẻ thụ động
- Nâng cấp: ẩn definition, yêu cầu gõ nghĩa trước khi xem

### Type 2: Definition → Word *(reverse card)*
- Hiện: đọc definition → đoán từ
- Buộc nhớ từ từ nghĩa thay vì nhớ nghĩa từ từ

### Type 3: Fill-in-the-blank
- Lấy `exampleSentence`, ẩn từ target trong câu
- Ví dụ: `"She was completely ___ by the magician's trick."` → gõ `baffled`
- Context clue giúp encoding sâu hơn

### Type 4: Multiple Choice
- 1 câu hỏi + 4 options (1 đúng, 3 sai từ vocabulary pool của user)
- Phù hợp cho giai đoạn đầu khi từ còn mới (repetitions = 0)
- Giảm anxiety, tăng exposure volume

### Type 5: Spelling (nghe → gõ)
- Play audio của từ → user gõ cách viết
- Kết hợp listening + spelling — hai kỹ năng cùng lúc
- Fallback: nếu không có audio_url thì skip type này

### Type 6: Sentence Reconstruction
- Cho các từ bị xáo trộn, sắp xếp lại thành câu đúng từ exampleSentence
- Hiểu cấu trúc câu, không chỉ nghĩa từ đơn lẻ

---

## Brainstorm: Cơ Chế Session

### Session Entity
Hiện tại mỗi review là độc lập, không có context session.

Cần thêm:
```
WordReviewSession
  id, user_id
  started_at, ended_at
  total_cards, correct_count, again_count
  mode (NORMAL / CRAM / WEAK_FOCUS)
  xp_earned
```

### Session Flow
```
1. User chọn deck + mode
2. Backend tạo session, lấy danh sách từ
3. Frontend hiện từng thẻ (shuffle trong session)
4. Sau mỗi thẻ: gửi kết quả + cập nhật SM-2
5. Kết thúc session: summary screen + lưu stats
```

### Smart Card Ordering trong Session
- Từ mới (repetitions = 0): ưu tiên hiện trước
- Từ sắp quên (nextReviewAt gần nhất): ưu tiên tiếp
- Từ leech (AGAIN nhiều lần): xen kẽ, không liên tiếp

---

## Brainstorm: Study Modes

### Mode 1: Normal SRS *(cải thiện hiện có)*
- Chỉ review từ đến hạn (`nextReviewAt <= now`)
- Thứ tự: new cards trước, review cards sau
- Giới hạn: max 20 new + 100 review/ngày (configurable)

### Mode 2: Cram Mode
- Ignore schedule, review tất cả từ trong deck
- Không cập nhật SM-2 interval (không ảnh hưởng lịch)
- Dùng trước kỳ thi/kiểm tra

### Mode 3: Weak Word Focus
- Chỉ review từ có easeFactor thấp nhất
- Tốt để tập trung vào điểm yếu
- Cập nhật SM-2 bình thường

### Mode 4: Lesson Deck
- Review từ vựng của một bài học cụ thể
- Useful ngay sau khi học bài mới

---

## Brainstorm: UX/UI Improvements

### Keyboard Shortcuts
- `Space` / `Enter` → lật thẻ
- `1` → AGAIN, `2` → HARD, `3` → GOOD, `4` → EASY
- `P` → play audio
- Hiện hint overlay lần đầu

### Audio Integration
- Nút play audio trên mặt trước thẻ (nếu có audioUrl)
- Auto-play audio khi thẻ xuất hiện (có thể toggle off)
- Fallback: browser TTS (`window.speechSynthesis`) nếu không có audioUrl

### Progress & Feedback trong Session
- Progress bar: "7 / 20 thẻ"
- Streak counter: "3 liên tiếp" (animate khi tăng)
- Time per card (nội bộ, dùng để phát hiện từ "nhìn đáp án trước")
- Sau mỗi thẻ: hiện interval tiếp theo (`Ôn lại sau 4 ngày`)

### End-of-Session Summary
- Tổng: đúng/sai/lại
- XP kiếm được
- Từ khó nhất session
- Nút: "Ôn thêm từ yếu" hoặc "Về dashboard"

### Leech Detection
- Từ bị AGAIN ≥ 4 lần: đánh dấu là "leech" (thêm field vào UserWord)
- Hiện icon ⚠️ trên thẻ leech
- Gợi ý: "Từ này khó — thử học thêm context từ bài học?"

---

## Brainstorm: Deck Management

### Deck Types
1. **"Hôm nay"** — từ đến hạn review (default)
2. **"Tất cả từ"** — toàn bộ vocabulary
3. **"Từ yếu"** — easeFactor thấp
4. **"Bài [X]"** — từ vựng của một bài học cụ thể

### Custom Deck *(v2, sau này)*
- User tạo deck thủ công, thêm/xóa từ
- Chia sẻ deck với người khác

---

## Brainstorm: Analytics & Retention

### Per-word Stats (mở rộng UserWord)
```
review_history: JSON array [{date, quality, responseTimeMs}]
leech: boolean
suspended: boolean
```

### Trang Analytics Vocabulary
- Retention rate theo thời gian (% từ nhớ được sau N ngày)
- Forgetting curve visualization (so sánh với curve lý thuyết Ebbinghaus)
- Distribution: từ theo cấp độ dễ/khó (easeFactor histogram)
- Heatmap: ngày nào review nhiều nhất
- Dự đoán: "X ngày nữa bạn sẽ có Y từ cần ôn"

---

## Brainstorm: SM-2 Improvements

### Fuzz Factor
Hiện tại: `nextReviewAt = now + intervalDays` (exact)
Vấn đề: tất cả từ học cùng ngày sẽ pile up cùng ngày

Nâng cấp: thêm fuzz ±5-10% vào interval để tránh clustering
```java
int fuzz = (int)(intervalDays * 0.1);
int actualInterval = intervalDays + random(-fuzz, fuzz);
```

### Response Time Factor
Nếu user flip nhanh < 2s và bấm EASY → có thể là "nhớ mặt thẻ", không phải recall thực
Gợi ý: giảm nhẹ quality score nếu response time quá ngắn (optional, experimental)

### New Card Graduation Steps
Anki-style: trước khi vào SRS chính thức, từ mới phải pass 2 lần
```
New → Learning (1 min) → Learning (10 min) → Graduated (1 day) → SRS
```

---

## Phạm Vi Thực Hiện (Đề Xuất)

### Phase A — Core Active Recall *(ưu tiên cao)*
- [ ] Type 3: Fill-in-the-blank (exampleSentence)
- [ ] Type 4: Multiple Choice
- [ ] Keyboard shortcuts (Space, 1-4, P)
- [ ] Audio playback + TTS fallback
- [ ] "Interval tiếp theo" hiển thị trên nút GOOD
- [ ] Session summary screen

### Phase B — Session & Modes *(ưu tiên trung)*
- [ ] WordReviewSession entity + API
- [ ] Study modes: Normal / Cram / Weak Focus
- [ ] Deck selector (Hôm nay / Bài X / Từ yếu)
- [ ] Leech detection + UI indicator
- [ ] Streak counter trong session

### Phase C — Analytics & Smart Scheduling *(ưu tiên thấp)*
- [ ] Fuzz factor trong SM-2
- [ ] Vocabulary retention analytics page
- [ ] Forgetting curve chart
- [ ] Response time tracking (soft signal)
- [ ] New card graduation steps (Anki-style)

---

## Quyết Định Kỹ Thuật Cần Confirm

1. **Card type mặc định theo repetitions?**
   - Gợi ý: repetitions=0 → Multiple Choice; repetitions≥1 → Fill-in-blank; repetitions≥3 → reverse card

2. **Có lưu session riêng không?**
   - Gợi ý: có, để hiện summary + analytics sau này

3. **TTS hay audio file?**
   - Gợi ý: dùng `window.speechSynthesis` làm fallback, ưu tiên audioUrl nếu có

4. **Fuzz factor?**
   - Gợi ý: bật ngay, ít rủi ro, tránh pile-up review

5. **Giới hạn new cards/ngày?**
   - Gợi ý: 20 new + 100 review/ngày, configurable trong settings
