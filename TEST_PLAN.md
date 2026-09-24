# TEST PLAN — Hệ sinh thái số AI PIAI · Atlas TNUT

> **Phạm vi:** toàn bộ 4 repo của hệ sinh thái Atlas TNUT (FE · BE · TAI · CVHT).
> **Người trình:** TS. Đoàn Thanh Hải — Phó Viện trưởng Viện RIAT (TNUT).
> **Ngày khảo sát:** 24/09/2026 · nhánh `feat/piai-tnut-ecosystem` của cả 4 repo (gồm cả thay đổi chưa commit trong working tree).
> **Cách làm:** đọc mã nguồn, đếm route/test bằng lệnh, chạy thử bộ test hiện có. Số liệu dưới đây là số đếm được, không ước đoán, trừ mục "độ phủ ước tính".

---

## 1. Tóm tắt kiến trúc

### 1.1 Sơ đồ tổng thể

```
                    Trình duyệt (GV · SV · Cán bộ khoa/trường · Admin)
                                       │
                         ┌─────────────▼──────────────┐
                         │  FE — chabotTNUT_FE :5173  │  React 19 + Vite 8 + TS
                         │  Atlas hub, 16 ứng dụng    │  (onnxruntime-web, MediaPipe
                         └─────────────┬──────────────┘   cho nhận diện khuôn mặt)
                                       │ REST + JWT (axios, tự refresh token)
                         ┌─────────────▼──────────────┐
      Camera điểm danh ─►│  BE — chatbot_BE :8000     │  Laravel 13 / PHP 8.2
      (X-DiemDanh-Key)   │  Cổng API trung tâm        │  MongoDB (laravel-mongodb)
                         └──┬──────────┬──────────┬───┘  Queue jobs (parse/embed)
             X-API-Key      │          │          │  HTTP
        ┌───────────────────▼──┐  ┌────▼───────┐  └──────────────────────┐
        │ TAI — chatbotTNUT    │  │ CVHT       │                         │
        │ :5000  FastAPI       │  │ :5001      │                ┌────────▼─────────┐
        │ Trợ giảng AI (RAG)   │  │ FastAPI    │                │ Portal TNUT       │
        │ LangGraph, Qdrant    │  │ Cố vấn HT  │───────────────►│ (đăng nhập, TKB,  │
        │ nhúng, e5 local,     │  │ LangGraph  │                │  lớp, SV, điểm)   │
        │ SQLite stores        │  │ SQLite     │                └──────────────────┘
        └──────────┬───────────┘  └─────┬──────┘
                   └──── OpenAI API (gpt-4o-mini / gpt-4o, Whisper, vision OCR) ────┘
                         LlamaParse (parse tài liệu) · RIAT E-learning (SSO vé HMAC 60s)
```

### 1.2 Từng repo

| Repo | Remote | Ngôn ngữ / Framework | Quy mô (đếm được) | Vai trò |
|---|---|---|---|---|
| **FE** `chabotTNUT_FE` | `HongAnhHien/chabotTNUT_FE` (fork) | TypeScript, React 19, Vite 8, Tailwind 4, shadcn/radix, zustand, react-router 7, zod, recharts, OpenLayers, onnxruntime-web, MediaPipe | ~103 file dưới `views/dashboard`, 15 API client (`infra/api`) | Atlas hub + giao diện 3 vai trò; nhận diện khuôn mặt **chạy trên thiết bị** (`src/lib/faceEngine.ts`) |
| **BE** `chatbot_BE` | `cuong1211/chatbot_BE` | PHP 8.2, Laravel 13, MongoDB, JWT (`php-open-source-saver/jwt-auth`), PhpSpreadsheet/PhpWord | 29 controller API (26 đã commit + 3 mới), **183 route** trong `routes/api.php`, 46 model, 18 service, 3 queue job, 9 middleware | Cổng API duy nhất cho FE; phân quyền theo vai; đồng bộ Portal; điều phối parse → embed; điểm danh; báo cáo |
| **TAI** `chatbotTNUT` | `tdung787/chatbot_TNUT` | Python, FastAPI, LangGraph/LangChain, Qdrant (nhúng), sentence-transformers (e5), rank_bm25, OpenAI | 23 endpoint `/api/*`, ~4.350 dòng lõi (api, chatbot, ingest, agent_tools, stores) + 19 script `preprocessing/` | Trợ giảng AI môn học: nạp học liệu (chunk 1500/200 → ngữ cảnh hoá → e5 → Qdrant), chat RAG có trích dẫn, sinh đề, analytics |
| **CVHT** `chatbotCVHT` (repo lồng trong TAI) | `tdung787/chatbot_cvht` | Python, FastAPI, LangGraph | 19 endpoint | Cố vấn học tập: tool SV/GV/quy chế, rủi ro học vụ, lịch sử điểm từ Portal (`portal.py`) |

