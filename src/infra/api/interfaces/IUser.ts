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

// Full user object từ GET /auth/me
export interface IUserMe extends IUser {
  portal_expires_at: string;
  login_count: number;
  first_login_at: string;
  last_login_at: string;
  created_at: string;
  profile: IStudentProfileData | ITeacherProfileData;
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
export interface IAdminUser {
  _id: string;
  username: string;
  name: string;
  email?: string;
  role: 'admin' | 'user';
  avatar: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IGetUsersResponse {
  success: boolean;
  data: { users: IAdminUser[]; pagination: IPagination };
}

export interface IGetUserByIdResponse {
  success: boolean;
  data: { user: IAdminUser };
}

export interface ICreateUserRequest {
  username: string;
  name: string;
  email: string;
  password: string;
  role?: 'admin' | 'user';
}

export interface IUpdateUserRequest {
  username?: string;
  name?: string;
  email?: string;
  role?: 'admin' | 'user';
}

export interface IAdminUserMutationResponse {
  success: boolean;
  message: string;
  data: { user: IAdminUser };
}

export interface IToggleActiveResponse {
  success: boolean;
  message: string;
  data: { isActive: boolean };
}

export interface IDeleteUserResponse {
  success: boolean;
  message: string;
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
