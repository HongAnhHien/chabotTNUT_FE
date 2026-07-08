# Backend cần triển khai thêm

Ghi lại các thay đổi frontend trong phiên làm việc này mà **cần backend bổ sung** để hoạt động đầy đủ. Các API khác đã dùng (login/logout/refresh, export, remind, remind-all, parse-logs, parse-logs/stats...) đều đã có sẵn theo tài liệu API v2 — không liệt kê lại ở đây.

---

## 1. API xem chi tiết bài làm của 1 học sinh (ưu tiên cao)

Frontend đã build đầy đủ UI cho màn "Xem" bài làm học sinh (đúng/sai từng câu, đáp án đã chọn) tại trang chi tiết bài giao (`/teacher/assignments/:id`), nhưng **endpoint chưa tồn tại ở backend**. Hiện tại khi bấm "Xem" trên 1 học sinh đã nộp bài, frontend gọi API này và sẽ nhận lỗi/404 cho đến khi được triển khai.

### Endpoint

```
GET /api/teacher/assignments/{id}/students/{student_code}
🔒 teacher (Bearer token, phải là giáo viên sở hữu bài giao {id})
```

### URL Params

| Param | Mô tả |
|---|---|
| `id` | Mongo `_id` của assignment (ExamAssignment) |
| `student_code` | Mã sinh viên (username), ví dụ `K245520207032` |

### Response 200 mong đợi

```json
{
  "success": true,
  "data": {
    "student_code": "K245520207032",
    "name": "Nguyễn Văn A",
    "status": "submitted",
    "score": 8.0,
    "total": 10,
    "correct_count": 8,
    "submitted_at": "2026-07-12 08:30:00",
    "duration_seconds": 540,
    "questions": [
      {
        "no": 1,
        "question": "Điều chế số trong viễn thông được sử dụng với mục đích gì?",
        "is_correct": true,
        "options": [
          { "letter": "A", "text": "Tối ưu hóa việc sử dụng băng thông tín hiệu", "is_correct": true,  "is_chosen": true },
          { "letter": "B", "text": "Giảm chi phí xây dựng hệ thống truyền tin",   "is_correct": false, "is_chosen": false },
          { "letter": "C", "text": "Tăng cường bảo mật của tín hiệu truyền",      "is_correct": false, "is_chosen": false },
          { "letter": "D", "text": "Đơn giản hóa quá trình truyền dẫn thông tin", "is_correct": false, "is_chosen": false }
        ]
      }
    ]
  }
}
```

### Mô tả field

| Field | Type | Mô tả |
|---|---|---|
| `status` | `submitted` \| `not_started` \| `in_progress` | Trạng thái làm bài của học sinh này |
| `score` / `total` | number \| null | `null` nếu chưa nộp |
| `correct_count` | number \| null | Số câu đúng, `null` nếu chưa nộp |
| `submitted_at` | string \| null | Định dạng `YYYY-MM-DD HH:mm:ss`, `null` nếu chưa nộp |
| `duration_seconds` | number \| null | Thời gian làm bài tính bằng giây |
| `questions` | mảng | **Rỗng nếu học sinh chưa nộp bài** (status ≠ `submitted`) |
| `questions[].options[].is_chosen` | boolean | Đáp án học sinh đã chọn cho câu đó |
| `questions[].options[].is_correct` | boolean | Đáp án đúng của câu hỏi |

### Lưu ý khi triển khai

- Khi `status` không phải `submitted` (chưa làm / đang làm), frontend chỉ cần `student_code`, `name`, `status` — `questions` có thể trả mảng rỗng `[]`.
- Trả `404` nếu `student_code` không thuộc danh sách được giao (`student_ids`) của assignment.
- Trả `403`/`404` nếu assignment không thuộc giáo viên đang đăng nhập (tương tự các endpoint assignment khác).

### File liên quan ở frontend (đã sẵn sàng, chỉ chờ backend)

- `src/infra/api/conflig/apiEndpoints.ts` — `ASSIGNMENT.STUDENT_DETAIL`
- `src/infra/api/interfaces/IAssignment.ts` — `IAssignmentAnswerOption`, `IAssignmentAnswerQuestion`, `IAssignmentStudentAnswers`, `IAssignmentStudentDetailResponse`
- `src/infra/teacher/teacher_api.ts` — `getAssignmentStudentAnswers(assignmentId, studentCode)`
- `src/views/dashboard/teacher/assignments/StudentAnswerView.tsx` — màn hiển thị

