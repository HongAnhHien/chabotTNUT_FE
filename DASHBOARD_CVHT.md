# Dashboard CVHT — Lộ trình implement

> File song song với `API_ENDPOINTS.md` (TAI-TNUT trợ giảng).
> 3 cột trạng thái: **Chatbot** = Python CVHT (port 5001) · **BE** = chatbot_BE Laravel · **FE** = chatbotTNUT_FE

> ⚠️ **Nguyên tắc:** CVHT dashboard **không dùng chung data với TAI-TNUT**. Nguồn data tách biệt: `chatbotCVHT/data/analytics.db` + Portal API. Không cross-query sang TAI-TNUT.

> 📌 **Role trong CVHT:** `"student"` = sinh viên · `"teacher"` = Cố vấn học tập (CVHT).
> CVHT **chính là Giảng viên** — cùng một người, cùng một tài khoản Portal. Họ đăng nhập Portal với tư cách GV và đồng thời có vai trò CVHT, nên dùng được cả API GV (`TNUT_GV.md`) lẫn API CVHT (`w-locthongtinsinhvientheocvht`, `w-locketquahoctapsv`,...).
> Trong chatbot TAI-TNUT, `"teacher"` cũng = Giảng viên — tức cùng đối tượng người dùng, chỉ khác hệ thống chatbot.

> 🔑 **Ai xem dashboard nào:**
> - Tầng 1 + Tầng 2 = **CVHT** xem về SV mình phụ trách
> - Tầng 3 = **Admin** xem thống kê riêng của **CVHT chatbot** (port 5001) — không phải toàn trường, TAI-TNUT chatbot có analytics riêng tách biệt
>
> **Portal access:** Chatbot Python là bên DUY NHẤT có Portal token — không phải BE.
> CVHT token → `w-locketquahoctapsv` → toàn bộ SV + GPA/TC/cảnh cáo trong **1 call**.
> ~~manager-login per-student~~ đã bỏ — xem `portal.py:get_class_grades()`.
> BE chỉ proxy các endpoint từ chatbot Python, không tự gọi Portal.

> ⚖️ **Risk scoring** (xem chi tiết: `RISK_SCORING.md`):
> - Công thức: ma trận chuyển đổi nghịch chiều, base 100đ + bonus cảnh cáo 4đ/lần
> - Fields: `diem_tbtl` + `dtb_hoc_ky_truoc` (thang 4) + `tong_tc_da_hoc` + `so_tc_da_hoc_chua_dat` + `muc_canh_bao` — tất cả từ `w-locketquahoctapsv`
> - `TC_CHUAN = 155` (cố định), tiến độ tính theo số HK thường (HK1,2,3 — không tính HK4 hè)
> - 4 mức: `binh_thuong` (≤20) · `can_theo_doi` (21–35) · `can_tu_van_som` (36–49) · `nguy_co_cao` (≥50)

---

## Tầng 1 — Dashboard từng sinh viên (CVHT xem)

> CVHT chọn 1 SV trong lớp → xem chi tiết học tập của SV đó.
> Data đến từ Portal API qua **CVHT token** (`lay_ket_qua_hoc_tap_sv()`, `lay_ds_sv_cvht()`).
> BE giữ Portal token trong session, khi proxy xuống Python thì truyền `access_token` (không phải `session_id`).

