// Base user (dùng trong auth response)
export interface IUser {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'student' | 'admin' | string;
  portal_code?: string;
  avatar?: string;
}

// Nested profile object từ /auth/me — sinh viên
export interface IStudentProfileData {
  id: string;
  user_id: string;
  student_code: string;
  portal_id: string;
  last_active: string;
  created_at: string;
  updated_at: string;
}

// Nested profile object từ /auth/me — giảng viên
export interface ITeacherProfileData {
  id: string;
  user_id: string;
  teacher_code: string;
  portal_id: string;
  created_at: string;
  updated_at: string;
}

// Hồ sơ HỌC VỤ đã giải mã (chỉ sinh viên) — BE ghép từ mã SV + tên lớp EduSoft.
// Trường không tra được sẽ là null (không bịa).
export interface IAcademicInfo {
  ma_sinh_vien: string;
  nam_tuyen_sinh: number | null;
  khoa_hoc: string | null;      // ví dụ "K58" hoặc "Khoá 2024"
  he_dao_tao: string | null;    // hình thức đào tạo
  danh_hieu: string | null;     // Kỹ sư / Cử nhân / KTS
  co_so: string | null;
  khoa: string | null;          // tên Khoa
  nganh: string | null;
  chuyen_nganh: string | null;
  lop: string | null;           // tên lớp
  ma_lop: string | null;
  nguon: string;                // nguồn giải mã (mức tin cậy)
}

// Full user object từ GET /auth/me
export interface IUserMe extends IUser {
  portal_expires_at: string;
  login_count: number;
  first_login_at: string;
  last_login_at: string;
  created_at: string;
  profile: IStudentProfileData | ITeacherProfileData;
  academic?: IAcademicInfo | null;
}

export interface IUserMeResponse {
  success: boolean;
  data: IUserMe;
}

// Legacy — giữ lại để các component cũ không bị lỗi
export interface IUserProfile extends IUser {
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Admin user list item (API trả về _id từ MongoDB)
export type IAdminUserRole = 'student' | 'teacher' | 'admin';

export interface IAdminUser {
  _id: string;
  username: string;
  name: string;
  email: string | null;
  role: IAdminUserRole;
  is_blocked: boolean;
  blocked_at: string | null;
  blocked_reason: string | null;
  login_count: number;
  last_login_at: string | null;
  first_login_at: string | null;
  created_at: string;
}

export interface IAdminUsersMeta {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

export interface IGetUsersResponse {
  success: boolean;
  data: IAdminUser[];
  meta: IAdminUsersMeta;
}

export interface IGetUserByIdResponse {
  success: boolean;
  data: IAdminUser;
}

export interface IBlockUserRequest {
  reason?: string;
}

export interface IBlockUserResponse {
  success: boolean;
  message: string;
  data: { username: string; is_blocked: boolean; blocked_at: string | null; blocked_reason: string | null };
}

export interface IUnblockUserResponse {
  success: boolean;
  message: string;
  data: { username: string; is_blocked: boolean; blocked_at: null; blocked_reason: null };
}

// ── Request types ─────────────────────────────────────
export interface IUpdateProfileRequest {
  username: string;
  name: string;
  email: string;
  password?: string;
}

export interface IChangePasswordRequest {
  current_password: string;
  new_password: string;
}

// ── Response types ────────────────────────────────────
export interface IGetProfileResponse {
  success: boolean;
  data: { user: IUserProfile };
}

export interface IUpdateProfileResponse {
  success: boolean;
  message: string;
  data: { user: IUser };
}

export interface IChangePasswordResponse {
  success: boolean;
  message: string;
}

export interface IUploadAvatarResponse {
  success: boolean;
  message: string;
  data: { avatar: string };
}