---

## 2. Trạng thái "đã nhắc nhở" không được trả về trong danh sách học sinh (ưu tiên trung bình)

API `remind` / `remind-all` (`POST /teacher/assignments/{id}/remind`, `POST /teacher/assignments/{id}/remind-all`) **đã có và hoạt động đúng** — không phải vấn đề ở đây.

Vấn đề: trang chi tiết bài giao hiển thị badge "Đã nhắc" (màu xanh) ngay sau khi giáo viên bấm nhắc, nhưng đây hiện chỉ là **state tạm trong phiên làm việc của trình duyệt** (không lưu ở đâu cả) — F5 lại trang là mất, nút quay về "Nhắc" như chưa từng nhắc, dù backend **đã ghi nhận** sự kiện này vào collection `assignment_reminders` (theo tài liệu API v2, mục "Nhắc nhở học sinh").

**Cần backend bổ sung:** trong response của `GET /teacher/assignments/{id}`, mỗi phần tử trong mảng `students[]` cần có thêm field:

```json
{
  "student_code": "K245520207032",
  "name": "Nguyễn Văn A",
  "status": "not_started",
  "score": null,
  "total": null,
  "submitted_at": null,
  "last_reminded_at": "2026-07-12 09:15:00"
}
```

| Field | Type | Mô tả |
|---|---|---|
| `last_reminded_at` | string \| null | Thời điểm nhắc gần nhất (từ `assignment_reminders`), `null` nếu chưa từng được nhắc |

Frontend đã sẵn sàng đọc field này (`src/infra/api/interfaces/IAssignment.ts` → `IAssignmentStudentItem.last_reminded_at`, và `TeacherAssignmentDetail.tsx` tự khởi tạo lại badge "Đã nhắc" từ field này khi tải trang) — chỉ cần backend trả về là hoạt động ngay, không cần sửa thêm gì ở frontend.

---

## 3. Xác nhận lại: refresh token cần Bearer access token hết hạn

Không phải thay đổi backend mới, nhưng **cần xác nhận hành vi hiện tại của `/api/auth/refresh`** để đảm bảo frontend gọi đúng:

Frontend giờ gửi kèm access token (dù đã hết hạn) làm `Authorization: Bearer <token>` khi gọi `/api/auth/refresh` ở nhánh reactive-refresh (interceptor bắt lỗi 401). Điều này dựa trên giả định access token đóng vai trò refresh token — backend cần **chấp nhận access token đã hết hạn (exp) nhưng chữ ký còn hợp lệ** cho riêng endpoint `/auth/refresh`. Nếu backend hiện tại từ chối token hết hạn ở mọi endpoint (kể cả `/auth/refresh`), luồng tự động refresh sẽ luôn thất bại và người dùng bị đăng xuất khi token hết hạn giữa phiên làm việc.

**Cần xác nhận:** middleware xác thực của `/api/auth/refresh` có bỏ qua kiểm tra `exp` (chỉ kiểm tra chữ ký) hay không.

---

## Trả lời câu hỏi từ backend (2026-07-12)

### Q1 — `score` trong student detail: thang 10 hay số câu đúng?

**Thang 10** (số thực, có thể lẻ, hiển thị `.toFixed(1)`) — đúng như backend đang trả (`score: 8.0`). `correct_count` là số câu đúng thô, `total` (hoặc `questions.length`) là tổng số câu. Ví dụ 20 câu đúng 14: `score: 7.0`, `correct_count: 14`.

Nhân tiện: khi rà lại code để trả lời câu này, phát hiện **frontend có 1 bug** — component `StudentAnswerView.tsx` đang tô màu điểm bằng hàm `scoreColor(score, total)` vốn được viết cho field `score/total` kiểu "điểm thô" ở màn danh sách (bảng điểm), tự nhân lại `(score/total)*10`. Áp dụng nhầm hàm đó cho `score` đã ở thang 10 sẵn sẽ ra màu sai khi đề có khác 10 câu (vd 20 câu đúng 14 → `score=7.0` nhưng bị tính `(7/20)*10=3.5` → hiện màu đỏ dù điểm khá). **Đã sửa** — thêm hàm `scoreColorTen(score)` riêng cho điểm thang 10, dùng đúng trong `StudentAnswerView.tsx`. Không ảnh hưởng đến backend, chỉ nêu để backend yên tâm là số `score` thang 10 gửi lên sẽ được hiển thị đúng.

