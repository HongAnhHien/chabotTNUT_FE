// ── Semesters ─────────────────────────────────────────
export interface ISemester {
  id: string;
  hoc_ky: number;
  ten_hoc_ky: string;
  ngay_bat_dau_hk: string;
  ngay_ket_thuc_hk: string;
  is_current: boolean;
}

export interface ISemestersResponse {
  success: boolean;
  data: {
    hoc_ky_hien_tai: number;
    ds_hoc_ky: ISemester[];
  };
}

// ── Courses per semester ───────────────────────────────
export interface ITeacherSubject {
  _id: string;
  ma_mon: string;
  ten_mon: string;
  so_tc: string;
}

export interface ITeacherClass {
  id_to_hoc: string;
  nhom_to: string;
  ten_lop: string;
  lop: string;
  sl_dk: number;
  ngay_bat_dau: string;
  ngay_ket_thuc: string;
  phong: string;
  thoi_gian_hoc: string;
  status: string;
}

export interface ITeacherSubjectWithClasses {
  subject: ITeacherSubject;
  classes: ITeacherClass[];
}

export interface ITeacherSemesterCoursesResponse {
  success: boolean;
  data: ITeacherSubjectWithClasses[];
}

// ── Students in a class ────────────────────────────────
export interface ITeacherStudent {
  id: string;
  id_sinh_vien: string;
  ma_sinh_vien: string;
  ho_ten: string;
  ho_lot: string;
  ten: string;
  ngay_sinh: string;
  ma_lop: string;
  ten_lop: string;
  dien_thoai: string | null;
  e_mail: string;
}

export interface IStudentsResponse {
  success: boolean;
  data: {
    id_to_hoc: string;
    total: number;
    students: ITeacherStudent[];
  };
}

// ── Subject files ──────────────────────────────────────
export type IFileType = 'de_cuong' | 'ly_thuyet' | 'ma_tran_cau_hoi' | 'ngan_hang_cau_hoi' | 'khac';

export interface ISubjectFile {
  id: string;
  subject_id: string | null;
  ma_mon: string | null;
  uploaded_by: string | null;
  is_private: boolean | null;
  type: IFileType;
  type_label: string;
  original_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  download_url: string;
  created_at: string | null;
}

export interface ISubjectFilesResponse {
  success: boolean;
  data: ISubjectFile[];
}

export interface ISubjectFileResponse {
  success: boolean;
  data: ISubjectFile & {
    updated_at?: string;
  };
}

export interface ISubjectFileDeleteResponse {
  success: boolean;
  message: string;
}

// ── AI training files ──────────────────────────────────
export type IAiFileType = 'de_cuong' | 'ly_thuyet' | 'ma_tran_cau_hoi' | 'ngan_hang_cau_hoi' | 'khac';

export interface IAiFile {
  id: string;
  uploaded_by: string | null;
  is_private: boolean | null;
  type: string;
  type_label: string;
  original_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  external_status: string | null;
  external_response: string | Record<string, unknown> | null;
  download_url: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface IAiFilesResponse {
  success: boolean;
  data: IAiFile[];
}

export interface IAiFileSendResult {
  id: string;
  original_name: string;
  external_status: string;
  external_response: string;
}

export interface IAiFileSendResponse {
  success: boolean;
  data?: IAiFileSendResult[];
  message?: string;
}

export interface IAiFileDeleteResponse {
  success: boolean;
  message: string;
}

export interface IAiFileResendResult {
  id: string;
  original_name: string;
  external_status: string;
  external_response: string;
}

export interface IAiFileResendResponse {
  success: boolean;
  data?: IAiFileResendResult;
  message?: string;
}
