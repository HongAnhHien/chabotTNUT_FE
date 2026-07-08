# Backend cần làm gì — checklist tổng hợp

File này tổng hợp **các việc backend còn cần làm**, rút gọn từ lịch sử trao đổi chi tiết ở `docs/backend-todo.md`. Xem file đó để có đầy đủ ngữ cảnh, ví dụ response, và các câu hỏi/trả lời liên quan.

Cập nhật lần cuối: 2026-07-08.

---

## 🟢 Ngoài phạm vi backend Laravel — cần hỏi team khác

### 1. Chat history có trả `intent` / `exam_id` / `saved_exam_id` cho mỗi tin nhắn không? (luồng giáo viên)

**Không phải backend này kiểm soát** — lịch sử chat được proxy nguyên văn từ **chatbot server**, backend Laravel không thêm/sửa field. Ảnh hưởng: nút "Xác nhận đề" / "Xem đề" trên tin nhắn `exam_generate`/`exam_edit` (giáo viên) có tự khôi phục đúng sau khi reload trang hay không. Cần hỏi team vận hành chatbot server, không phải backend. Không chặn release — chi tiết: `backend-todo.md` mục 11.

> Lưu ý: luồng **học sinh luyện tập tạo đề** (`intent: luyen_tap_tao_de`) đã có giải pháp riêng không phụ thuộc history (BE gửi kèm `assignment_link` ở SSE event cuối), FE đã xử lý xong — không liên quan đến câu hỏi này.

---

## 🟡 Cần xác nhận thêm (không chặn release)

### 2. Admin cần nhận loại thông báo gì?

3 endpoint `GET/POST /admin/notifications*` đã có, FE đã nối xong. Nhưng hiện **chưa có trigger nào** gửi thông báo cho admin. BE đề xuất 3 loại (parse lỗi liên tục, tài khoản bị block/unblock, API key sắp hết hạn) — cần FE/PM xác nhận trước khi BE code trigger tương ứng. Chi tiết: `backend-todo.md` mục 11.

---

## ✅ Đã xác nhận / đã triển khai xong (không cần làm thêm)

- Reveal API key LlamaParse (`POST /admin/api-settings/llama-parse/reveal`) — đã triển khai, FE đã nối xong.
- Status `processing` trong parse flow — không cần làm thêm.
- Atomic dedup khi gọi `send-to-api` nhiều lần — đã xử lý, FE không cần sửa thêm.
- Notification system cho student/teacher **và admin** — cả 3 role đều đã có endpoint, FE đã tích hợp đầy đủ.
- Parse Log — Admin, bao gồm đổi filter `teacher_username` → `teacher_id` (FE dùng combobox tìm-rồi-chọn giáo viên thay vì gõ username tự do) — xem `backend-todo.md` mục 10 + 11.
- Quản lý người dùng — Admin (chỉ xem + chặn/bỏ chặn, không còn create/edit/delete) — xem `backend-todo.md` mục 10.
- Endpoint xem chi tiết bài làm học sinh (`GET /teacher/assignments/{id}/students/{student_code}`) — **đã tồn tại từ trước**, FE gọi đúng URL. Đã sửa lại cách hiển thị điểm cho khớp field `score_10` mới (điểm thang 10) thay vì giả định `score` đã ở thang 10 như trước — xem `backend-todo.md` mục 11.
- `last_reminded_at` trong danh sách học sinh của bài giao — đã có sẵn từ trước, FE đã đọc đúng.
- `/api/auth/refresh` chấp nhận access token hết hạn (`ignoreExpired=true`) — đã xác nhận đúng luồng FE hiện tại, không cần sửa gì.

---

## Quy ước

Khi một mục ở trên được backend triển khai xong, cập nhật trạng thái tại đây **và** ghi chú xác nhận chi tiết vào `docs/backend-todo.md` (giữ nguyên lịch sử trao đổi ở đó).
