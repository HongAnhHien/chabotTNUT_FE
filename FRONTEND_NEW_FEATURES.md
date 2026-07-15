# Tính năng mới cho Frontend — Feedback / Rating / Analytics / Báo cáo

Tài liệu này dành cho FE implement 6 tính năng backend mới xong (2026-07-14/15). Tất cả đã test thật với server, request/response bên dưới là data thật, không phải mock.

**Auth chung:** mọi endpoint đều cần header `Authorization: Bearer {jwt}` (JWT lấy từ `POST /api/auth/login`, xem `chatbot_advisor.postman_collection.json` để biết flow login). 3 endpoint cuối (`knowledge-map`, `report`) chỉ user `role: admin` gọi được — user thường gọi sẽ bị 403.

---

## 1. Like/Dislike một câu trả lời (Feedback)

| | Chat môn học | CVHT |
|---|---|---|
| Endpoint | `POST /api/chat/feedback` | `POST /api/advisor/feedback` |

**Body (form-data):**
| Field | Bắt buộc | Ghi chú |
|---|---|---|
| `message_id` | ✅ | Lấy từ field `message_id` trong response của `chat`/`chat/stream` (xem mục "Nguồn `message_id`" bên dưới) |
| `value` | ✅ | `"like"` hoặc `"dislike"` |

**Response thành công:**
```json
{ "success": true }
```
**Response lỗi** (không kết nối được service ngoài):
```json
{ "success": false, "message": "Không thể gửi feedback." }
```
HTTP 502.

**UI gợi ý:** icon 👍/👎 nhỏ dưới mỗi tin nhắn AI. Bấm 1 trong 2 → gọi API → disable cả 2 nút (chỉ cho vote 1 lần/tin nhắn), có thể tô màu nút đã chọn. Không cần optimistic rollback phức tạp vì API rất nhẹ.

### Nguồn `message_id`

- **Non-stream** (`POST chat/chat`, `POST advisor/chat`): field `message_id` nằm ngay trong response JSON, cùng cấp với `reply`.
  ```json
  { "success": true, "reply": "...", "message_id": "d53c3167-...", "intent": "...", "session": {...} }
  ```
- **Stream** (`POST chat/chat/stream`, `POST advisor/chat/stream`): `message_id` chỉ xuất hiện ở **event cuối cùng** (event có `done: true`), KHÔNG xuất hiện ở các event `done: false`.
  ```
  data: {"content": "...", "done": false}
  data: {"content": "...", "done": false}
  data: {"content": "", "done": true, "full_response": "...", "message_id": "96e78f36-..."}
  ```
  → FE parse SSE, khi thấy `done: true` thì lưu `message_id` từ event đó gắn vào tin nhắn AI vừa render xong, để dùng cho nút like/dislike và rating.

---

## 2. Đánh giá CSAT sau session (Rating 1-5 sao)

| | Chat môn học | CVHT |
|---|---|---|
| Endpoint | `POST /api/chat/rating` | `POST /api/advisor/rating` |

**Body (form-data):**
| Field | Bắt buộc | Ghi chú |
|---|---|---|
| `score` | ✅ | Số nguyên 1-5. Sai (VD 6, 0, chữ) → HTTP 422 |
| `session_id` | ❌ | optional |
| `comment` | ❌ | optional, tối đa 1000 ký tự |

**Response thành công:**
```json
{ "success": true }
```
**Response lỗi validate (422):**
```json
{ "message": "The score field must not be greater than 5.", "errors": { "score": ["..."] } }
```

**UI/flow đề xuất** (theo thiết kế gốc trong `API_ENDPOINTS.md`):
```
Đếm số tin nhắn trong session hiện tại (client-side, không cần API riêng)
  → Đủ 8 tin nhắn + session này CHƯA rate
     → hiện card nhỏ, không chặn thao tác (non-blocking, không dùng modal):
         "Chatbot có hữu ích không?"  ⭐⭐⭐⭐⭐   [Bỏ qua]
  → Bấm sao (score)
     → POST .../rating { session_id, score }
     → ẩn card, lưu flag `hasRatedSession_{session_id} = true` (localStorage hoặc state)
  → Bấm "Bỏ qua"
     → ẩn card, vẫn lưu flag (không hiện lại trong session đó nữa, dù chưa rate)
  → User xóa session → xóa luôn, KHÔNG hỏi rating trước khi xóa
```
Toàn bộ logic đếm tin nhắn/hiện card/lưu flag là **thuần frontend** — backend không có endpoint hỗ trợ đếm hộ.

---

## 3. Thống kê tổng quan (Analytics Summary)

| | Chat môn học | CVHT |
|---|---|---|
| Endpoint | `GET /api/chat/analytics/summary?subject_id=` (subject_id optional) | `GET /api/advisor/analytics/summary` (không có param) |

**Response thật:**
```json
{
  "success": true,
  "data": {
    "unique_users": 1,
    "total_messages": 2,
    "helpful_rate": 100,
    "active_now": 1,
    "csat": { "total_ratings": 1, "avg_score": 5, "max_score": 5 }
  }
}
```
`csat` sẽ là `null`/thiếu nếu chưa có ai rating.

**UI gợi ý:** thẻ số (card) cho `unique_users`, `total_messages`, `helpful_rate` (%), `active_now`; pie/star cho `csat.avg_score`.

---

## 4. Xu hướng theo ngày (Trend) — chỉ có ở CVHT

Endpoint: `GET /api/advisor/analytics/trend?days=7` (`days` optional, mặc định 7)

```json
{ "success": true, "data": { "trend": [
  { "date": "2026-07-13", "message_count": 3, "unique_users": 1 }
] } }
```