### Q2 — Câu bỏ trống: có cần `is_skipped` không?

**Có, nên thêm.** Đã cập nhật frontend để nhận field tùy chọn `is_skipped?: boolean` trong mỗi phần tử `questions[]` — khi `true`, UI hiển thị nhãn "Bỏ trống" (màu xám) thay vì để trống hoặc hiện sai lệch như đang chọn nhầm. Nếu không có field này (backend chưa set), FE vẫn chạy bình thường — câu bị bỏ trống chỉ đơn giản không có option nào gắn "HS chọn" và không hiện nhãn "Đúng".

```json
{ "no": 3, "question": "...", "is_correct": false, "is_skipped": true, "options": [...] }
```

### Q3 — Format `last_reminded_at`

Cả 2 format đều **parse được** ở frontend (`fmtDt()` dùng `new Date(...)`, ISO 8601 hợp lệ luôn parse đúng). Nhưng để nhất quán với các field ngày giờ khác trong cùng response (`submitted_at`, `available_from`, `due_at` đều là `YYYY-MM-DD HH:mm:ss` không kèm timezone), **ưu tiên dùng cùng format `YYYY-MM-DD HH:mm:ss`** cho `last_reminded_at` — tránh 1 payload có 2 kiểu định dạng ngày giờ khác nhau.

### Q4 — Refresh token: header hay body?

**Chỉ header.** Frontend gửi `Authorization: Bearer <token>`, không gửi token trong body hay query string (xem `src/infra/api/conflig/axiosInstance.ts`).

### Q5 — Có cần gộp thêm metadata đề thi vào student detail không?

**Không cần.** Màn `StudentAnswerView.tsx` nhận `examTitle` từ component cha (`TeacherAssignmentDetail.tsx`, vốn đã có sẵn dữ liệu đề từ `GET /teacher/assignments/{id}`) truyền xuống qua prop, không phụ thuộc vào response của endpoint `students/{student_code}`. Giữ endpoint gọn, chỉ trả dữ liệu bài làm của học sinh là đủ.

---

## 4. Notification system & lịch thi — đã tích hợp FE (2026-07-12)

Đã build xong toàn bộ phần frontend cho notification (student + teacher) và hiển thị `lich_thi`.

- **Types:** `src/infra/api/interfaces/INotification.ts` (mới), `IExamSchedule` trong `IStudent.ts`, thêm `lich_thi?` vào `IStudentSubject`, `IDashboardOverviewSubject`, `IDashboardSubjectData`.
- **Endpoints:** `STUDENT.NOTIFICATIONS(_READ/_READ_ALL)`, `TEACHER.NOTIFICATIONS(_READ/_READ_ALL)`; `STUDENT.DASHBOARD_OVERVIEW`/`DASHBOARD_SUBJECT` nhận thêm `hoc_ky` optional.
- **API client:** `getNotifications`, `markNotificationRead`, `markAllNotificationsRead` ở cả `student_api.ts` và `teacher_api.ts`.
- **Hook `useNotifications(role)`:** polling tự động, trả `{ notifications, unreadCount, loading, markRead, markAllRead, refresh }`; optimistic update khi mark-read (cập nhật UI ngay, không chờ response).
- **UI:** `NotificationPanel.tsx` (dropdown dùng chung) nối vào chuông thông báo thật trong `StudentHeader.tsx` (header dùng chung cho cả 2 layout) — đã bỏ hoàn toàn `unreadCount` giả cứng trước đây. Panel thông báo tĩnh trong `Teacher_Aspx.tsx` (dashboard giáo viên) cũng đã đổi sang dữ liệu thật từ cùng hook.
- **Deep-link khi click thông báo:** `assignment_*` → điều hướng tới bài giao tương ứng (`/student/assignments/{id}` hoặc `/teacher/assignments/{id}` dùng `data.assignment_id`); `exam_schedule_reminder` → điều hướng tới môn học (`/student/subjects/{ma_mon}` dùng `data.ma_mon`).

---

## 5. Xác nhận từ FE _(2026-07-12)_

### Q1 — Polling interval

Dùng đúng đề xuất: **30 giây khi tab active, 120 giây khi tab background** (`document.hidden`). Khi tab quay lại foreground, FE fetch ngay lập tức (không chờ hết nhịp 120s cũ) để badge không bị trễ. Implement tại `src/hooks/useNotifications.ts`.

