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
    COURSE_STUDENTS:  (idToHoc: string) => `/teacher/courses/${encodeURIComponent(idToHoc)}/students`,

    // File management
    SUBJECT_FILES:        (s: string) => `/teacher/subjects/${s}/files`,
    SUBJECT_FILE:         (s: string, f: string) => `/teacher/subjects/${s}/files/${f}`,
    SUBJECT_FILES_SENT:   (s: string) => `/teacher/subjects/${s}/files/sent`,
    SUBJECT_FILE_MARKDOWN:(s: string, f: string) => `/teacher/subjects/${s}/files/${f}/markdown`,
    SUBJECT_FILE_SUBMIT:  (s: string, f: string) => `/teacher/subjects/${s}/files/${f}/submit`,
    SUBJECT_FILES_BATCH:  (s: string) => `/teacher/subjects/${s}/files/submit-batch`,
    SUBJECT_FILE_SEND:    (s: string) => `/teacher/subjects/${s}/files/send-to-api`,
    SUBJECT_FILE_DEL_SENT:(s: string, f: string) => `/teacher/subjects/${s}/files/${f}/sent`,
    FILE_CANCEL_SEND:     (f: string) => `/teacher/files/${f}/cancel-send`,
    FILES_RESEND:         '/teacher/files/resend',

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
    ASSIGN:  (examId: string) => `/teacher/exams/${examId}/assign`,
    LIST:    '/teacher/assignments',
    DETAIL:  (id: string) => `/teacher/assignments/${id}`,
    UPDATE:  (id: string) => `/teacher/assignments/${id}`,
    DELETE:  (id: string) => `/teacher/assignments/${id}`,
  },

  STUDENT_ASSIGNMENT: {
    LIST:   '/student/assignments',
    DETAIL: (id: string) => `/student/assignments/${id}`,
    SUBMIT: (id: string) => `/student/assignments/${id}/submit`,
  },

  STUDENT: {
    SUBJECTS: '/student/subjects',
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