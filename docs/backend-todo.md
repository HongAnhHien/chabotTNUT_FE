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