### Q2 — Hiển thị `lich_thi`

Dùng ở **2 chỗ**:
- Card môn học trang danh sách (`StudentSubjects.tsx`) — dùng field từ `GET /student/semesters/{hoc_ky}/subjects`.
- Bảng "Thống kê theo môn học" ở `OverviewView.tsx` — **không** gọi `GET /student/dashboard/overview?hoc_ky=`; FE dùng `subjects` đã fetch sẵn qua `getSubjectsBySemester` để lấy `lich_thi`, tránh call trùng lặp.

> **⚠️ Lưu ý BE:** Nếu 2 endpoint (`subjects` vs `overview`) có cache key khác nhau và trả lịch thi lệch nhau, FE sẽ hiển thị không nhất quán. Cần đảm bảo cùng nguồn dữ liệu.

### Q3 — Ngưỡng `assignment_due_soon` 3 giờ

Chưa cần cho bản này — ngưỡng 25h đủ để badge hiển thị, FE không phân biệt mức độ ưu tiên theo thời gian. Nếu sau này cần phân biệt "sắp hết hạn" vs "sắp hết trong vài giờ" bằng màu/icon riêng, FE sẽ cần thêm field `urgency: 'soon' | 'critical'` trong `data` — **chưa cần cho bản này**.

---

## 6. Lưu ý hiệu năng polling (FE)

Header layout và trang dashboard giáo viên (`Teacher_Aspx.tsx`) mỗi nơi gọi `useNotifications('teacher')` **độc lập** — có **2 polling instance song song** khi giáo viên đang ở dashboard, gây gọi API trùng 2 lần mỗi interval. Đây là trade-off chấp nhận được cho bản đầu (không dùng Context/store chung). Nếu backend thấy notification endpoint bị gọi 2 lần liên tiếp từ cùng 1 user trong ~1s, đây là nguyên nhân — không phải lỗi hay tấn công.

---

## 7. Cần xác nhận: lịch sử chat có trả `intent`/`exam_id`/`saved_exam_id` không? (ưu tiên trung bình)

**Bug đã sửa ở FE:** nút "Xác nhận", "Xem đề", "Hủy" trên tin nhắn tạo/sửa đề kiểm tra (`exam_generate`, `exam_edit`) trước đây **biến mất khi reload trang** hoặc khi chuyển qua lại giữa các session chat. Nguyên nhân: các nút này chỉ hiện khi tin nhắn có `examMeta`, nhưng `examMeta` chỉ được set lúc **đang stream trực tiếp** (từ SSE `done` event có `intent` + `exam_id`) — khi load lại lịch sử qua `GET` session history, FE bỏ qua hoàn toàn 2 field này vì type cũ (`IChatHistoryMessage`) không khai báo.

**Đã sửa ở FE:** thêm `intent?`, `exam_id?`, `saved_exam_id?` vào `IChatHistoryMessage` (`src/infra/api/interfaces/IChat.ts`), và dựng lại `examMeta` từ các field này khi load lịch sử (`TeacherAITutors.tsx` → hàm `toChatMessage`).

**Cần backend xác nhận:** endpoint lấy lịch sử chat (dùng bởi `ChatApi.getSessionHistory`) hiện có trả các field sau cho **mỗi tin nhắn** (không chỉ ở response stream) không?

```json
{
  "role": "assistant",
  "content": "...",
  "timestamp": "...",
  "intent": "exam_generate",       // hoặc "exam_edit"
  "exam_id": "6bda5442",
  "saved_exam_id": "..."            // id đề đã lưu, nếu tin nhắn này đã được giáo viên "Xác nhận" trước đó — null/không có nếu chưa lưu
}
```

- Nếu **có** `intent` + `exam_id`: nút Xác nhận/Xem đề sẽ tự khôi phục đúng sau khi reload — không cần làm gì thêm.
- Nếu **thiếu** `saved_exam_id` (hoặc field tương đương cho biết đề đã được lưu chưa): FE sẽ luôn hiện lại nút "Xác nhận" kể cả với đề đã lưu trước đó, có thể khiến giáo viên bấm xác nhận trùng lặp. Cần backend bổ sung field này (hoặc xác nhận endpoint `confirmExam` đã idempotent theo `exam_id`, tự update thay vì tạo bản ghi mới khi gọi lại).
- Nếu **hoàn toàn thiếu** cả `intent`/`exam_id`: cần bổ sung, nếu không nút hành động sẽ vẫn biến mất sau reload dù FE đã sửa.

