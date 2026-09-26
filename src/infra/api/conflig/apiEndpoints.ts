export const API_ENDPOINTS = {
  AUTH: {
    LOGIN:    '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT:   '/auth/logout',
    REFRESH:  '/auth/refresh',
    ME:       '/auth/me',
  },

  ME: {
    PROFILE:         '/me',
    UPDATE_PROFILE:  '/me',
    UPLOAD_AVATAR:   '/me/avatar',
    CHANGE_PASSWORD: '/me/password',
  },

  ADMIN: {
    // Users
    USERS_LIST:    '/admin/users',
    USERS_DETAIL:  (id: string) => `/admin/users/${id}`,
    USER_BLOCK:    (id: string) => `/admin/users/${id}/block`,
    USER_UNBLOCK:  (id: string) => `/admin/users/${id}/unblock`,

    // Parse logs
    PARSE_LOGS:       '/admin/parse-logs',
    PARSE_LOGS_STATS: '/admin/parse-logs/stats',

    // LlamaParse API key (chỉ 1 key duy nhất, không có {id})
    LLAMA_PARSE_KEY:             '/admin/api-settings/llama-parse',
    LLAMA_PARSE_KEY_CHECK_USAGE: '/admin/api-settings/llama-parse/check-usage',
    LLAMA_PARSE_KEY_REVEAL:      '/admin/api-settings/llama-parse/reveal',

    // Notifications — chưa có ở backend, xem docs/backend-todo.md
    NOTIFICATIONS:          '/admin/notifications',
    NOTIFICATION_READ:      (id: string) => `/admin/notifications/${id}/read`,
    NOTIFICATIONS_READ_ALL: '/admin/notifications/read-all',

    // Subjects list — endpoint public (không có prefix /admin), dùng để làm dropdown
    SUBJECTS: '/subjects',

    // Analytics (admin-only)
    ANALYTICS_KNOWLEDGE_MAP: '/admin/analytics/knowledge-map',
    ANALYTICS_WEEKLY:        '/admin/analytics/weekly',
    ANALYTICS_REPORT:        '/admin/analytics/report',
  },

  TEACHER: {
    SEMESTERS:        '/teacher/semesters',
    SEMESTER_COURSES: (hocKy: number) => `/teacher/semesters/${hocKy}`,
    COURSE_STUDENTS:   (idToHoc: string) => `/teacher/courses/${encodeURIComponent(idToHoc)}/students`,
    COURSE_ANALYTICS:  (idToHoc: string) => `/teacher/courses/${encodeURIComponent(idToHoc)}/analytics`,
    SUBJECT_ANALYTICS: (maMon: string)   => `/teacher/subjects/${maMon}/analytics`,

    // Lộ trình đề kiểm tra theo môn
    HO_SO:            '/teacher/ho-so',
    LO_TRINH:         '/teacher/lo-trinh',
    LO_TRINH_REORDER: '/teacher/lo-trinh/reorder',
    LO_TRINH_ITEM:    (id: string) => `/teacher/lo-trinh/${id}`,

    // File management
    SUBJECT_FILES:        (s: string) => `/teacher/subjects/${s}/files`,
    SUBJECT_FILES_TREE:   (s: string) => `/teacher/subjects/${s}/files/tree`,
    SUBJECT_FILE:         (s: string, f: string) => `/teacher/subjects/${s}/files/${f}`,
    SUBJECT_FILES_SENT:   (s: string) => `/teacher/subjects/${s}/files/sent`,
    SUBJECT_FILE_MARKDOWN:(s: string, f: string) => `/teacher/subjects/${s}/files/${f}/markdown`,
    SUBJECT_FILE_SUBMIT:  (s: string, f: string) => `/teacher/subjects/${s}/files/${f}/submit`,
    SUBJECT_FILES_BATCH:  (s: string) => `/teacher/subjects/${s}/files/submit-batch`,
    SUBJECT_FILE_SEND:    (s: string) => `/teacher/subjects/${s}/files/send-to-api`,
    SUBJECT_FILE_DEL_SENT:(s: string, f: string) => `/teacher/subjects/${s}/files/${f}/sent`,
    FILE_CANCEL_SEND:     (f: string) => `/teacher/files/${f}/cancel-send`,
    FILES_RESEND:         '/teacher/files/resend',

    // Notifications
    NOTIFICATIONS:          '/teacher/notifications',
    NOTIFICATION_READ:      (id: string) => `/teacher/notifications/${id}/read`,
    NOTIFICATIONS_READ_ALL: '/teacher/notifications/read-all',

    // Soạn bài giảng AI (dự án 26)
    BAI_GIANG:          '/teacher/bai-giang',
    BAI_GIANG_CHUONG:   '/teacher/bai-giang/chuong',
    BAI_GIANG_SINH:     '/teacher/bai-giang/sinh',
    BAI_GIANG_ITEM:     (id: string) => `/teacher/bai-giang/${id}`,
    BAI_GIANG_DUYET:    (id: string) => `/teacher/bai-giang/${id}/duyet`,
    BAI_GIANG_BO_DUYET: (id: string) => `/teacher/bai-giang/${id}/bo-duyet`,
    BAI_GIANG_TAI:      (id: string) => `/teacher/bai-giang/${id}/tai`,
    // Luyện tập hằng tuần + bảng điểm tổng hợp theo trọng số
    LUYEN_TAP:          '/teacher/luyen-tap',
    LUYEN_TAP_ITEM:     (id: string) => `/teacher/luyen-tap/${id}`,
    BANG_DIEM:          '/teacher/bang-diem',
    BANG_DIEM_LOP:      '/teacher/bang-diem/lop',
    BANG_DIEM_SV:       '/teacher/bang-diem/sinh-vien',
    BANG_DIEM_CHOT:     '/teacher/bang-diem/chot',
    BANG_DIEM_CAU_HINH: '/teacher/bang-diem/cau-hinh',
    BANG_DIEM_XUAT:     '/teacher/bang-diem/xuat',
    // Môn dạy chung (mã PĐT): nhóm GV + vai GVC / GVTH / trợ giảng
    PHAN_CONG:          '/teacher/phan-cong',
    // Ngân hàng câu hỏi trắc nghiệm của môn
    NGAN_HANG:          '/teacher/ngan-hang',
    NGAN_HANG_ITEM:     (id: string) => `/teacher/ngan-hang/${id}`,
    NGAN_HANG_XUAT:     '/teacher/ngan-hang/xuat',

    // Legacy aliases (kept for backward compat with existing drawers)
    SUBJECT_AI_FILES:     (s: string) => `/teacher/subjects/${s}/files/sent`,
    SUBJECT_AI_SEND:      (s: string) => `/teacher/subjects/${s}/files/send-to-api`,
    SUBJECT_AI_FILE_DEL:  (s: string, f: string) => `/teacher/subjects/${s}/files/${f}/sent`,
    SUBJECT_AI_RESEND:    (s: string, f: string) => `/teacher/subjects/${s}/files/${f}/resend`,
  },

  CHAT: {
    SESSION:         '/chat/session',
    SESSIONS:        '/chat/sessions',
    SESSION_HISTORY: (id: string) => `/chat/sessions/${id}/history`,
    SESSION_DELETE:  (id: string) => `/chat/sessions/${id}`,
    EXAM:            (examId: string) => `/chat/exam/${examId}`,
    STREAM:          '/chat/stream',
    FEEDBACK:        '/chat/feedback',
    RATING:          '/chat/rating',
    ANALYTICS_SUMMARY: '/chat/analytics/summary',
  },

  ADVISOR: {
    SESSION:         '/advisor/session',
    SESSIONS:        '/advisor/sessions',
    SESSION_DETAIL:  (id: string) => `/advisor/sessions/${id}`,
    SESSION_DELETE:  (id: string) => `/advisor/sessions/${id}`,
    SESSION_TOKEN:   (id: string) => `/advisor/sessions/${id}/token`,
    CHAT:            '/advisor/chat',
    STREAM:          '/advisor/chat/stream',
    FEEDBACK:        '/advisor/feedback',
    RATING:          '/advisor/rating',
    ANALYTICS_SUMMARY: '/advisor/analytics/summary',
    ANALYTICS_TREND:   '/advisor/analytics/trend',

    // Dashboard CVHT — Tầng 1/2/3 (xem DASHBOARD_CVHT.md)
    PORTAL_STUDENT_INFO: '/advisor/portal/student-info',
    CLASS_RISK:          '/advisor/analytics/class-risk',
    ADOPTION_RATE:       '/advisor/analytics/adoption-rate',
    RISK_OVERVIEW:       '/advisor/analytics/risk-overview',
    USER_HISTORY:        '/advisor/analytics/user-history',
    STUDENT_ACTIVITY:    '/advisor/analytics/student-activity',
    TOP_KEYWORDS:        '/advisor/analytics/top-keywords',
    TOPIC_GROUPS:        '/advisor/analytics/topic-groups',
    LAST_RECOMMENDATION: '/advisor/analytics/last-recommendation',
  },

  EXAM: {
    CONFIRM: (subjectId: string) => `/teacher/subjects/${subjectId}/exams/confirm`,
    LIST:    '/teacher/exams',
    DETAIL:  (id: string) => `/teacher/exams/${id}`,
    DELETE:  (id: string) => `/teacher/exams/${id}`,
  },

  ASSIGNMENT: {
    ASSIGN:     (examId: string) => `/teacher/exams/${examId}/assign`,
    LIST:       '/teacher/assignments',
    DETAIL:     (id: string) => `/teacher/assignments/${id}`,
    UPDATE:     (id: string) => `/teacher/assignments/${id}`,
    DELETE:     (id: string) => `/teacher/assignments/${id}`,
    REMIND:     (id: string) => `/teacher/assignments/${id}/remind`,
    REMIND_ALL: (id: string) => `/teacher/assignments/${id}/remind-all`,
    EXPORT:     (id: string) => `/teacher/assignments/${id}/export`,
    STUDENT_DETAIL: (id: string, studentCode: string) => `/teacher/assignments/${id}/students/${encodeURIComponent(studentCode)}`,
  },

  STUDENT_ASSIGNMENT: {
    LIST:   '/student/assignments',
    DETAIL: (id: string) => `/student/assignments/${id}`,
    START:  (id: string) => `/student/assignments/${id}/start`,
    SUBMIT: (id: string) => `/student/assignments/${id}/submit`,
  },

  STUDENT: {
    SUBJECTS:          '/student/subjects',
    SEMESTERS:         '/student/semesters',
    SEMESTER_SUBJECTS: (hocKy: number) => `/student/semesters/${hocKy}/subjects`,
    MASTERY:           '/student/mastery',
    STUDY_STATS:       '/student/study-stats',
    UPCOMING_EXAMS:    '/student/upcoming-exams',
    EXAM_STATUS:       (userId: string, maMon: string) => `/chatbot/student-exam-status?user_id=${encodeURIComponent(userId)}&ma_mon=${encodeURIComponent(maMon)}`,
    DASHBOARD_OVERVIEW: (semesterFrom?: string, hocKy?: number) => {
      const params = new URLSearchParams();
      if (semesterFrom) params.set('semester_from', semesterFrom);
      if (hocKy)        params.set('hoc_ky', String(hocKy));
      const qs = params.toString();
      return `/student/dashboard/overview${qs ? `?${qs}` : ''}`;
    },
    DASHBOARD_SUBJECT: (maMon: string, hocKy?: number) => {
      const params = new URLSearchParams({ ma_mon: maMon });
      if (hocKy) params.set('hoc_ky', String(hocKy));
      return `/student/dashboard?${params.toString()}`;
    },

    // Notifications
    NOTIFICATIONS:          '/student/notifications',
    NOTIFICATION_READ:      (id: string) => `/student/notifications/${id}/read`,
    NOTIFICATIONS_READ_ALL: '/student/notifications/read-all',

    // Bài giảng AI đã được GV duyệt
    BAI_GIANG:      '/student/bai-giang',
    BAI_GIANG_ITEM: (id: string) => `/student/bai-giang/${id}`,
    BAI_GIANG_TAI:  (id: string) => `/student/bai-giang/${id}/tai`,

    // Lộ trình đề kiểm tra theo môn (SV xem)
    LO_TRINH: '/student/lo-trinh',
    CVHT_TONG_QUAN:  '/student/cvht/tong-quan',
    CVHT_CHUYEN_CAN: '/student/diem-danh/chuyen-can',

    // Luyện tập hằng tuần theo buổi
    LUYEN_TAP:         '/student/luyen-tap',
    LUYEN_TAP_NHAC:    '/student/luyen-tap/nhac',
    LUYEN_TAP_BAT_DAU: (id: string) => `/student/luyen-tap/${id}/bat-dau`,
  },

  FILES: {
    DOWNLOAD: (fileId: string) => `/files/${fileId}/download`,
  },

  OCR: {
    EXTRACT: '/ocr', // đọc ảnh đề → text (AI vision)
  },

  STT: {
    TRANSCRIBE: '/stt', // nói → text (Whisper)
  },

  SSO: {
    RIAT_TICKET: '/sso/riat-ticket', // vé SSO sang RIAT E-learning
  },

  DANH_GIA: {
    HIEU_QUA: '/danh-gia/hieu-qua', // báo cáo hiệu quả nền tảng (cán bộ)
  },
} as const;