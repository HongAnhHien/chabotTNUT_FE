# Analytics API Endpoints

## Trạng thái Dashboard KPI

| # | KPI | Backend | Frontend | Trạng thái |
|---|-----|---------|----------|-----------|
| **Nhóm 1: Tương tác & Sử dụng** |||||
| 1 | Tỷ lệ SV sử dụng (%) | ✅ **Đã có sẵn nội bộ** — `GET api/admin/analytics/overview` → `adoption.student_rate`/`teacher_rate` (không cần chờ `GET /analytics/summary` external) | — | ✅ (xem phần "Trạng thái implement" bên dưới) |
| 2 | Số lượt hỏi TB / tuần | `GET /analytics/summary` → `total_messages` + `unique_users` | Tính `avg = total / unique` | ✅ |
| 3 | WAU — weekly active users | `GET /analytics/trend?days=7` → daily `unique_users` | Line chart | ✅ |
| **Nhóm 2: Học tập & Cảnh báo sớm** |||||
| 4 | Tỷ lệ cải thiện điểm số | ❌ Cần tính năng Quiz | Grouped bar chart | ❌ |
| 5 | Bản đồ vùng rỗng kiến thức | ✅ **Đã implement proxy + enrich** — `GET api/admin/analytics/knowledge-map?subject_id=&days=`. Enrich `total_students` (từ `TeacherClass.sl_dk`, học kỳ = `MAX(hoc_ky)` **scope theo đúng `subject_id`** đang query — không dùng "học kỳ hiện tại" toàn trường vì tính năng này vốn theo môn học, không theo lịch chung), tính `student_rate` + gán màu | Horizontal bar chart, sort theo `unique_users` DESC, top 10, tooltip 3 metric, màu theo % — **chưa làm** | ⚠️ Backend `chatbot_BE` ✅ — chờ frontend UI + chờ TAI-TNUT có data thật (hiện `knowledge_map` vẫn rỗng, chưa có RAG hit nào được log) |
| 6 | Số cảnh báo sớm đã gửi | ❌ Cần Quiz + risk detection | Data table màu Đỏ/Vàng | ❌ |
| **Nhóm 3: Trợ giảng & Giảm tải** |||||
| 7 | Số câu hỏi AI xử lý thay GV | ✅ **Đã implement proxy** — `GET api/chat/analytics/summary` / `GET api/advisor/analytics/summary` → `helpful_rate × total` | Big number card | ✅ |
| 8 | Thời gian GV tiết kiệm | Derive từ #7 | Frontend tự quy đổi (vd: × 3 phút/câu) | ✅ |
| 9 | Số báo cáo học phần tự động | ❌ Thuần chatbot_BE — `GET api/admin/analytics/report?subject_id=` aggregate từ: ChatLog (lượt chat, SV), `weekly()` (WAU), `knowledgeMap()` (chapter hổng), `ExamAssignment` (quiz scores), TAI-TNUT `/api/analytics/summary` (helpful rate, CSAT). Python không cần làm gì | Frontend nhận JSON → render trang in được / export PDF (BE không tự tạo file PDF) | ❌ (chatbot_BE) |
| **Nhóm 4: Chất lượng lõi AI** |||||
| 10 | Tỷ lệ câu trả lời hữu ích | ✅ **Đã implement proxy** — `POST api/chat/feedback` + `GET api/chat/analytics/summary` (TAI-TNUT), `POST api/advisor/feedback` + `GET api/advisor/analytics/summary` (CVHT) → `helpful_rate` | Pie chart | ✅ |
| 11 | Tỷ lệ trích dẫn tài liệu (RAG) | ✅ **Đã có sẵn nội bộ** — `GET api/admin/analytics/overview` → `source_citation_rate` (tính từ `ChatLog.has_sources`, external API mới KHÔNG có field này) | Pie chart | ✅ Mẫu số đã fix (2026-07-13) — `source_citation_rate`/`exam_generation_rate` giờ chỉ tính trên tin nhắn có `subject_id` (TAI-TNUT), không còn bị pha loãng bởi tin nhắn CVHT (luôn `has_sources=false`/`has_exam=false`). |
| 12 | CSAT tổng thể | ✅ **Đã implement proxy** — `POST api/chat/rating` + `POST api/advisor/rating` (score 1-5, `session_id`/`comment` optional). `csat: { avg_score, total_ratings }` tự có sẵn trong `chat/analytics/summary`/`advisor/analytics/summary` (pass-through, không cần đổi gì thêm) | Hiện card nhỏ cuối chat sau **8 tin nhắn** (non-blocking, không dùng modal). Dismiss hoặc rate → ẩn, không hiện lại trong session. **Thuần frontend** — lưu flag `hasRatedSession_{id}` ở state/localStorage, chưa làm. | ⚠️ Backend `chatbot_BE` ✅ — chờ frontend UI |

