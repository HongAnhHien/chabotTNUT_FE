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
  files: IStudentSubjectFile[];
}

// ── Response ───────────────────────────────────────────
export interface IStudentSubjectsResponse {
  success: boolean;
  data: {
    hoc_ky: number;
    ten_hoc_ky: string;
    subjects: IStudentSubject[];
  };
}
