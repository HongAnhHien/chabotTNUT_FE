import type { IExamSchedule } from './IStudent';

// ── Dashboard overview (/student/dashboard/overview) ──
export interface IDashboardOverviewExamType {
  exam_type: string;
  total: number;
  submitted: number;
  avg_score_10: number;
}

export interface IDashboardOverviewSubject {
  ma_mon: string;
  ten_mon: string;
  total_assigned: number;
  submitted: number;
  avg_score_10: number;
  this_semester: { exams_created: number; submitted: number };
  by_exam_type: IDashboardOverviewExamType[];
  lich_thi?: IExamSchedule | null; // chỉ có khi request kèm ?hoc_ky=
}

export interface IDashboardOverview {
  total_login_days: number;
  total_exams_done: number;
  total_chatbot_questions: number;
  total_sessions: number;
  semester_from: string;
  by_subject: IDashboardOverviewSubject[];
}

export interface IDashboardOverviewResponse {
  success: boolean;
  data: IDashboardOverview;
}

// ── Dashboard subject (/student/dashboard?ma_mon=) ────
export interface IDashboardChatbot {
  total_sessions: number;
  total_messages: number;
  by_subject: { subject_id: string; sessions: number; messages: number }[];
  recent_7_days: { date: string; messages: number }[];
}

export interface IDashboardExamScore {
  assignment_id: string;
  title: string;
  exam_type: string;
  submitted: boolean;
  score_10: number;
  submitted_at: string;
}

export interface IDashboardExamType {
  exam_type: string;
  total: number;
  submitted: number;
  avg_score_10: number;
}

export interface IDashboardExams {
  total_assigned: number;
  submitted: number;
  avg_score: number;
  highest_score: number;
  this_semester: { exams_created: number; submitted: number };
  by_exam_type: IDashboardExamType[];
  scores: IDashboardExamScore[];
}

export interface IDashboardAssignments {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  completion_rate: number;
}

export interface IDashboardWeakChapter {
  chapter_id: string;
  chapter_title: string;
  score_10: number;
  level: string;
}

export interface IDashboardProgress {
  level: string;
  level_label: string;
  avg_score: number;
  score_trend: { score_10: number; created_at: string }[];
  weak_chapters: IDashboardWeakChapter[];
}

export interface IDashboardSubjectData {
  chatbot: IDashboardChatbot;
  exams: IDashboardExams;
  assignments: IDashboardAssignments;
  progress: IDashboardProgress;
  lich_thi?: IExamSchedule | null; // chỉ có khi request kèm ?hoc_ky=
}

export interface IDashboardSubjectResponse {
  success: boolean;
  data: IDashboardSubjectData;
}
