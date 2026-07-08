// ── Chat session ──────────────────────────────────────
export interface IChatSession {
  id: string;
  name: string;
  user_id?: string;
  subject_id?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
  message_count?: number;
  is_archived?: boolean;
}

export interface ICreateSessionResponse {
  success: boolean;
  session_id: string;
  reused_session: boolean | null;
}

export interface ISessionsResponse {
  success: boolean;
  count: number | null;
  sessions: IChatSession[] | null;
}

// ── Session history ────────────────────────────────────
export interface IChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  intent?: string;
  exam_id?: string;
  // Nếu backend hỗ trợ: id đề đã lưu — cho biết đề này đã được xác nhận trước đó
  saved_exam_id?: string;
}

export interface ISessionHistoryResponse {
  success: boolean;
  session: IChatSession | null;
  messages: IChatHistoryMessage[] | null;
}

export interface IDeleteSessionResponse {
  success: boolean;
  message?: string;
}

// ── SSE streaming ──────────────────────────────────────
export interface ISSEChunk {
  content: string;
  done: boolean;
}

export interface ISSEDoneEvent {
  content: string;
  done: true;
  full_response?: string;
  intent?: string;
  sources?: unknown[];
  exam_id?: string;
  timing?: Record<string, number>;
  session?: IChatSession;
}

// ── Exam (from /chat/exam/{examId}) ───────────────────
export interface IExamChapter {
  id: number;
  title: string;
}

export interface IExamQuestion {
  id?: number;
  chapter_id?: number;
  chapter_title?: string;
  question?: string;
  options?: Record<string, string>;
  answer?: string;
  explanation?: string;
}

export interface IExamDetail {
  exam_id?: string;
  session_id?: string;
  status?: string;
  ma_mon?: string;
  ten_mon?: string;
  subject_id?: string;
  exam_type?: string | null;
  time_limit?: number | null;
  question_count?: number | null;
  chapters?: IExamChapter[];
  questions?: IExamQuestion[];
  created_at?: string;
  confirmed_at?: string | null;
  [key: string]: unknown;
}

export interface IExamResponse {
  success: boolean;
  exam: IExamDetail | null;
}

export interface IConfirmExamBody {
  exam_id: string;
  session_id: string;
  exam_type?: string | null;
  time_limit?: number | null;
  question_count?: number | null;
  chapters?: IExamChapter[];
  questions?: IExamQuestion[];
}

export interface IConfirmExamResponse {
  success: boolean;
  message: string;
  data?: { id: string; exam_id?: string };
}

// ── Saved exams (from /teacher/exams) ─────────────────
export interface ISavedExam {
  id: string;
  exam_id?: string | null;
  ma_mon?: string | null;
  ten_mon?: string | null;
  exam_type?: string | null;
  time_limit?: number | null;
  question_count?: number | null;
  chapters?: IExamChapter[];
  status?: string | null;
  confirmed_at?: string | null;
  created_at?: string | null;
}

export interface ISavedExamsResponse {
  success: boolean;
  data: ISavedExam[];
}

export interface ISavedExamDetailResponse {
  success: boolean;
  data: ISavedExam & {
    questions?: IExamQuestion[];
    session_id?: string | null;
    teacher_id?: string | null;
    updated_at?: string | null;
  };
}

export interface IDeleteExamResponse {
  success: boolean;
  message: string;
}
