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
    SUBJECT_FILES:        (subjectId: string) => `/teacher/subjects/${subjectId}/files`,
    SUBJECT_FILE:         (subjectId: string, fileId: string) => `/teacher/subjects/${subjectId}/files/${fileId}`,
    SUBJECT_AI_FILES:     (subjectId: string) => `/teacher/subjects/${subjectId}/files/sent-to-api`,
    SUBJECT_AI_SEND:      (subjectId: string) => `/teacher/subjects/${subjectId}/files/send-to-api`,
    SUBJECT_AI_FILE_DEL:  (subjectId: string, fileId: string) => `/teacher/subjects/${subjectId}/files/${fileId}/sent-to-api`,
    SUBJECT_AI_RESEND:    (subjectId: string, fileId: string) => `/teacher/subjects/${subjectId}/files/${fileId}/resend`,
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