| # | Chỉ số | Nguồn data | Chatbot | BE | FE |
|---|--------|------------|---------|-----|-----|
| 1.1 | GPA tích lũy + GPA HK gần nhất | Portal — `w-locketquahoctapsv` | ✅ `GET /api/portal/student-info?access_token=&ma_sv=` | ✅ `GET api/advisor/portal/student-info?ma_sv=` | ❌ |
| 1.2 | Số tín chỉ tích lũy | Portal — `w-locketquahoctapsv` | ✅ Cùng endpoint với 1.1 | ✅ Cùng route với 1.1 | ❌ |
| 1.3 | TC chưa đạt (tổng số) | Portal — `w-locketquahoctapsv` | ✅ Cùng endpoint với 1.1 (trả `so_tc_da_hoc_chua_dat`) | ✅ Cùng route với 1.1 | ❌ |
| 1.4 | Học phần nên đăng ký kỳ tới | Portal — `w-locdsctdtsinhvien` + `w-locdsdiemsinhvien` | ✅ Tool chatbot `lay_mon_hoc_ky_sau` — SV hỏi trực tiếp qua chat | ✅ đi qua `POST api/advisor/chat` sẵn có | ❌ |
| 1.5 | Mức rủi ro học tập | Portal (GPA + nợ môn) + analytics.db (tần suất chatbot) | ✅ Field `risk` trong `GET /api/portal/student-info` | ✅ Cùng route với 1.1 | ❌ |
| 1.6 | Lịch sử hỏi chatbot | `messages` table — `analytics.db` | ✅ `GET /api/analytics/user-history?user_id=&limit=` | ✅ `GET api/advisor/analytics/user-history?user_id=&limit=` | ❌ |
| 1.7 | Khuyến nghị gần nhất chatbot đưa ra cho SV | `recommendations` table — `analytics.db` | ✅ `GET /api/analytics/last-recommendation?user_id=` | ✅ `GET api/advisor/analytics/last-recommendation?user_id=` | ❌ |

---

## Tầng 2 — Dashboard lớp CVHT (CVHT xem)

> CVHT xem tổng quan toàn bộ SV mình phụ trách.
> Danh sách SV lấy từ `lay_ds_sv_cvht()` — Portal CVHT token.
> Risk scoring aggregate từ `lay_ket_qua_hoc_tap_sv()` cho từng SV trong lớp.

| # | Chỉ số | Nguồn data | Chatbot | BE | FE |
|---|--------|------------|---------|-----|-----|
| 2.1 | Tổng số sinh viên | Portal — CVHT token | ✅ Field `total` trong `GET /api/analytics/class-risk?access_token=` | ✅ `GET api/advisor/analytics/class-risk` | ❌ |
| 2.2 | Số SV theo 4 mức rủi ro | Portal (`w-locketquahoctapsv`) + analytics.db | ✅ `GET /api/analytics/class-risk?access_token=` — **1 call** Portal | ✅ Cùng route với 2.1 | ❌ |
| 2.3 | Top học phần bị nợ nhiều | — | ❌ Bỏ — `w-locketquahoctapsv` không trả danh sách môn nợ chi tiết | ❌ | ❌ |
| 2.4 | Top câu hỏi SV hỏi nhiều | `messages` table — `analytics.db` | ✅ `GET /api/analytics/top-keywords?days=&limit=` | ✅ `GET api/advisor/analytics/top-keywords?days=&limit=` | ❌ |
| 2.5 | Tỷ lệ SV đã dùng chatbot | `logins` (analytics.db) / tổng SV (Portal) | ✅ `GET /api/analytics/adoption-rate?access_token=` — intersection Portal IDs ∩ analytics.db | ✅ `GET api/advisor/analytics/adoption-rate` | ❌ |
| 2.6 | Tỷ lệ SV được tư vấn sau cảnh báo | Tracking workflow CVHT → SV | ❌ Chưa có workflow tracking | ❌ | ❌ |

---

## Tầng 3 — Thống kê CVHT chatbot (Admin xem)

> Chỉ phản ánh hoạt động của **CVHT chatbot (port 5001)**. TAI-TNUT chatbot (port 5000) có analytics DB riêng, không liên quan.