---

## 8. Trả lời tài liệu "Parse & API Key — Cập nhật Backend" (2026-07-08)

### Q1 — Màn hình quản lý API key
**Chọn phương án A**: form đơn giản (1 ô nhập key + Lưu + Xóa + Kiểm tra usage, không có danh sách), đặt trong khu vực admin riêng (`/admin/dashboard/api-settings`), không gộp vào trang Settings chung. Đã build xong FE tại `src/views/dashboard/admin/apisettings/AdminApiKeyPage.tsx`, gọi đúng 4 endpoint đã tài liệu hóa (`GET/PUT/DELETE /admin/api-settings/llama-parse`, `GET .../check-usage`).

### Q2 — `send-to-api` có tự động gọi sau upload không?
**Xác nhận: KHÔNG tự động.** FE chỉ gọi `send-to-api` khi giáo viên bấm nút "Gửi AI" (từng file) hoặc "Gửi tất cả" — đây là hành động rời rạc do người dùng chủ động kích hoạt (`handleSendToAI`/`handleSendAll` trong `src/views/dashboard/teacher/subjects/files/index.tsx`), **không** nằm trong luồng `onSuccess` của upload. Upload thành công chỉ refetch danh sách file, không tự parse.

Tuy vậy FE **chưa có cơ chế idempotency ở tầng request** (chỉ disable nút qua state `sending`/`sendingAll` trong lúc đang gọi) — nếu double-click rất nhanh trước khi state kịp re-render, có thể bắn 2 request. Với atomic dedup mới ở BE (`WHERE status IN ['pending','failed'] SET 'processing'`) thì trường hợp này đã được BE tự xử lý an toàn, FE không cần sửa thêm.

### Q3 — Poll interval
**Đã đổi từ 20s xuống 5s** theo đề xuất của BE (`src/views/dashboard/teacher/subjects/files/index.tsx`, hàm `startPoll`). Poll chỉ chạy khi có file đang ở trạng thái `pending`/`processing`/`send_queued`/`sending`, và tự dừng khi tab ẩn (`visibilitychange`).

Đã thêm status `processing` vào FE: `IFileExternalStatus` (`src/infra/api/interfaces/ITeacher.ts`), `POLLING_STATUSES` + `STATUS_CFG` (badge riêng, màu tím `#4338ca`, khác với `pending` màu cam) trong `src/views/dashboard/teacher/subjects/files/constants.ts`.

### Q4 — Nút "hiện key thật" (reveal)
**✅ Đã xác nhận BE triển khai xong** `POST /api/admin/api-settings/llama-parse/reveal` (body `{ "password": "..." }`, trả `{ success:true, data:{ api_key } }` khi đúng, `{ success:false, message:"Xác thực thất bại." }` khi sai). FE đã nối vào `AdminApiKeyPage.tsx` — modal xác thực lại mật khẩu admin trước khi hiện key, hiện đúng `message` trả về từ BE khi xác thực thất bại thay vì toast lỗi chung chung.

### Q5 — Trang xem Parse Log
**Đã có sẵn** (trước đây ở `/teacher/parse-logs`, dùng chung cho giáo viên) — nay **chuyển thành admin-only**: di chuyển sang `src/views/dashboard/admin/parselogs/AdminParseLogsPage.tsx`, route `/admin/dashboard/parse-logs`, gọi `GET /api/admin/parse-logs` + `/stats` (đổi từ `/teacher/parse-logs` cũ). Đã gỡ khỏi sidebar giáo viên (`TeacherSidebar.tsx`) và khỏi route `/teacher/parse-logs`.

---

## 9. Cần thêm API thông báo cho admin (ưu tiên trung bình)

Header khu vực admin (`src/@core/components/navbar/index.tsx`) trước đây có chuông thông báo giả (hardcode `notificationCount={3}`, không load dữ liệu thật) — nay đã nối vào cùng hệ thống notification dùng chung với giáo viên/học sinh (`useNotifications` hook, component `NotificationPanel` dùng chung), nhưng **backend chưa có endpoint cho role admin**. FE đã gọi sẵn 3 endpoint sau, hiện sẽ lỗi cho đến khi backend triển khai:

