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

  USERS: {
    LIST:         '/users',
    DETAIL:       (id: string) => `/users/${id}`,
    CREATE:       '/users',
    UPDATE:       (id: string) => `/users/${id}`,
    TOGGLE_ACTIVE:(id: string) => `/users/${id}/active`,
    DELETE:       (id: string) => `/users/${id}`,
  },

  TEACHER: {
    SEMESTERS:        '/teacher/semesters',
    SEMESTER_COURSES: (hocKy: number) => `/teacher/semesters/${hocKy}`,
    COURSE_STUDENTS:   (idToHoc: string) => `/teacher/courses/${encodeURIComponent(idToHoc)}/students`,
    COURSE_ANALYTICS:  (idToHoc: string) => `/teacher/courses/${encodeURIComponent(idToHoc)}/analytics`,
    SUBJECT_ANALYTICS: (maMon: string)   => `/teacher/subjects/${maMon}/analytics`,

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

    // Parse logs
    PARSE_LOGS:       '/teacher/parse-logs',
    PARSE_LOGS_STATS: '/teacher/parse-logs/stats',

    // Notifications
    NOTIFICATIONS:          '/teacher/notifications',
    NOTIFICATION_READ:      (id: string) => `/teacher/notifications/${id}/read`,
    NOTIFICATIONS_READ_ALL: '/teacher/notifications/read-all',

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
    EXAM:            (examId: string) => `/chat/exam/${examId}`,
    STREAM:          '/chat/stream',
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
  },

  FILES: {
    DOWNLOAD: (fileId: string) => `/files/${fileId}/download`,
  },

  // GeoRisk legacy — sẽ xóa sau khi refactor
  LOCATIONS: {
    STATISTICS:  '/private/locations/statistics',
    MAP:         '/private/locations/map',
    LIST:        '/private/locations',
    DETAIL:      (id: string) => `/private/locations/${id}`,
    CREATE:      '/private/locations',
    UPDATE:      (id: string) => `/private/locations/${id}`,
    DELETE:      (id: string) => `/private/locations/${id}`,
    DELETE_MANY: '/private/locations',
    BACKUP:      '/private/locations/backup',
    IMPORT:      '/private/locations/import',
  },
} as const;