| # | Chỉ số | Nguồn data | Chatbot | BE | FE |
|---|--------|------------|---------|-----|-----|
| 3.1 | Số lượt dùng CVHT chatbot | `messages` table — `analytics.db` | ✅ `total_messages` từ `GET /api/analytics/summary` | ✅ `GET api/advisor/analytics/summary` | ❌ |
| 3.2 | Tỷ lệ câu trả lời hữu ích (CVHT chatbot) | `feedback` table — `analytics.db` | ✅ `helpful_rate` từ `GET /api/analytics/summary` | ✅ Cùng route với 3.1 | ❌ |
| 3.3 | Tỷ lệ SV nguy cơ được phát hiện | `student_risk_cache` — analytics.db | ✅ `GET /api/analytics/risk-overview` — đọc cache, không cần token; cập nhật khi CVHT gọi class-risk | ✅ `GET api/advisor/analytics/risk-overview` | ❌ |
| 3.4 | Tỷ lệ SV cải thiện sau tư vấn | So sánh GPA nhiều kỳ — Portal | ❌ Cần snapshot GPA nhiều thời điểm | ❌ | ❌ |
| 3.5 | Số báo cáo CVHT tạo tự động | Cần implement riêng | ❌ | ❌ | ❌ |
| 3.6 | Nhóm vấn đề học tập phổ biến | `messages` table — `analytics.db` | ✅ `GET /api/analytics/topic-groups?days=` — 13 nhóm chủ đề | ✅ `GET api/advisor/analytics/topic-groups?days=` | ❌ |

---

## Endpoint CVHT Python (port 5001)

### Session & Chat

| Method | Path | Params | Role | Mô tả |
|--------|------|--------|------|--------|
| POST | `/api/session/create` | `?user_id=&role=&access_token=` | all | Tạo session, ghi vào `logins` + `active_sessions` |
| PUT | `/api/session/{id}/token` | `?user_id=&access_token=` | all | Refresh Portal token |
| GET | `/api/session/list` | `?user_id=` | all | Danh sách session |
| GET | `/api/session/{id}` | `?user_id=` | all | Chi tiết session + messages |
| DELETE | `/api/session/{id}` | `?user_id=` | all | Xóa session |
| POST | `/api/chat` | FormData: `session_id`, `user_id`, `question` | all | Chat thường |
| POST | `/api/chat/stream` | FormData: `session_id`, `user_id`, `question` | all | Chat stream SSE |
| POST | `/api/feedback` | FormData: `message_id`, `user_id`, `value` | **student only** | Like/dislike — CVHT nhận 403 |
| POST | `/api/rating` | FormData: `user_id`, `score`, `session_id`?, `comment`? | all | CSAT (1–5 sao) |

### Analytics (chatbot usage) — BE lo auth, Python không cần param auth

| Method | Path | Params | Mô tả |
|--------|------|--------|--------|
| GET | `/api/analytics/summary` | — | Unique users, tổng tin nhắn, helpful rate, CSAT, personalization rate |
| GET | `/api/analytics/trend` | `?days=7` | Time series theo ngày |
| GET | `/api/analytics/user-history` | `?user_id=&limit=50` | Lịch sử câu hỏi của 1 user |
| GET | `/api/analytics/student-activity` | `?days=30` | Phân loại SV: tích cực / thỉnh thoảng / ít / chưa dùng |
| GET | `/api/analytics/top-keywords` | `?days=30&limit=20` | Top từ khóa SV hỏi |
| GET | `/api/analytics/topic-groups` | `?days=30` | Nhóm vấn đề học tập phổ biến |
| GET | `/api/analytics/risk-overview` | — | Aggregate rủi ro từ cache: counts + % theo 4 mức + at_risk_rate |
| GET | `/api/analytics/last-recommendation` | `?user_id=` | Khuyến nghị gần nhất chatbot đưa ra cho 1 SV |

### Portal & Risk — Python nhận `access_token` (BE lấy từ session và truyền xuống)