```
GET  /api/admin/notifications              — danh sách + unread_count (giống format /teacher/notifications, /student/notifications đã có)
POST /api/admin/notifications/{id}/read    — đánh dấu đã đọc 1 thông báo
POST /api/admin/notifications/read-all     — đánh dấu đã đọc tất cả
```

Response mong đợi giống hệt format đã dùng cho teacher/student (`INotificationsResponse`, `IMarkNotificationReadResponse`, `IMarkAllNotificationsReadResponse` trong `src/infra/api/interfaces/INotification.ts`):

```json
{
  "success": true,
  "unread_count": 2,
  "data": [
    { "id": "...", "username": "admin1", "type": "...", "title": "...", "body": "...", "data": {}, "read_at": null, "created_at": "..." }
  ],
  "meta": { "total": 2, "per_page": 20, "current_page": 1, "last_page": 1 }
}
```

**Cần xác nhận thêm:** admin sẽ nhận loại thông báo gì (vd: có tài khoản mới đăng ký, parse job thất bại nhiều lần, API key sắp hết hạn...)? Hiện `NotificationType` union (`INotification.ts`) chỉ có các loại dành cho assignment/exam của giáo viên/học sinh — nếu admin có loại thông báo riêng, cần bổ sung thêm vào union này để FE hiển thị đúng icon/màu trong `NotificationPanel.tsx`.

**Đã sửa cùng lúc:** gỡ nút dark-mode toggle (không dùng) và chuyển nút "Đăng xuất" từ chân sidebar lên header, để khớp với teacher/student (nút đăng xuất luôn hiện ở header, không cần mở rộng sidebar mới thấy).

---

## 10. Đã nối FE theo tài liệu "Parse Log — Admin" + "Quản lý người dùng — Admin" (2026-07-12)

### Parse Log (đã mở rộng)

FE đã cập nhật toàn bộ để khớp response mới của `GET /admin/parse-logs` và `/admin/parse-logs/stats`:

- `IParseLog` (`src/infra/api/interfaces/IParseLog.ts`) đổi `_id` → `id`, thêm `ten_mon`, `teacher_username`, `teacher_name`, `parsed_at`, `sent_to_chatbot`, `chatbot_status`, `rag_chunks`, `sent_at`.
- Query mới: `teacher_username`, `sent_to_chatbot`, `date_from`, `date_to` — đã thêm filter tương ứng trên UI (`AdminParseLogsPage.tsx`).
- `IParseLogStats` đổi cấu trúc từ phẳng sang lồng: `{ parse, chatbot, by_service, by_subject, by_teacher, recent_errors }` — UI đã cập nhật hiển thị đủ 6 phần theo đúng tài liệu, bao gồm card thống kê `chatbot` (sent_success/send_failed/pending_rag) và 2 panel top-10 mới (theo môn, theo giáo viên).
- Cột bảng bổ sung: Giáo viên, Chatbot (badge `chatbot_status` + số `rag_chunks` nếu có).

**Không có gì cần backend xác nhận thêm** ở mục này — FE đã map đúng 1:1 theo tài liệu đã gửi.

### Quản lý người dùng (đổi hoàn toàn từ CRUD sang chỉ xem + chặn/bỏ chặn)

- Đổi base path từ `/users` sang `/admin/users` theo tài liệu mới.
- **Đã gỡ bỏ hoàn toàn** chức năng Thêm tài khoản / Chỉnh sửa / Xóa tài khoản ở FE (trang `manage-users`) — vì tài liệu mới **không có** các endpoint `POST/PUT/DELETE /admin/users`, chỉ có `GET` (list/detail) và `POST .../block`, `POST .../unblock`.
- Cột bảng đổi theo field mới: `is_blocked` (thay `isActive`), thêm `login_count`, `last_login_at`, `first_login_at`. Field `role` đổi từ `admin/user` sang `student/teacher/admin` theo đúng vai trò thật của hệ thống.
- Dialog "Chặn tài khoản" mới (`BlockUserDialog.tsx`) cho nhập `reason` tùy chọn trước khi gọi `POST /admin/users/{id}/block`. "Bỏ chặn" là hành động 1-click gọi thẳng `POST /admin/users/{id}/unblock` (không cần dialog vì có thể chặn lại ngay nếu chặn nhầm).