**Module chính của BE (theo nhóm route):** `auth` (đăng nhập qua Portal, JWT) · `student/*` · `teacher/*` (môn, học liệu, bài tập, đề thi, lộ trình, analytics) · `admin/*` · `advisor/*` (CVHT, sổ tư vấn, KPI, đồng bộ GPA) · `diem-danh/*` + `diem-danh/camera/ghi-nhan` · `laban/*` (La bàn nghề nghiệp) · `elearning/*` · `noitru/*` · `cms/*`, `org/*`, `edusoft/*` · `ocr`, `stt`, `sso/riat-ticket` · `danh-gia/hieu-qua`.

### 1.3 Giao tiếp với hệ thống bên ngoài

| Từ → Đến | Giao thức / Xác thực | Ghi chú rủi ro |
|---|---|---|
| FE → BE | REST JSON, `Authorization: Bearer <JWT>`; axios tự refresh khi 401 | Luồng refresh có nhiều nhánh bỏ qua — dễ lặp vô hạn hoặc đăng xuất nhầm |
| BE → Portal TNUT | HTTP (`PortalService`, `TeacherSyncService`, `StudentSyncService`) | Nguồn sự thật cho đăng nhập, TKB, lớp, điểm; Portal chậm/lỗi ảnh hưởng toàn hệ |
| BE → TAI | HTTP + header `X-API-Key` (`ChatbotService`, job `SendParsedFileToApi`) | TAI **mở hoàn toàn nếu thiếu env `API_KEY`** (`api.py:62-64`) |
| BE → CVHT | HTTP (`AdvisorChatbotService`) | CVHT **không có lớp xác thực**, CORS `*` (`app.py:64-65`) |
| CVHT → Portal | `manager_login` + `get_grade_data` | Dữ liệu điểm cá nhân — thuộc phạm vi NĐ 13/2023 |
| BE/TAI → OpenAI | API key | Chi phí theo token; OCR/Whisper cần khoá hợp lệ |
| BE → LlamaParse | API key | Parse PDF/scan; lỗi → tài liệu 0 chunk |
| Camera → BE | `X-DiemDanh-Key`, so sánh `hash_equals` | Đúng cách; cần test khoá sai/thiếu |
| BE → RIAT E-learning | Vé JWT HS256 ký `RIAT_SSO_SECRET`, sống 60s | Cần test hết hạn, sai chữ ký, phát lại vé |
| Lưu trữ | MongoDB (BE) · SQLite `data/*.sqlite` (TAI, CVHT) · Qdrant nhúng theo môn | SQLite đang được **commit vào git** (`data/chat.sqlite`, `analytics.db`…) |

---

## 2. Hiện trạng test

| Repo | Framework | Test hiện có | Chạy được không? | Độ phủ ước tính |
|---|---|---|---|---|
| **BE** | PHPUnit 12 (`phpunit.xml`, suite Unit + Feature, DB test `chatbot_test` trên Mongo) | **63 test** trong 5 file `tests/Feature/Api/`: Assignment 19 · SubjectFile 22 · Exam 11 · Auth 9 · Subject 2. Có dùng `Http::fake` cho Portal. `tests/Unit/` trống | **KHÔNG.** Chạy `vendor/bin/phpunit` báo *"This version of PHPUnit requires PHP >= 8.3. You are using PHP 8.2.12"*. Cần thêm MongoDB test + ext `mongodb` | ~10–15% route (5/29 controller có test); **0%** cho điểm danh, CVHT, SSO, La bàn, lộ trình, GPA, báo cáo, phân quyền |
| **FE** | **Chưa có.** Không có vitest/jest/playwright trong `package.json`; chỉ có `tsc -b` và `eslint` | 0 | — | 0% (kiểm tra kiểu TS là lưới an toàn duy nhất) |
| **TAI** | **Chưa có pytest** (máy dev chưa cài) | `test_model_compare.py` — script so sánh gpt-4o-mini vs gpt-4o, xuất markdown; `TEST_RESULTS_tu_van_hoc_tap.md` — 7 ca chạy tay qua `bot.invoke()` | Chạy tay, cần khoá OpenAI; **không có assert**, không tự động | 0% tự động |
| **CVHT** | Script Python chạy tay | 5 file `test_*.py` (1.082 dòng): `test_routing.py` có so khớp tool kỳ vọng (pass/fail thủ công); còn lại in kết quả ra `.md`/`.json` | Chạy tay; `test_routing.py --real` gọi Portal thật | 0% tự động; có bộ ca kiểm thử định tuyến tool đáng tái dùng |
| **Toàn hệ** | Không có CI (không thấy `.github/workflows` trên nhánh này) | — | — | Không có test tích hợp liên dịch vụ, không có E2E |