**Tóm tắt (cập nhật 2026-07-14):** 9 ✅ / 3 ❌ / 2 ⚠️ — #5 và #12 xong phần backend `chatbot_BE`, chỉ còn chờ frontend UI (và #5 còn chờ TAI-TNUT có data RAG hit thật).

---

## Trạng thái implement trong `chatbot_BE` (cập nhật 2026-07-13)

> Đọc phần này trước khi động vào `ChatController`, `AdvisorChatController`, `ChatbotService`, `AdvisorChatbotService`, `AnalyticsController` — tránh làm trùng.

### Đã implement — toàn bộ (session/chat + feedback/analytics)

| Route trong `chatbot_BE` | Controller | Proxy tới |
|---|---|---|
| `POST api/chat/session` | `ChatController::createSession` | TAI-TNUT `/api/session/create` |
| `GET api/chat/sessions` | `ChatController::sessions` | TAI-TNUT `/api/session/list` |
| `GET api/chat/sessions/{id}/history` | `ChatController::history` | TAI-TNUT `/api/session/{id}/history` |
| `DELETE api/chat/sessions/{id}` | `ChatController::deleteSession` | TAI-TNUT `/api/session` |
| `GET api/chat/exam/{exam_id}` | `ChatController::exam` | TAI-TNUT `/api/exam/{id}` |
| `POST api/chat/stream` | `ChatController::stream` | TAI-TNUT `/api/chat/stream` (auto-save `Exam`/`ExamAssignment` khi intent luyện tập, có ghi `ChatLog` đầy đủ `subject_id`/`intent`/`has_exam`/`has_sources`) |
| `POST api/chat/feedback` | `ChatController::feedback` | TAI-TNUT `/api/feedback` |
| `POST api/chat/rating` | `ChatController::rating` | TAI-TNUT `/api/rating` (`score` 1-5, `session_id`/`comment` optional) |
| `GET api/chat/analytics/summary` | `ChatController::analyticsSummary` | TAI-TNUT `/api/analytics/summary` (nhận `?subject_id=` optional) |
| `POST api/advisor/session` | `AdvisorChatController::createSession` | CVHT `/api/session/create` (tự lấy Portal token qua `PortalService`) |
| `PUT api/advisor/sessions/{id}/token` | `AdvisorChatController::refreshToken` | CVHT `/api/session/{id}/token` |
| `GET api/advisor/sessions` | `AdvisorChatController::sessions` | CVHT `/api/session/list` |
| `GET api/advisor/sessions/{id}` | `AdvisorChatController::session` | CVHT `/api/session/{id}` (có fallback tự đặt title tạm nếu CVHT chưa kịp gán async) |
| `DELETE api/advisor/sessions/{id}` | `AdvisorChatController::deleteSession` | CVHT `/api/session/{id}` |
| `POST api/advisor/chat` | `AdvisorChatController::chat` | CVHT `/api/chat` (non-stream) |
| `POST api/advisor/chat/stream` | `AdvisorChatController::stream` | CVHT `/api/chat/stream` (có ghi `ChatLog` khi stream kết thúc — `subject_id`/`intent`/`has_exam`/`has_sources` để null/false vì CVHT không có khái niệm đó) |
| `POST api/advisor/feedback` | `AdvisorChatController::feedback` | CVHT `/api/feedback` |
| `POST api/advisor/rating` | `AdvisorChatController::rating` | CVHT `/api/rating` (`score` 1-5, `session_id`/`comment` optional) |
| `GET api/advisor/analytics/summary` | `AdvisorChatController::analyticsSummary` | CVHT `/api/analytics/summary` |
| `GET api/advisor/analytics/trend` | `AdvisorChatController::analyticsTrend` | CVHT `/api/analytics/trend` (nhận `?days=`, mặc định 7) |

Service: `app/Services/ChatbotService.php` (TAI-TNUT), `app/Services/AdvisorChatbotService.php` (CVHT).
Config URL: `services.chatbot.url` = env `CHATBOT_API_URL`, `services.advisor.url` = env `ADVISOR_API_URL`.

