// Vai trò người dùng trong hệ sinh thái PIAI-TNUT.
// student / teacher: suy ra từ Portal. admin / khoa / truong: gán thủ công (quản trị).

export const ROLES = {
  STUDENT: "student",
  TEACHER: "teacher",
  ADMIN: "admin",
  KHOA: "khoa",
  TRUONG: "truong",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** Vai cán bộ — được vào khu vực giảng viên / quản trị chuyên môn. */
export const STAFF_ROLES: Role[] = [ROLES.TEACHER, ROLES.KHOA, ROLES.TRUONG, ROLES.ADMIN];

/** Vai quản trị tổ chức (khoa / trường / admin). */
export const ORG_ADMIN_ROLES: Role[] = [ROLES.KHOA, ROLES.TRUONG, ROLES.ADMIN];

export const ROLE_LABELS: Record<Role, string> = {
  [ROLES.STUDENT]: "Sinh viên",
  [ROLES.TEACHER]: "Giảng viên",
  [ROLES.ADMIN]: "Quản trị hệ thống",
  [ROLES.KHOA]: "Quản trị Khoa",
  [ROLES.TRUONG]: "Quản trị Trường",
};
