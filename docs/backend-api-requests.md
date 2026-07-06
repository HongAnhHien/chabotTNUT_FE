# Backend API requests — teacher analytics/subjects pages

Written while reworking `src/views/dashboard/teacher/subjects/*` and
`src/views/dashboard/teacher/analytics/*` to match the `*.dc.html` design mockups
at the repo root ("Môn học", "Danh sách học sinh", "Bài kiểm tra đã giao",
"Tổng quan lớp", "Tổng quan môn học"). The frontend now has UI and request logic
in place for the three gaps below; none of them are backed by a real endpoint
yet, so they either fall back to extra client-side calls or fail gracefully
with a toast until the backend ships the corresponding API.

## 1. Per-subject analytics on the "Môn học" list — perf follow-up

**Where:** `TeacherSubjectList.tsx` (`loadAnalytics`)

The subject-list endpoint (`GET /teacher/semesters/{hocKy}`) returns subjects
and their classes, but not completion/AI-usage/attention metrics. The mockup
shows those per subject (hoàn thành %, % dùng AI, số cảnh báo) plus a 4-card
overview strip (Môn học / Lớp học phần / Sinh viên / Hoàn thành TB).

**Current interim behavior:** the frontend now calls the existing
`GET /teacher/subjects/{ma_mon}/analytics` once **per subject** in parallel
(`Promise.allSettled`) right after the course list loads. This works, but for a
teacher with N subjects in a semester it's N extra requests every time the
page loads or the semester changes.

**Requested change:** either of these removes the N+1 fan-out —

- **Preferred:** embed the aggregate fields directly in the existing
  `GET /teacher/semesters/{hocKy}` response, one object per subject:
  ```json
  {
    "subject": { "_id": "...", "ma_mon": "TEE0328", "ten_mon": "...", "so_tc": "3" },
    "classes": [ ... ],
    "analytics": {
      "total_students": 51,
      "ai_users": 30,
      "attention_count": 6,
      "completion_rate": 67.2
    }
  }
  ```
- **Alternative:** a dedicated bulk endpoint, e.g.
  `GET /teacher/semesters/{hocKy}/subjects-analytics` returning
  `{ ma_mon, total_students, ai_users, attention_count, completion_rate }[]`
  for every subject in that semester in one call.

Either shape is fine — the frontend just needs `total_students`, `ai_users`,
`attention_count`, and `assignments.completion_rate` (or equivalent) available
without a follow-up request per subject.

## 2. Per-student AI usage — "Danh sách học sinh" tab

**Where:** `ClassAnalyticsPage.tsx` (`StudentRow`, `AI_USAGE_CFG`)

The mockup has a "Trợ lý AI" badge per student (Tích cực / Vừa phải / Ít dùng /
Chưa dùng). `GET /teacher/courses/{id_to_hoc}/students` currently only returns
a class-wide AI usage count (`IClassAnalytics.ai_users`), nothing per student.

**Requested change:** add an optional field to each student item returned by
`GET /teacher/courses/{id_to_hoc}/students`:

```json
{
  "...": "existing ITeacherStudent fields",
  "ai_usage_level": "high" | "mid" | "low" | "none"
}
```

Suggested bucketing (adjust to whatever signal is cheapest to compute, e.g.
chat sessions or messages sent in the current semester):
- `high` — active AI usage well above class median
- `mid` — some usage
- `low` — minimal usage
- `none` — never opened the AI chatbot

The frontend already reads `student.ai_usage_level` (see
`ITeacherStudent.ai_usage_level` in `src/infra/api/interfaces/ITeacher.ts`) and
falls back to a neutral "Chưa có dữ liệu" badge when the field is absent, so
this can ship independently without a breaking change.

Nice-to-have: if useful, a `warning_level`-style filter param
(`ai_usage_level=none|low|mid|high`) on the same endpoint would let the "Đã
dùng AI" filter chip (currently omitted from the toolbar, see mockup) become
functional too.

## 3. Assignment reminders + roster export — "Bài kiểm tra đã giao" tab

**Where:** `ClassAnalyticsPage.tsx` (`AssignmentCard`), `TeacherApi.remindStudent`
/ `remindAllPending` / `exportAssignmentRoster`, `API_ENDPOINTS.ASSIGNMENT`

The mockup's per-assignment view has a submission-ring, a bulk action bar
("Xuất danh sách" / "Nhắc tất cả chưa nộp"), and a per-student "Nhắc nhở"
button with an "Đã gửi nhắc" counter. None of this exists on the backend today.
The frontend already wires the buttons to the endpoints below; until they
exist, clicking them shows a toast ("Chưa thể ... — tính năng đang chờ backend
hỗ trợ.") instead of silently doing nothing or pretending to succeed.

**Requested endpoints** (paths already reserved in `apiEndpoints.ts`):

1. `POST /teacher/assignments/{id}/remind`
   - Body: `{ "student_code": "K2xxxxxxxx" }`
   - Sends a single reminder (email/notification, whatever channel the
     school-info system uses) to that student for that assignment.
   - Response: `{ "success": true, "message": "...", "data": { "student_code": "...", "reminded_at": "2026-07-06T10:00:00Z" } }`

2. `POST /teacher/assignments/{id}/remind-all`
   - No body — reminds every student in `pending_students` for that assignment.
   - Response: `{ "success": true, "message": "...", "data": { "reminded_count": 17 } }`

3. `GET /teacher/assignments/{id}/export`
   - Returns a binary spreadsheet (`.xlsx` is what the frontend currently
     names the downloaded file — CSV is fine too, frontend just needs the
     `Content-Type`/`Content-Disposition` to reflect the actual format) with
     the assignment's full student roster and submission status.
   - Frontend consumes this as a `Blob` and triggers a browser download.

**Also requested** — the current `GET /teacher/courses/{id}/analytics`
`schedule[].pending_students` array only lists students who haven't submitted,
with no activity/reminder history. To fully match the mockup (which shows
*every* student with last-active time and reminder count), either:

- add `last_active_at` and `remind_count` to each entry in
  `pending_students` (types already added as optional fields on
  `IScheduleItem.pending_students` in `ITeacher.ts`), or
- return a full roster per assignment (submitted + not-submitted) instead of
  just the pending ones, so the "Bài kiểm tra đã giao" list can show every
  student's status in one call instead of only the not-yet-submitted ones.

Until any of this ships, the reminder/export buttons remain visible (per
product decision) but will surface a failure toast rather than a silent
no-op — that's the expected behavior, not a bug.
