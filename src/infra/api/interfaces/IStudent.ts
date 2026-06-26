// ── Student semesters ──────────────────────────────────
export interface IStudentSemester {
  hoc_ky: number;
  ten_hoc_ky: string;
  ngay_bat_dau_hk: string;
  ngay_ket_thuc_hk: string;
  is_current: boolean;
}

export interface IStudentSemestersResponse {
  success: boolean;
  data: {
    hoc_ky_hien_tai: number;
    ds_hoc_ky: IStudentSemester[];
  };
}

// ── Student subject file ───────────────────────────────
export interface IStudentSubjectFile {
  id: string;
  type: string;
  type_label: string;
  original_name: string;
  file_size: number | null;
  uploaded_by: string | null;
  created_at: string | null;
  download_url?: string | null;
}

// ── Student subject ────────────────────────────────────
export interface IStudentSubject {
  ma_mon: string;
  ten_mon: string;
  so_tc: string;
  nhom_to?: string | null;
  gv?: string | null;
  phong?: string | null;
  files: IStudentSubjectFile[];
}

// ── Response (old /student/subjects — wrapped) ─────────
export interface IStudentSubjectsResponse {
  success: boolean;
  data: {
    hoc_ky: number;
    ten_hoc_ky: string;
    subjects: IStudentSubject[];
  };
}

// ── Response (new /student/semesters/{hk}/subjects — flat array) ──
export interface IStudentSemesterSubjectsResponse {
  success: boolean;
  data: IStudentSubject[];
}

// ── Student exam status ────────────────────────────────
export type ExamStatus = 'none' | 'not_started' | 'submitted';

export interface IStudentExamStatusResponse {
  success: boolean;
  can_create: boolean;
  status: ExamStatus;
  exam_id: string | null;
  link: string | null;
}