| Method | Path | Params | Mô tả |
|--------|------|--------|--------|
| GET | `/api/portal/student-info` | `?access_token=&ma_sv=` | GPA thang 4, TC, cảnh cáo, risk score của 1 SV — dùng `w-locketquahoctapsv` |
| GET | `/api/analytics/class-risk` | `?access_token=` | Risk toàn lớp — 1 call Portal, 4 mức rủi ro; tự lưu `student_risk_cache` |
| GET | `/api/analytics/adoption-rate` | `?access_token=` | Tỷ lệ SV đã dùng chatbot = Portal list ∩ analytics.db |

---

## Proxy chatbot_BE → CVHT Python

> ✅ **Toàn bộ 20 route dưới đây đã implement + test PASS với data thật (2026-08-04).** FE gọi thẳng được ngay, không cần chờ BE nữa.
> `chatbot_BE` (Laravel) nhận request từ FE, forward xuống CVHT Python. Header bắt buộc mọi route: `Authorization: Bearer {jwt}` (JWT của `chatbot_BE`, lấy qua `POST api/auth/login` — không phải Portal token, không phải access_token CVHT).

| Route chatbot_BE | Params bắt buộc (FE tự truyền) | Params tự động (BE tự lấy từ JWT) | Proxy tới CVHT |
|---|---|---|---|
| `POST api/advisor/session` | — | `user_id`, `role`, Portal `access_token` | `/api/session/create` |
| `PUT api/advisor/sessions/{id}/token` | path `{id}` | `user_id`, Portal `access_token` | `/api/session/{id}/token` |
| `GET api/advisor/sessions` | — | `user_id` | `/api/session/list` |
| `GET api/advisor/sessions/{id}` | path `{id}` | `user_id` | `/api/session/{id}` |
| `DELETE api/advisor/sessions/{id}` | path `{id}` | `user_id` | `/api/session/{id}` |
| `POST api/advisor/chat` | body `session_id`, `question` | `user_id` | `/api/chat` |
| `POST api/advisor/chat/stream` | body `session_id`, `question` | `user_id` | `/api/chat/stream` |
| `POST api/advisor/feedback` | body `message_id`, `value` (`like`/`dislike`) | `user_id` | `/api/feedback` |
| `POST api/advisor/rating` | body `score` (1-5), `session_id`?, `comment`? | `user_id` | `/api/rating` |
| `GET api/advisor/analytics/summary` | — | — | `/api/analytics/summary` |
| `GET api/advisor/analytics/trend` | query `days`? (mặc định 7) | — | `/api/analytics/trend` |
| `GET api/advisor/analytics/user-history` | query `user_id` (required), `limit`? | — | `/api/analytics/user-history` |
| `GET api/advisor/analytics/student-activity` | query `days`? | — | `/api/analytics/student-activity` |
| `GET api/advisor/analytics/top-keywords` | query `days`?, `limit`? | — | `/api/analytics/top-keywords` |
| `GET api/advisor/analytics/topic-groups` | query `days`? | — | `/api/analytics/topic-groups` |
| `GET api/advisor/analytics/risk-overview` | — | — | `/api/analytics/risk-overview` |
| `GET api/advisor/analytics/last-recommendation` | query `user_id` (required) | — | `/api/analytics/last-recommendation` |
| `GET api/advisor/portal/student-info` | query `ma_sv` (required) | Portal `access_token` | `/api/portal/student-info?access_token=&ma_sv=` |
| `GET api/advisor/analytics/class-risk` | — | Portal `access_token` | `/api/analytics/class-risk?access_token=` |
| `GET api/advisor/analytics/adoption-rate` | — | Portal `access_token` | `/api/analytics/adoption-rate?access_token=` |

**Quan trọng cho FE:**
- Tất cả route chỉ cần header `Authorization: Bearer {jwt}` — BE tự xử lý auth, **không có param auth nào FE cần tự truyền**.
- Portal endpoints (`student-info`, `class-risk`, `adoption-rate`): BE lấy Portal `access_token` từ JWT rồi tự forward xuống Python — FE không cần biết hay lưu token này.
- `session_id` (chat session) chỉ dùng cho nhóm `/chat`, `/session`, `/rating` — không liên quan đến Portal endpoints.
- CVHT tự kiểm tra quyền theo role — nếu SV gọi nhầm route chỉ dành cho teacher, CVHT trả **HTTP 200** kèm `{"error": "Role 'student' không có quyền truy cập"}` trong `data` (không phải 403) — FE cần tự check field `data.error` để phát hiện, không thể chỉ dựa vào HTTP status.