**Phát hiện cần xử lý ngay (ảnh hưởng tới việc test):**
1. `chatbotCVHT/test_routing.py:23` **hardcode mật khẩu Portal của một SV thật** và đã commit lên git → phải xoá khỏi mã, đổi mật khẩu tài khoản đó, chuyển sang biến môi trường.
2. BE không chạy được test do lệch phiên bản PHP (8.2 vs PHPUnit 12). Chọn một trong hai: nâng PHP lên 8.3 (khớp Dockerfile deploy) hoặc hạ `phpunit/phpunit` xuống `^11`.
3. Nhiều tính năng mới (AdvisorConsult, LoTrinh, EduSoft, GpaSnapshot, ChuyenCan…) **chưa commit** — cần commit trước khi viết test cho chúng.

---

## 3. Các phần quan trọng nhất cần test — xếp theo rủi ro

Thang điểm: **Rủi ro = Tác động × Khả năng hỏng**. Tác động xét trên dữ liệu cá nhân, tính đúng của điểm/chuyên cần, và chi phí.

| # | Hạng mục | Repo | Vì sao rủi ro | Mức |
|---|---|---|---|---|
| 1 | **Xác thực & phân quyền** — login qua Portal, JWT, refresh, middleware `role:*`, `student`, `teacher`, `admin`; SV không đọc được dữ liệu SV khác/lớp khác | BE, FE | 183 route, ~20 nhóm middleware khác nhau; một route quên middleware là lộ dữ liệu toàn trường | 🔴 Nghiêm trọng |
| 2 | **Xác thực liên dịch vụ** — TAI mở khi thiếu `API_KEY`; CVHT không có auth + CORS `*` nhưng trả điểm và rủi ro học vụ | TAI, CVHT | Ai biết địa chỉ :5001 là đọc được điểm SV (vi phạm NĐ 13) | 🔴 Nghiêm trọng |
| 3 | **Điểm danh khuôn mặt** — `DiemDanhService` (ngưỡng 0,42 · biên 0,06 · ≥2 phiếu · chắc chắn 0,55), đối chiếu TKB + lớp, khoá thiết bị camera, khiếu nại, xuất Excel | BE, FE | Sai là ghi nhận nhầm chuyên cần → ảnh hưởng quyền dự thi; ngưỡng dễ bị chỉnh lệch | 🔴 Nghiêm trọng |
| 4 | **SSO vé RIAT** — ký HMAC, hạn 60s, sai chữ ký, phát lại vé, tự tạo tài khoản | BE (+ RIAT) | Lỗi = chiếm tài khoản bên RIAT | 🔴 Nghiêm trọng |
| 5 | **Đồng bộ Portal & GPA** — `PortalService`, `StudentSyncService`, `TeacherSyncService`, `gpaSync` (upsert idempotent theo `ma_sv + hoc_ky_ref`) | BE, CVHT | Portal đổi định dạng/timeout → sai điểm, trùng mốc GPA, KPI cố vấn sai | 🟠 Cao |
| 6 | **Pipeline học liệu** — upload → validate → `ProcessSubjectFile` parse (Word/Excel/PDF/LlamaParse) → review → `SendParsedFileToApi` → TAI `/ingest` → chunk → embed | BE, TAI | Đã từng gây sự cố "0 chunk / Thất bại"; file scan/ảnh; job lỗi âm thầm | 🟠 Cao |
| 7 | **Chấm bài & lộ trình** — `ExamFinalizerService`, `BayesianScoringService`, mở/khoá chặng theo `score/total ≥ diem_dat`, sắp xếp lại chặng | BE | Tính điểm sai là sai kết quả học tập; logic mở khoá có biên | 🟠 Cao |
| 8 | **RAG có căn cứ (grounding)** — trả lời phải trích dẫn học liệu, từ chối khi KB rỗng, không bịa | TAI | Chất lượng sư phạm; ảo giác làm mất niềm tin GV/SV | 🟠 Cao |
| 9 | **Định tuyến tool của agent CVHT** — chọn đúng tool SV/GV/quy chế | CVHT | Trả lời sai quy chế đào tạo | 🟡 Trung bình |
| 10 | **Giải mã EduSoft** (mã lớp/mã SV/mã môn) + cơ cấu tổ chức | BE | Hàm thuần, dễ test, nhiều nơi phụ thuộc | 🟡 Trung bình |
| 11 | **Báo cáo & dashboard** — Đánh giá hiệu quả, chuyên cần, KPI tư vấn, độ hài lòng (👍/👎), `printReport.ts` có trang bìa | BE, FE | Số liệu trình lãnh đạo phải đúng | 🟡 Trung bình |
| 12 | **Nhập liệu đa phương thức** — OCR, STT, SymbolPicker chèn đúng con trỏ, chat stream | BE, FE | Phụ thuộc OpenAI; lỗi mềm đã có | 🟢 Thấp |
| 13 | **faceEngine phía FE** — căn chỉnh 112×112, embed 512-D, warm-up | FE | Khó test tự động (camera); đã kiểm chứng tay model | 🟢 Thấp (tự động) / cần nghiệm thu tay |