**Cần xác nhận:** nếu sau này có nhu cầu tạo/sửa/xóa tài khoản admin thủ công (không qua block), tài liệu hiện tại chưa đề cập — báo trước nếu backend định bổ sung để FE không phải đoán lại contract.

---

## 11. Phản hồi backend (2026-07-08) — đã cập nhật FE

### Parse Log — đổi filter `teacher_username` → `teacher_id`

**Đã sửa FE.** `IParseLogsQuery.teacher_id` thay cho `teacher_username` (`IParseLog.ts`). Vì filter giờ cần MongoDB `_id` chứ không phải username, `AdminParseLogsPage.tsx` không dùng ô nhập text tự do nữa — thay bằng component `TeacherFilter` (combobox: gõ tên/username → gọi `GET /admin/users?search=&role=teacher` lấy danh sách gợi ý → chọn 1 người để lấy `_id` làm `teacher_id`). Cũng thêm `teacher_id` vào `IParseLog` (từng item log) và `IParseLogStatsByTeacher` theo đúng response mới.

### Item 1 — endpoint xem bài làm học sinh: đã tồn tại, không phải build ahead-of-backend nữa

FE đang gọi đúng URL (`GET /teacher/assignments/{id}/students/{student_code}`, khớp `ASSIGNMENT.STUDENT_DETAIL`). Tuy nhiên phát hiện **response thực tế khác với giả định trước đó**: field `score` là số câu đúng thô (không phải thang 10 như FE từng giả định ở mục "Trả lời câu hỏi từ backend" Q1), và có thêm field mới `score_10` là điểm đã quy đổi thang 10.

**Đã sửa FE:** `IAssignmentStudentAnswers` thêm `score_10: number | null`; `StudentAnswerView.tsx` đổi sang dùng `score_10` cho hiển thị + tô màu điểm ("Điểm"), dùng `correct_count ?? score` cho ô "Câu đúng" (fallback tương thích ngược nếu BE còn trả `correct_count`).

### Item 2 — API thông báo admin: BE đã triển khai 3 endpoint

`GET /admin/notifications`, `POST .../read`, `POST .../read-all` — format giống hệt teacher/student, FE gọi được ngay không cần sửa gì thêm.

**BE hỏi ngược lại FE:** admin cần nhận loại thông báo gì? Hiện chưa có trigger nào gửi thông báo cho admin. Đề xuất tạm thời (cần FE/PM xác nhận thêm trước khi BE code):
- Parse file thất bại nhiều lần liên tiếp cho 1 file/môn.
- Tài khoản bị block/unblock (log audit).
- API key LlamaParse sắp hết hạn hoặc bị lỗi xác thực liên tục.

Chưa quyết — để ngỏ, không chặn các phần khác.

### Item 3 — `last_reminded_at`: đã có sẵn từ trước

Không cần sửa gì — FE đã đọc field này đúng từ trước.

### Item 4 — chat history `intent`/`exam_id`/`saved_exam_id`: BE không kiểm soát (proxy sang chatbot server)

Không phải vấn đề backend Laravel — đây là dữ liệu do **chatbot server** trả về khi FE gọi lịch sử session, BE chỉ proxy nguyên văn. Muốn xác nhận format phải hỏi team chatbot server, không phải team backend này.

Tuy nhiên, luồng **học sinh luyện tập tạo đề** (`intent: "luyen_tap_tao_de"`) không phụ thuộc vào history format — BE tự tạo `ExamAssignment` khi stream kết thúc và gửi kèm 1 SSE event cuối `{"done":true,"assignment_link":"..."}`. **FE đã xử lý đúng** trường hợp này từ trước (`StudentChatbot.tsx` đã bắt `assignment_link` cả khi nhúng trong content lẫn khi là field riêng) — không cần sửa gì thêm cho luồng học sinh.

Luồng **giáo viên tạo/sửa đề** (`exam_generate`/`exam_edit`, nút Xác nhận/Xem đề trong `TeacherAITutors.tsx`) vẫn phụ thuộc vào history trả `intent`/`exam_id`/`saved_exam_id` — **vẫn cần hỏi team chatbot server** riêng, ưu tiên trung bình, không chặn release.

### Item 5 — `/auth/refresh` chấp nhận access token hết hạn: đã xác nhận ĐÚNG

Backend dùng `ignoreExpired=true`, luồng FE hiện tại chính xác. Không cần sửa gì.