Đã verify end-to-end (JWT thật, gọi thẳng 2 service ngoài) — không còn việc gì tồn đọng từ danh sách "cần thêm" trước đó.

### Analytics nội bộ đã có sẵn (độc lập với API feedback/analytics mới ở dưới — tính từ `ChatLog` trong Mongo)

| Route | Controller | Ghi chú |
|---|---|---|
| `GET api/admin/analytics/overview` | `AnalyticsController::overview` | có `adoption.student_rate`/`teacher_rate`, `source_citation_rate`, `exam_generation_rate` |
| `GET api/admin/analytics/by-subject` | `AnalyticsController::bySubject` | group theo `subject_id` |
| `GET api/admin/analytics/by-user` | `AnalyticsController::byUser` | group theo `username` |
| `GET api/admin/analytics/weekly` | `AnalyticsController::weekly` | group theo tuần thật (12 tuần gần nhất) — dùng cho KPI WAU |
| `GET api/admin/analytics/knowledge-map` | `AnalyticsController::knowledgeMap` | Proxy TAI-TNUT `/api/analytics/knowledge-map` + enrich `total_students`/`student_rate`/`color` (xem mục #5 bên dưới) |

**✅ Đã fix (2026-07-13):** Trước đây `ChatLog` chỉ được ghi trong `ChatbotService::stream()` (TAI-TNUT), khiến 4 route trên chỉ phản ánh chatbot môn học, vô hình hoàn toàn dữ liệu CVHT. Đã bổ sung ghi `ChatLog` trong `AdvisorChatbotService::stream()` (parse SSE, bắt event `done:true`, giống pattern TAI-TNUT) — `AdvisorChatController::stream()` truyền thêm `user._id`/`role` xuống service. Đã verify: gửi tin qua `advisor/chat/stream` → `ChatLog` ghi đúng bản ghi mới (`subject_id: null`) → `admin/analytics/overview` phản ánh đúng số liệu gộp cả 2 chatbot.

Lưu ý: `by_intent` trong `overview()` sẽ không có entry cho tin nhắn CVHT (vì `intent` luôn null ở nguồn CVHT) — đây là hạn chế đã biết, không phải bug.

**✅ Đã fix thêm (2026-07-13):** Sau khi gộp CVHT vào `ChatLog`, `source_citation_rate`/`exam_generation_rate` trong `overview()` bị pha loãng vì mẫu số (`total_messages`) tính cả tin nhắn CVHT (luôn `has_sources=false`/`has_exam=false`). Đã sửa: 2 tỷ lệ này giờ dùng mẫu số riêng `$totalSubjectMessages` (chỉ đếm `subject_id != null`, tức TAI-TNUT), còn `total_messages`/`unique_users`/`adoption` vẫn giữ nguyên tính trên toàn bộ 2 chatbot.

### ✅ #5 Bản đồ vùng rỗng kiến thức — Đã implement (2026-07-14)

`GET api/admin/analytics/knowledge-map?subject_id=&days=` — proxy `ChatbotService::knowledgeMap()` → TAI-TNUT `/api/analytics/knowledge-map`, enrich trong `AnalyticsController::knowledgeMap()`:

1. Gọi TAI-TNUT `GET /api/analytics/knowledge-map?subject_id=&days=`
2. `$hocKy = TeacherClass::where('ma_mon', $subjectId)->max('hoc_ky')` — lấy học kỳ **gần nhất mà chính môn này** có dữ liệu lớp đã sync, KHÔNG dùng "học kỳ hiện tại" của toàn trường (tính năng này scope theo `subject_id`, một môn có thể không dạy ở kỳ hiện tại nhưng vẫn có data ở kỳ trước — ép về kỳ hiện tại sẽ trả sai `0` dù thực ra có data).
   - Dùng `MAX(hoc_ky)` trong `TeacherClass` (không phải `TeacherSemester`) vì `TeacherClass` chỉ được ghi khi ai đó **thực sự sync lịch dạy có thật** — không dính học kỳ tương lai/mở đăng ký trước như `TeacherSemester` (đã verify: `TeacherSemester` có thể chứa kỳ tương lai kiểu `20261` do Portal tạo sẵn cho đăng ký, nhưng `TeacherClass` thì không, vì chưa ai sync lịch dạy thật cho kỳ đó).
   - *(Cách cũ dùng `TeacherSemester.is_current` mới sync nhất đã bị bỏ — sai vì gắn nhầm khái niệm "kỳ hiện tại toàn trường" vào 1 API vốn theo môn học; đã verify thực tế: môn `180000` trả sai `total_students=0` theo cách cũ, trả đúng `98` theo cách mới.)*
3. `total_students = TeacherClass::where('ma_mon', $subjectId)->where('hoc_ky', $hocKy)->sum('sl_dk')`
4. `student_rate = round(unique_users/total_students*100, 1)` — nếu `total_students == 0` (chưa giáo viên nào sync lớp cho môn này) thì trả `student_rate: null`, `color: null` thay vì số sai lệch
5. Màu: `>= 30%` → `red`, `15–29%` → `yellow`, `< 15%` → `green`

**⚠️ Hạn chế còn tồn đọng (chưa fix, chấp nhận rủi ro):** nếu môn có nhiều giáo viên dạy nhưng chỉ 1 số đã sync lớp, `total_students` sẽ bị **undercount** (không phải `0` nên safeguard ở bước 4 không kích hoạt) → `student_rate` bị thổi phồng giả tạo, có thể tô nhầm màu đỏ. Không có nguồn dữ liệu nào khác để biết "tổng SV thật" ngoài chính data sync này — khó fix triệt để.

Đã verify: validation `subject_id` required (422 nếu thiếu), `total_students`/`hoc_ky` resolve đúng theo data Mongo thật (test chéo 2 môn cho kết quả khác biệt đúng như kỳ vọng), logic tính `student_rate`/màu đúng (test với data giả lập vì TAI-TNUT chưa có RAG hit log thật — `knowledge_map` hiện trả rỗng, không phải lỗi code).

**Fix phụ trong lúc làm #5** — `app/Services/TeacherSyncService.php::getCourses()`: trước đây sync chỉ upsert, không xóa `TeacherClass` cũ khi Portal không còn trả về (giáo viên bị gỡ khỏi lớp, môn bị hủy...) → dữ liệu tồn đọng làm sai `total_students`. Đã thêm bước xóa tổ học không còn trong response Portal mới nhất (có guard: bỏ qua nếu response rỗng, tránh xóa sạch do Portal lỗi tạm thời). Đã verify bằng test tạo bản ghi rác + gọi lại sync.

### ✅ #12 CSAT — Đã implement (2026-07-14)

`POST api/chat/rating` và `POST api/advisor/rating` đã thêm trong `ChatController`/`AdvisorChatController` (service `rating()` trong `ChatbotService`/`AdvisorChatbotService`), cùng pattern với `feedback`. Đã verify thật: gửi rating → `chat/analytics/summary`/`advisor/analytics/summary` trả đúng `csat: { total_ratings, avg_score, max_score }`. Validation: `score` bắt buộc 1-5, `session_id`/`comment` optional.

Còn thiếu (frontend, chưa làm) — flow khi implement:
```
Đếm tin nhắn trong session hiện tại
  → Đủ 8 tin nhắn + chưa rate session này → hiện card nhỏ cuối chat:
      "Chatbot có hữu ích không?"  ⭐⭐⭐⭐⭐  [Bỏ qua]
  → Bấm sao → POST api/chat/rating { session_id, user_id, score }
              → ẩn card, set flag hasRatedSession_{id} = true
  → Bấm "Bỏ qua" → ẩn card, set flag (không hiện lại)

Xóa session → DELETE luôn, không hỏi rating
```

### ❌ #9 Báo cáo học phần tự động — Chưa implement (chatbot_BE)

`GET api/admin/analytics/report?subject_id=` — aggregate tất cả data đã có thành 1 response duy nhất cho GV xem/export. Python không cần làm gì thêm.

**Data sources (đều đã có sẵn):**

| Field trong report | Lấy từ |
|---|---|
| `usage.total_messages`, `usage.unique_users` | `ChatLog` query theo `subject_id` |
| `usage.trend` | `AnalyticsController::weekly()` |
| `knowledge_map` | `AnalyticsController::knowledgeMap()` (đã có `student_rate`/`color`) |
| `exam.avg_score`, `exam.submissions` | `ExamAssignment` query theo `subject_id` |
| `quality.helpful_rate`, `quality.csat` | TAI-TNUT `GET /api/analytics/summary?subject_id=` — **lưu ý:** `helpful_rate` và `csat.avg_score` có thể là `null` khi chưa có feedback/rating, BE phải null-check trước khi tính toán |

**KPI "số báo cáo tự động tạo"** trên dashboard = đếm số `subject_id` distinct đã từng được gọi endpoint này (log vào Mongo collection `ReportLog` mỗi khi gọi, hoặc đơn giản hơn: đếm `ChatLog.subject_id` distinct có `total > 0`).

Response mẫu:
```json
{
  "subject_id": "LTTT",
  "generated_at": "2026-07-14T10:00:00Z",
  "usage": {
    "total_messages": 540,
    "unique_users": 62,
    "trend": [...]
  },
  "knowledge_map": [...],
  "exam": { "avg_score": 7.2, "submissions": 98 },
  "quality": { "helpful_rate": 84.5, "csat": { "avg_score": 4.1, "total_ratings": 34 } }
}
```

### Đã CHỦ ĐÍCH không làm (trùng với analytics nội bộ)

`chat/analytics/trend` và `chat/analytics/subjects` (TAI-TNUT) **không proxy** — trùng với `AnalyticsController::weekly()` (WAU, group theo tuần thật) và `AnalyticsController::bySubject()` (so sánh liên môn) đã có sẵn, xem bảng "Analytics nội bộ đã có sẵn" ở trên. Đừng thêm lại 2 route này trừ khi lý do cụ thể (VD: cần `active_now` real-time theo môn mà nội bộ không có).

---

## TAI-TNUT (Chatbot trợ giảng) — port 5000

> Router prefix `/api` — tất cả endpoint đều bắt đầu bằng `/api/...`

| Method | Path | Params | Mô tả |
|--------|------|--------|--------|
| POST | `/api/feedback` | FormData: `message_id`, `user_id`, `value` (`like`/`dislike`) | Ghi nhận like/dislike per message — **chỉ student**, teacher nhận `403` |
| POST | `/api/rating` | FormData: `user_id`, `score` (1-5), `session_id` (optional), `comment` (optional) | Ghi nhận CSAT sau session |
| GET | `/api/analytics/summary` | `?subject_id=` (optional) | Unique users, tổng tin nhắn, helpful rate, active now, csat |

`message_id` lấy từ field `message_id` trong response `/api/chat` hoặc event `done` của `/api/chat/stream`.

---

## CVHT (Chatbot cố vấn học tập)

| Method | Path | Params | Mô tả |
|--------|------|--------|--------|
| POST | `/api/feedback` | FormData: `message_id`, `user_id`, `value` (`like`/`dislike`) | Ghi nhận like/dislike per message — **chỉ student**, teacher nhận `403` |
| POST | `/api/rating` | FormData: `user_id`, `score` (1-5), `session_id` (optional), `comment` (optional) | Ghi nhận CSAT sau session |
| GET | `/api/analytics/summary` | — | Unique users, tổng tin nhắn, helpful rate, active now, csat |
| GET | `/api/analytics/trend` | `?days=7` | Time series theo ngày |

---

## Response mẫu

**GET /analytics/summary**
```json
{
  "unique_users": 142,
  "unique_by_role": { "student": 120, "teacher": 22 },
  "total_messages": 1830,
  "helpful_rate": { "rate": 87.3, "count": 142 },
  "active_now": 5,
  "active_by_role": { "student": 4, "teacher": 1 },
  "csat": { "total_ratings": 38, "avg_score": 4.2, "max_score": 5 }
}
```

> **Lưu ý null:** `helpful_rate` trả `null` khi chưa có feedback nào. Khi có data, trả object `{"rate": 87.3, "count": 142}` — frontend hiển thị `rate` kèm `(n=count)` để người xem tự đánh giá độ tin cậy theo sample size. `csat.avg_score` tương tự: `null` khi chưa có rating.

**GET /analytics/trend?days=7**
```json
{
  "trend": [
    { "date": "2026-07-07", "message_count": 210, "unique_users": 38 },
    { "date": "2026-07-08", "message_count": 195, "unique_users": 35 }
  ]
}
```

**GET /analytics/subjects** *(TAI-TNUT only)*
```json
{
  "subjects": [
    { "subject_id": "LTTT", "message_count": 540, "unique_users": 62 },
    { "subject_id": "CSDL", "message_count": 310, "unique_users": 44 }
  ]
}
```