---

## 4. Kế hoạch test theo giai đoạn

Nguyên tắc: mỗi giai đoạn nhỏ, có **tiêu chí hoàn thành đo được**, làm xong là hợp nhất được ngay. Không đợi phủ 100% mới đưa vào CI.

### Giai đoạn 0 — Dọn nền (1–2 ngày)
- [ ] Gỡ mật khẩu hardcode trong `chatbotCVHT/test_routing.py`, đọc từ env; đổi mật khẩu tài khoản bị lộ.
- [ ] Thống nhất PHP 8.3 cho dev (XAMPP) và Docker **hoặc** hạ PHPUnit về `^11`. Chạy lại 63 test hiện có, ghi nhận số pass/fail.
- [ ] Commit các file mới chưa theo dõi của BE (AdvisorConsult, LoTrinh, EduSoft, GpaSnapshot, ChuyenCan…).
- [ ] Ngừng commit SQLite runtime (`data/*.sqlite`, `analytics.db`) — thêm vào `.gitignore`, tạo fixture riêng cho test.
- **Xong khi:** `php artisan test` chạy được trên máy dev; không còn bí mật trong git.

### Giai đoạn 1 — Chặn rủi ro bảo mật 🔴 (3–5 ngày)
- [ ] **BE — test ma trận phân quyền:** một test dữ liệu hoá duyệt *mọi* route trong `routes/api.php` × 5 vai (khách, SV, GV, khoa/trường, admin) → khẳng định mã 401/403/200 đúng kỳ vọng. Test này tự bắt route mới quên middleware.
- [ ] **BE — Auth:** login (Portal ok/401/timeout), refresh, hết hạn, token bị sửa.
- [ ] **BE — SSO:** vé hợp lệ; hết hạn >60s; sai chữ ký; thiếu secret → 500 có thông báo rõ.
- [ ] **BE — Camera:** thiếu/sai `X-DiemDanh-Key` → 401; env rỗng → luôn từ chối.
- [ ] **TAI:** pytest + `TestClient`: không có/ sai `X-API-Key` → 403; **thiếu env `API_KEY` → phải từ chối** (sửa code fail-closed cùng lúc).
- [ ] **CVHT:** thêm lớp xác thực (API key như TAI) + test; giới hạn CORS theo `ALLOWED_ORIGINS`.
- **Xong khi:** 100% route BE nằm trong ma trận phân quyền; TAI/CVHT từ chối truy cập không có khoá.

### Giai đoạn 2 — Logic nghiệp vụ lõi (1 tuần)
- [ ] **Unit `DiemDanhService`:** bộ vector giả lập — khớp rõ; hai SV sát nhau (biên < 0,06 → không ghi); 1 khung ≥ 0,55; < 2 phiếu; SV không thuộc lớp/không đúng TKB; ghi trùng trong một buổi.
- [ ] **Unit `EduSoftDecoder`:** các mã mẫu đã kiểm chứng 3/3 + mã sai định dạng.
- [ ] **Unit `ExamFinalizerService`, `BayesianScoringService`:** điểm biên (0, tối đa, bài trống, nộp muộn).
- [ ] **Feature Lộ trình:** tạo/sửa/xoá chặng, reorder, trạng thái `da_dat/mo/khoa` đúng ngưỡng `diem_dat` và `mo_khi`.
- [ ] **Feature GPA:** `gpaSync` chạy 2 lần không sinh bản ghi trùng (idempotent); Portal trả rỗng/lỗi.
- **Xong khi:** độ phủ dòng của `app/Services` ≥ 60%; mọi ngưỡng điểm danh có test khoá giá trị.