**🔑 FE có cần lưu `session_id` không? — chia rõ 2 nhóm (6 route cần / 14 route không cần):**

| Cần `session_id` (6 route — chat thật) | Không cần `session_id` (14 route — analytics/Portal) |
|---|---|
| `POST api/advisor/session` (tạo mới, trả `session_id`) | `GET api/advisor/analytics/summary` |
| `PUT api/advisor/sessions/{id}/token` | `GET api/advisor/analytics/trend` |
| `GET api/advisor/sessions/{id}` | `GET api/advisor/analytics/user-history` |
| `DELETE api/advisor/sessions/{id}` | `GET api/advisor/analytics/student-activity` |
| `POST api/advisor/chat` (body `session_id`) | `GET api/advisor/analytics/top-keywords` |
| `POST api/advisor/chat/stream` (body `session_id`) | `GET api/advisor/analytics/topic-groups` |
| `POST api/advisor/rating` (`session_id` optional) | `GET api/advisor/analytics/risk-overview` |
| | `GET api/advisor/analytics/last-recommendation` |
| | `GET api/advisor/portal/student-info` |
| | `GET api/advisor/analytics/class-risk` |
| | `GET api/advisor/analytics/adoption-rate` |
| | `GET api/advisor/sessions` (danh sách — không cần `{id}`) |
| | `POST api/advisor/feedback` (dùng `message_id`, không phải `session_id`) |

→ FE chỉ cần tạo/lưu `session_id` khi build màn hình **chat** với CVHT (tạo session 1 lần lúc mở cuộc trò chuyện, dùng lại cho các lần gửi tin nhắn/rating tiếp theo trong cuộc đó). Toàn bộ dashboard (Tầng 1/2/3 — GPA, risk, top-keywords, v.v...) gọi thẳng, không cần tạo session trước.

Service: `app/Services/AdvisorChatbotService.php` — URL config: `services.advisor.url` = env `ADVISOR_API_URL`.

---

## Response mẫu

> Response bên dưới đều đã gọi thật qua `chatbot_BE` (không phải mock) — đường vào là `api/advisor/...` (không phải path CVHT trực tiếp), bọc trong `{"success": true, "data": {...}}`.

**`GET api/advisor/analytics/summary`** (teacher, đã có data thật):
```json
{
  "success": true,
  "data": {
    "unique_users": 3,
    "unique_by_role": { "student": 2, "teacher": 1 },
    "total_messages": 33,
    "helpful_rate": null,
    "active_now": 0,
    "active_by_role": { "student": 0, "teacher": 0 },
    "csat": { "total_ratings": 2, "avg_score": 4.5, "max_score": 5 },
    "personalization_rate": { "rate": 86.7, "count": 30 }
  }
}
```
> `helpful_rate` là `null` khi chưa có ai bấm like/dislike (khác với doc cũ ghi dạng object `{rate,count}` — thực tế field này là số hoặc `null` thẳng, không lồng object khi rỗng).

**`GET api/advisor/analytics/student-activity?days=30`:**
```json
{
  "success": true,
  "data": {
    "period_days": 30,
    "total_students": 2,
    "active": { "count": 1, "label": "Tích cực (≥15 tin nhắn)" },
    "occasional": { "count": 0, "label": "Thỉnh thoảng (5–14 tin nhắn)" },
    "low": { "count": 1, "label": "Ít tương tác (1–4 tin nhắn)" },
    "unused": { "count": 0, "label": "Chưa sử dụng (0 tin nhắn)" }
  }
}
```

