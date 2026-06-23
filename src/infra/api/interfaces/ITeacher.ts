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
export type IFileExternalStatus =
  | 'pending' | 'parsed' | 'send_queued' | 'sending' | 'success' | 'failed' | null;

export interface ISubjectFile {
  id: string;
  subject_id?: string | null;
  ma_mon?: string | null;
  teacher_id?: string | null;
  uploaded_by?: string | null;
  is_private?: boolean | null;
  type: IFileType;
  type_label: string;
  original_name?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
  external_status?: IFileExternalStatus;
  external_response?: { error?: string; step?: 'parse' | 'send'; [k: string]: unknown } | string | null;
  parsed_path?: string | null;
  download_url: string;
  created_at?: string | null;
  updated_at?: string | null;
}

// ── File tree (GET /files/tree) ────────────────────────
export interface IFileTreeSlot {
  label: string;
  single: boolean;
  file?: ISubjectFile | null;
  files?: ISubjectFile[];
}

export type IFileTree = Partial<Record<IFileType, IFileTreeSlot>>;

export interface IFileTreeResponse {
  success: boolean;
  data: IFileTree;
}

export interface ISubjectFilesResponse {
  success: boolean;
  data: ISubjectFile[];
}

export interface ISubjectFileResponse {
  success: boolean;
  data: ISubjectFile;
}

export interface ISubjectFileDeleteResponse {
  success: boolean;
  message: string;
}

// Sent files (poll endpoint)
export interface ISentFilesResponse {
  success: boolean;
  data: ISubjectFile[];
}

// Markdown review
export interface IFileMarkdownResponse {
  success: boolean;
  data: { id: string; original_name: string; markdown: string };
}

// Submit single file
export interface ISubmitFileResponse {
  success: boolean;
  message: string;
  data: { id: string; original_name: string; external_status: string };
}

// Submit batch
export interface ISubmitBatchItem { id: string; markdown: string }
export interface ISubmitBatchResponse {
  success: boolean;
  message: string;
  data: Array<{ id: string; original_name: string; external_status: string }>;
}

// Cancel send
export interface ICancelSendResponse {
  success: boolean;
  message: string;
  data: { id: string; original_name: string; external_status: string };
}

// Resend failed files
export interface IResendFilesResponse {
  success: boolean;
  message: string;
  data: Array<{ id: string; original_name: string; external_status: string }>;
}

// send-to-api (upload + queue for parsing)
export interface ISendToApiResult {
  id: string;
  original_name: string;
  external_status: string;
}

export interface ISendToApiResponse {
  success: boolean;
  message?: string;
  data?: ISendToApiResult[];
}

// ── AI training files (legacy — kept for backward compat) ─
export type IAiFileType = 'de_cuong' | 'ly_thuyet' | 'ma_tran_cau_hoi' | 'ngan_hang_cau_hoi' | 'khac';
export type IAiFile = ISubjectFile;
export interface IAiFilesResponse { success: boolean; data: IAiFile[] }
export interface IAiFileSendResponse { success: boolean; data?: ISendToApiResult[]; message?: string }
export interface IAiFileDeleteResponse { success: boolean; message: string }
export interface IAiFileResendResponse { success: boolean; data?: ISendToApiResult; message?: string }
export interface IAiFileSendResult extends ISendToApiResult { external_response: string }
export interface IAiFileResendResult extends ISendToApiResult { external_response: string }