### Giai đoạn 3 — Tích hợp & pipeline dữ liệu (1 tuần)
- [ ] **BE:** `Http::fake` cho Portal, TAI, CVHT, OpenAI, LlamaParse — test timeout, 5xx, JSON sai → lỗi mềm, không 500 trắng.
- [ ] **BE:** chuỗi job `ProcessSubjectFile → SendParsedFileToApi` với file mẫu (docx, xlsx, pdf văn bản, pdf scan) → trạng thái cuối đúng, có thông báo lỗi rõ khi 0 chunk.
- [ ] **TAI:** pytest cho `preprocessing/chunk_document.py` (kích thước 1500/200, không cắt giữa công thức), `stores/*` trên SQLite tạm, `/subjects/{id}/ingest` với embedder giả (không tải model e5 trong CI).
- [ ] **CVHT:** chuyển `test_routing.py` sang pytest, chế độ mock Portal làm mặc định; `--real` chỉ chạy tay.
- [ ] **Hợp đồng API BE↔TAI↔CVHT:** lưu JSON mẫu phản hồi, test cả hai phía đọc đúng lược đồ.
- **Xong khi:** CI chạy toàn bộ mà không cần mạng, không cần khoá OpenAI.

### Giai đoạn 4 — Frontend (1 tuần)
- [ ] Thêm **Vitest + Testing Library**. Ưu tiên: `axiosInstance.ts` (refresh 1 lần, không lặp, bỏ qua `/auth/refresh`), guard route theo vai trong `router/`, `lib/mathExpr.ts`, `lib/printReport.ts` (có trang bìa), `SymbolPicker` chèn đúng con trỏ.
- [ ] Thêm **Playwright** (chạy với BE giả hoặc seeder demo): 5 luồng khói — đăng nhập 3 vai → Atlas hiện đúng số ứng dụng; SV mở môn → chat → có trích dẫn; GV tạo lộ trình → SV thấy khoá/mở; GV xem dashboard chuyên cần → xuất báo cáo; admin mở Tính toán hạ tầng.
- **Xong khi:** 5 luồng E2E xanh; `tsc -b`, `eslint`, `vitest` cùng chạy trong CI.

### Giai đoạn 5 — Chất lượng AI & CI liên tục (liên tục)
- [ ] **Bộ đánh giá RAG** (từ `TEST_RESULTS_tu_van_hoc_tap.md` + `test_quy_che*.py`): 30–50 câu hỏi vàng mỗi môn pilot, đo tỷ lệ có trích dẫn, tỷ lệ từ chối đúng khi ngoài học liệu. Chạy theo lịch (tuần), không chặn merge.
- [ ] **CI GitHub Actions** cho từng repo: lint + test + build; chặn merge khi đỏ.
- [ ] **Nghiệm thu tay có biên bản** cho phần không tự động được: camera điện thoại trên Chrome thật, mic STT, enroll lại bằng model MobileFaceNet, đo FAR/FRR để chốt τ (theo `QUY-TRINH-NGHIEM-THU-DIEM-DANH.md`).
- [ ] Mục tiêu độ phủ: BE ≥ 60% toàn repo, `app/Services` ≥ 70%; TAI/CVHT lõi ≥ 50%; FE: 100% luồng quan trọng có E2E.

### Tóm tắt lộ trình

| Giai đoạn | Thời lượng | Kết quả then chốt |
|---|---|---|
| 0 · Dọn nền | 1–2 ngày | Test BE chạy được, không còn bí mật trong git |
| 1 · Bảo mật | 3–5 ngày | Ma trận phân quyền 183 route; TAI/CVHT fail-closed |
| 2 · Nghiệp vụ lõi | 1 tuần | Điểm danh, chấm bài, lộ trình, GPA có test khoá ngưỡng |
| 3 · Tích hợp | 1 tuần | Pipeline học liệu + hợp đồng API, CI không cần mạng |
| 4 · Frontend | 1 tuần | Vitest + 5 luồng Playwright |
| 5 · AI & CI | liên tục | Bộ câu hỏi vàng RAG, GitHub Actions, nghiệm thu tay |

---

*Tài liệu thuộc dự án Hệ sinh thái số AI PIAI — Atlas TNUT. © Viện RIAT — TNUT.*