**`GET api/advisor/analytics/top-keywords?days=30&limit=5`:**
```json
{
  "success": true,
  "data": {
    "days": 30,
    "keywords": [
      { "term": "môn", "count": 11 },
      { "term": "đăng ký", "count": 10 }
    ]
  }
}
```

**`GET api/advisor/analytics/topic-groups?days=30`:**
```json
{
  "success": true,
  "data": {
    "days": 30,
    "groups": [
      { "group": "Đăng ký học phần", "count": 5 },
      { "group": "Lịch & thời khóa biểu", "count": 3 }
    ]
  }
}
```

**`GET api/advisor/analytics/user-history?user_id=...&limit=5`:**
```json
{
  "success": true,
  "data": {
    "user_id": "K255520207218",
    "history": [
      { "query": null, "query_len": 36, "response_len": 86, "elapsed_s": 4.78, "used_portal_data": false, "created_at": 1783935676 }
    ]
  }
}
```
> `query` (nội dung câu hỏi thật) luôn `null` — CVHT chỉ trả độ dài (`query_len`), không trả nội dung, có thể vì lý do privacy. Đừng code FE kỳ vọng hiển thị câu hỏi gốc từ endpoint này.

**`GET api/advisor/analytics/last-recommendation?user_id=...`** (chưa có khuyến nghị nào):
```json
{ "success": true, "data": { "user_id": "K255520207218", "recommendation": null } }
```

**`GET api/advisor/analytics/class-risk`:**
```json
{
  "success": true,
  "data": {
    "nhhk": 20254,
    "total": 45,
    "summary": { "binh_thuong": 20, "can_theo_doi": 15, "can_tu_van_som": 7, "nguy_co_cao": 3 },
    "students": [
      {
        "ma_sv": "K225520207036", "ho_ten": "Đoàn Văn Kiều", "ma_lop": "K58ĐVT.K01",
        "diem_tbtl": 2.06, "dtb_hoc_ky_truoc": 2.55,
        "tong_tc_da_hoc": 139.0, "so_tc_da_hoc_chua_dat": 0,
        "muc_canh_bao": "", "chatbot_msgs_30d": 0,
        "risk": {
          "score": 33, "level": "can_theo_doi", "label": "Cần theo dõi", "color": "yellow",
          "components": { "gpa_tich_luy": 18, "gpa_hk_gan": 10, "tien_do": 0, "tc_no": 0, "tuong_tac": 5, "canh_cao": 0 }
        }
      }
    ]
  }
}
```
> Nếu tài khoản đang gọi không phụ trách SV nào (không phải CVHT của lớp nào) → `total: 0`, `students: []`. Không phải lỗi.

**`GET api/advisor/analytics/adoption-rate`:**
```json
{ "success": true, "data": { "nhhk": 20254, "total_sv": 35, "da_dung": 0, "chua_dung": 35, "rate": 0, "chatbot_total_sv": 2 } }
```

**`GET api/advisor/analytics/risk-overview`** (cache rỗng — chưa gọi `class-risk` lần nào để warm cache):
```json
{
  "success": true,
  "data": {
    "total_cached": 0,
    "summary": {
      "binh_thuong": { "count": 0, "pct": 0 }, "can_theo_doi": { "count": 0, "pct": 0 },
      "can_tu_van_som": { "count": 0, "pct": 0 }, "nguy_co_cao": { "count": 0, "pct": 0 }
    },
    "at_risk_count": 0, "at_risk_rate": 0, "last_updated": null
  }
}
```
> `risk-overview` đọc cache do `class-risk` ghi ra — **phải gọi `class-risk` ít nhất 1 lần trước** thì `risk-overview` mới có data, không tự query Portal độc lập.

