// ── Teacher: Assign exam ──────────────────────────────
export interface IAssignExamBody {
  id_to_hoc?: string;
  student_codes?: string[];
  available_from: string;
  due_at: string;
  title?: string;
  instructions?: string;
}

export interface IAssignExamResult {
  id: string;
  title: string;
  student_count: number;
  available_from: string;
  due_at: string;
  status: string;
}

export interface IAssignExamResponse {
  success: boolean;
  message: string;
  data?: IAssignExamResult;
}

// ── Teacher: Assignment list ───────────────────────────
export interface IAssignmentListItem {
  id: string;
  exam_mongo_id: string;
  ma_mon: string;
  title: string;
  student_count: number;
  submitted_count: number;
  available_from: string;
  due_at: string;
  status: string;
  created_at: string;
}

export interface IAssignmentsListResponse {
  success: boolean;
  data: IAssignmentListItem[];
}

// ── Teacher: Assignment detail ─────────────────────────
export interface IAssignmentStats {
  total: number;
  submitted: number;
  in_progress: number;
  not_started: number;
}

export interface IAssignmentStudentItem {
  student_code: string;
  name: string;
  status: 'submitted' | 'not_started' | 'in_progress';
  score: number | null;
  total: number | null;
  submitted_at: string | null;
}

export interface IAssignmentDetail {
  id: string;
  exam_mongo_id: string;
  ma_mon: string;
  title: string;
  instructions: string | null;
  available_from: string;
  due_at: string;
  status: string;
  stats: IAssignmentStats;
  students: IAssignmentStudentItem[];
}

export interface IAssignmentDetailResponse {
  success: boolean;
  data: IAssignmentDetail;
}

// ── Teacher: Patch / Delete ────────────────────────────
export interface IPatchAssignmentBody {
  title?: string;
  instructions?: string | null;
  available_from?: string;
  due_at?: string;
  status?: 'published' | 'closed';
  student_codes?: string[];
}

export interface IPatchAssignmentResponse {
  success: boolean;
  message: string;
  data?: { id: string };
}

export interface IDeleteAssignmentResponse {
  success: boolean;
  message: string;
}

// ── Student: Assignment list ───────────────────────────
export type ExamType = 'giua_ky' | 'kiem_tra_chuong' | 'on_luyen_chuong';

export interface IStudentAssignmentListItem {
  id: string;
  ma_mon: string;
  title: string;
  instructions: string | null;
  available_from: string;
  due_at: string;
  is_overdue: boolean;
  my_status: 'not_started' | 'submitted';
  my_score: number | null;
  total: number | null;
  submitted_at: string | null;
  exam_type: ExamType | null;
}

export interface IStudentAssignmentsResponse {
  success: boolean;
  data: IStudentAssignmentListItem[];
}

// ── Student: Assignment detail ─────────────────────────
export interface IStudentAssignmentInfo {
  id: string;
  title: string;
  instructions: string | null;
  available_from: string;
  due_at: string;
  is_overdue: boolean;
  time_limit: number | null;
}

export interface IStudentQuestion {
  id: number;
  chapter_id: number;
  chapter_title: string;
  question: string;
  options: Record<string, string>;
  answer?: string;
  explanation?: string;
}

export interface IStudentSubmissionAnswer {
  question_id: number;
  answer: string;
  is_correct: boolean;
}

export interface IStudentSubmission {
  score: number;
  total: number;
  submitted_at: string;
  status: string;
  answers: IStudentSubmissionAnswer[];
}

export interface IStudentAssignmentDetailResponse {
  success: boolean;
  data: {
    assignment: IStudentAssignmentInfo;
    questions: IStudentQuestion[];
    my_submission: IStudentSubmission | null;
  };
}

// ── Student: Submit ────────────────────────────────────
export interface ISubmitAnswerItem {
  question_id: number;
  answer: string;
}

export interface ISubmitBody {
  answers: ISubmitAnswerItem[];
}

export interface IChapterResult {
  chapter_id: number;
  chapter_title: string;
  correct: number;
  total: number;
}

export interface ISubmitResult {
  score: number;
  total: number;
  percent: number;
  duration_seconds?: number;
  chapter_results?: IChapterResult[];
}

export interface ISubmitResponse {
  success: boolean;
  message: string;
  data?: ISubmitResult;
}

export interface IStartAssignmentResponse {
  success: boolean;
  message: string;
  started_at: string;
}
