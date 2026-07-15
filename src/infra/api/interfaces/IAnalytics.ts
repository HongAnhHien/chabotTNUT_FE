// ── Subjects list (public, dùng cho dropdown chọn môn) ──
export interface ISubject {
  id: string;
  ma_mon: string;
  ten_mon: string;
  so_tc: number | string;
  created_at?: string;
}

export interface ISubjectsResponse {
  success: boolean;
  data: ISubject[];
}

// ── Knowledge map (admin, chỉ chat môn học) ────────────
export interface IKnowledgeMapItem {
  chapter: number;
  chapter_title: string;
  hit_count: number;
  unique_users: number;
  avg_hits_per_user: number;
  student_rate: number | null;
  color: 'red' | 'yellow' | 'green' | null;
}

export interface IKnowledgeMapResponse {
  success: boolean;
  total_students: number;
  hoc_ky: number;
  knowledge_map: IKnowledgeMapItem[];
}

// ── Thống kê tuần (admin, toàn trường) ─────────────────
export interface IWeeklyStatItem {
  week: string;
  total_messages: number;
  unique_users: number;
  exams_created: number;
  by_role: Record<string, unknown>;
}

export interface IWeeklyAnalyticsResponse {
  success: boolean;
  data: IWeeklyStatItem[];
}

// ── Báo cáo học phần tự động (admin) ───────────────────
export interface IReportChatStats {
  total_messages: number;
  unique_users: number;
  unique_sessions: number;
  exams_created: number;
  messages_with_sources: number;
  helpful_rate?: number;
  active_now?: number;
  csat?: { total_ratings: number; avg_score: number; max_score: number } | null;
}

export interface IReportResponse {
  success: boolean;
  subject: { ma_mon: string; ten_mon: string };
  chat: IReportChatStats;
  weekly_trend: IWeeklyStatItem[];
  knowledge_map: { total_students: number; hoc_ky: number; knowledge_map: IKnowledgeMapItem[] };
  quiz: {
    assignments_count: number;
    submissions_count: number;
    avg_score_percent: number | null;
  };
}