**⚠️ Chat môn học KHÔNG có endpoint này** — dùng `GET /api/admin/analytics/weekly` (mục 6 bên dưới, cần quyền admin) thay thế cho line chart theo tuần, chính xác hơn vì group theo tuần thật thay vì cộng dồn theo ngày.

**UI gợi ý:** line chart, trục X = ngày, trục Y = `message_count`/`unique_users`.

---

## 5. Bản đồ vùng rỗng kiến thức (chỉ Admin, chỉ chat môn học — CVHT không có khái niệm chương/môn)

Endpoint: `GET /api/admin/analytics/knowledge-map?subject_id=180000&days=30`

| Query param | Bắt buộc | Ghi chú |
|---|---|---|
| `subject_id` | ✅ | thiếu → HTTP 422 |
| `days` | ❌ | 0 hoặc bỏ qua = toàn bộ thời gian |

**Response thật:**
```json
{
  "success": true,
  "total_students": 7,
  "hoc_ky": 20254,
  "knowledge_map": [
    {
      "chapter": 3,
      "chapter_title": "Điều chế tín hiệu",
      "hit_count": 142,
      "unique_users": 3,
      "avg_hits_per_user": 47.3,
      "student_rate": 42.9,
      "color": "red"
    }
  ]
}
```

**`color`** đã tính sẵn ở backend theo `student_rate`: `>=30%` → `"red"`, `15–29%` → `"yellow"`, `<15%` → `"green"`. `student_rate`/`color` có thể là `null` nếu `total_students = 0` (chưa có giáo viên nào sync lớp cho môn này) — **FE nên hiển thị "chưa đủ dữ liệu" thay vì coi null là 0%**, tránh hiểu nhầm là "không ai hỏi chương này".

**UI gợi ý:** Horizontal bar chart, sort theo `unique_users` DESC, lấy top 10, tô màu theo `color`, tooltip hiện cả 3 số (`hit_count`, `unique_users`, `avg_hits_per_user`).

**Hạn chế đã biết:** hiện `knowledge_map` có thể trả mảng rỗng `[]` nếu TAI-TNUT chưa log đủ dữ liệu RAG hit — không phải lỗi, chỉ là chưa đủ traffic thật.

---

## 6. Thống kê theo tuần toàn trường/1 môn (Admin)

Endpoint: `GET /api/admin/analytics/weekly` — trả về 12 tuần gần nhất, **không filter theo môn** (dùng cho dashboard tổng, không dùng riêng cho 1 subject — nếu cần theo môn thì dùng mục 7 `report`).

```json
{ "success": true, "data": [
  { "week": "27/04", "total_messages": 0, "unique_users": 0, "exams_created": 0, "by_role": {} },
  ...
] }
```

---

## 7. Báo cáo học phần tự động (Admin) — endpoint tổng hợp

Endpoint: `GET /api/admin/analytics/report?subject_id=180000&days=30`

Gộp 5 nguồn trong 1 lần gọi: chat stats, xu hướng tuần (đã filter theo môn), bản đồ vùng rỗng kiến thức, kết quả quiz, và helpful_rate/CSAT từ chatbot ngoài.

**Response thật (đã test):**
```json
{
  "success": true,
  "subject": { "ma_mon": "TEE0109", "ten_mon": "Nhập môn ngành KT điện tử viễn thông" },
  "chat": {
    "total_messages": 0,
    "unique_users": 0,
    "unique_sessions": 0,
    "exams_created": 0,
    "messages_with_sources": 0,
    "helpful_rate": 100,
    "active_now": 1,
    "csat": { "total_ratings": 1, "avg_score": 5, "max_score": 5 }
  },
  "weekly_trend": [
    { "week": "27/04", "total_messages": 0, "unique_users": 0, "exams_created": 0, "by_role": [] }
    /* ... đủ 12 tuần, ĐÃ filter theo subject_id ... */
  ],
  "knowledge_map": {
    "total_students": 7,
    "hoc_ky": 20254,
    "knowledge_map": []
  },
  "quiz": {
    "assignments_count": 0,
    "submissions_count": 0,
    "avg_score_percent": null
  }
}
```

`quiz.avg_score_percent` là `null` nếu môn chưa có bài nộp nào (`submissions_count = 0`) — không phải 0%, tránh vẽ biểu đồ hiểu nhầm "học sinh làm bài được 0 điểm".

`helpful_rate`/`active_now`/`csat` trong `chat` có thể thiếu (field rỗng) nếu chatbot môn học (TAI-TNUT) đang offline — backend đã xử lý graceful (không 500), phần còn lại của report vẫn đầy đủ.

**UI gợi ý:** trang "Báo cáo học phần" — FE tự render layout in được / xuất PDF (client-side, ví dụ dùng `window.print()` hoặc thư viện PDF phía FE) — **backend không tự sinh file PDF**, chỉ trả JSON.

---

## Tổng hợp route

| Method | Endpoint | Quyền |
|---|---|---|
| POST | `/api/chat/feedback` | user đã login |
| POST | `/api/advisor/feedback` | user đã login |
| POST | `/api/chat/rating` | user đã login |
| POST | `/api/advisor/rating` | user đã login |
| GET | `/api/chat/analytics/summary?subject_id=` | user đã login |
| GET | `/api/advisor/analytics/summary` | user đã login |
| GET | `/api/advisor/analytics/trend?days=` | user đã login |
| GET | `/api/admin/analytics/knowledge-map?subject_id=&days=` | **admin** |
| GET | `/api/admin/analytics/weekly` | **admin** |
| GET | `/api/admin/analytics/report?subject_id=&days=` | **admin** |