**`GET api/advisor/portal/student-info?ma_sv=...`** (SV không thuộc lớp CVHT phụ trách):
```json
{ "success": true, "data": { "error": "Không tìm thấy SV K255520207218" } }
```
> Case lỗi nghiệp vụ (SV không tồn tại / không thuộc quyền quản lý) trả **HTTP 200** kèm `data.error`, không phải 404 — FE phải tự check field này.

---

## Thứ tự ưu tiên implement

### Chatbot Python — đã xong ✅
- `GET /api/analytics/summary` — unique_users, unique_by_role, total_messages, helpful_rate, active_now, active_by_role, csat, **personalization_rate**
- `GET /api/analytics/trend`
- `GET /api/analytics/user-history`
- `GET /api/analytics/student-activity`
- `GET /api/analytics/top-keywords`
- `GET /api/analytics/topic-groups`

### Chatbot Python — đã xong (Portal via CVHT token) ✅
1. **#1.1–1.3, #1.5** ✅ — `GET /api/portal/student-info?access_token=&ma_sv=` — dùng `w-locketquahoctapsv`, trả GPA thang 4, TC, cảnh báo, risk score
2. **#2.1, #2.2** ✅ — `GET /api/analytics/class-risk?access_token=` — risk toàn lớp, **1 call** Portal, 4 mức rủi ro; tự động lưu vào `student_risk_cache`
3. **#3.3** ✅ — `GET /api/analytics/risk-overview` — aggregate từ cache, trả `summary`, `at_risk_rate`, `last_updated`
4. **#2.5** ✅ — `GET /api/analytics/adoption-rate?access_token=` — Portal list ∩ analytics.db

### Chatbot Python — đã xong ✅
5. **#1.4** ✅ — Tool `lay_mon_hoc_ky_sau` — lấy môn CTĐT kỳ sau + phát hiện môn trượt cần học lại từ `w-locdsdiemsinhvien`
6. **#1.7** ✅ — `GET /api/analytics/last-recommendation?user_id=` — async LLM classifier (GPT-4o-mini), chỉ lưu khi có hành động cụ thể, summary dạng mô tả tổng quát

### BE — đã xong toàn bộ ✅ (2026-07-16)
Đã implement + test PASS cả 20 route (bảng "Proxy chatbot_BE → CVHT Python" ở trên). **FE không còn gì phải chờ BE nữa** — tất cả route dưới đây gọi được ngay.

### FE — làm được ngay, không phải chờ gì nữa
6. **#3.1, #3.2, KPI** — Render summary cards từ `api/advisor/analytics/summary`
7. **CSAT card** — Hiện sau 8 tin nhắn, gọi `POST api/advisor/rating`
8. **#2.4 Top câu hỏi** — Word cloud / bảng từ `api/advisor/analytics/top-keywords`
9. **#1.7 card** — Hiển thị `last-recommendation` trong màn hình chi tiết từng SV
10. **Tầng 1** — Dashboard 1 SV: `api/advisor/portal/student-info` (GPA, TC, risk) + `api/advisor/analytics/user-history`
11. **Tầng 2** — Dashboard lớp: `api/advisor/analytics/class-risk` (gọi trước để warm cache) → sau đó `api/advisor/analytics/risk-overview` + `api/advisor/analytics/adoption-rate`
12. **Tầng 3** — `api/advisor/analytics/student-activity` + `api/advisor/analytics/topic-groups`

> Lưu ý: FE phải tạo **CVHT session** trước khi chat (`POST api/advisor/session`) và lưu `session_id` để dùng cho `/chat`, `/chat/stream`, `/rating`. Portal endpoints (`student-info`, `class-risk`, `adoption-rate`) không cần `session_id` — BE tự xử lý Portal token từ JWT.

### Phức tạp — làm sau
10. **#3.4 GPA tracking** — Snapshot GPA nhiều kỳ, cần Portal lưu lịch sử
11. **#2.6 Tỷ lệ SV được tư vấn sau cảnh báo** — Cần workflow tracking riêng
12. **#3.5 Báo cáo tự động** — LLM generate report từ Portal + analytics.db
