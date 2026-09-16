// Danh mục ứng dụng trong hệ sinh thái Atlas TNUT (PIAI-TNUT).
// Mỗi ứng dụng khai báo vai được thấy + đích điều hướng theo vai.
import {
  GraduationCap,
  Users,
  LayoutDashboard,
  Compass,
  Camera,
  BookOpen,
  Building2,
  Network,
  Map,
  ShieldCheck,
  School,
  FolderTree,
  type LucideIcon,
} from "lucide-react";
import { ROLES, type Role } from "@/constants/roles";

export type AppStatus = "available" | "soon" | "external";

export interface AtlasApp {
  key: string;
  name: string;
  desc: string;
  icon: LucideIcon;
  roles: Role[];
  status: AppStatus;
  /** Nhãn giai đoạn cho ứng dụng "sắp ra mắt". */
  phase?: string;
  /** Đích điều hướng theo vai (route nội bộ hoặc URL ngoài). */
  to: (role: Role) => string;
}

const ALL: Role[] = [ROLES.STUDENT, ROLES.TEACHER, ROLES.KHOA, ROLES.TRUONG, ROLES.ADMIN];
const STAFF: Role[] = [ROLES.TEACHER, ROLES.KHOA, ROLES.TRUONG, ROLES.ADMIN];
const ORG: Role[] = [ROLES.KHOA, ROLES.TRUONG, ROLES.ADMIN];

/** Đích khu vực làm việc chính theo vai. */
function workspace(role: Role): string {
  if (role === ROLES.STUDENT) return "/student/dashboard";
  if (role === ROLES.ADMIN) return "/admin/dashboard";
  return "/teacher/dashboard"; // teacher / khoa / truong
}

export const ATLAS_APPS: AtlasApp[] = [
  {
    key: "tro-giang",
    name: "Trợ giảng AI",
    desc: "Hỏi–đáp bài học, luyện đề, lộ trình học cá nhân hoá.",
    icon: GraduationCap,
    roles: ALL,
    status: "available",
    to: (r) => (r === ROLES.STUDENT ? "/student/chat" : "/teacher/chat"),
  },
  {
    key: "cvht",
    name: "Cố vấn học tập",
    desc: "Tra điểm & thời khoá biểu, tư vấn, cảnh báo sớm.",
    icon: Users,
    roles: ALL,
    status: "available",
    to: (r) => (r === ROLES.STUDENT ? "/student/chat/advisor" : "/teacher/advisor"),
  },
  {
    key: "dashboard",
    name: "Bảng điều khiển",
    desc: "Tổng quan học tập & chỉ số vận hành theo vai.",
    icon: LayoutDashboard,
    roles: ALL,
    status: "available",
    to: workspace,
  },
  {
    key: "cms",
    name: "CMS học liệu",
    desc: "Quản lý tài liệu theo Khoa · Bộ môn · Học phần.",
    icon: FolderTree,
    roles: STAFF,
    status: "available",
    to: () => "/cms",
  },
  {
    key: "quan-tri",
    name: "Quản trị hệ thống",
    desc: "Người dùng, phân quyền, học liệu, nhật ký.",
    icon: ShieldCheck,
    roles: [ROLES.ADMIN],
    status: "available",
    to: () => "/admin/dashboard",
  },
  {
    key: "tuyen-sinh",
    name: "AI Tuyển sinh",
    desc: "Trợ lý tuyển sinh TNUT (admission.tnut.edu.vn).",
    icon: School,
    roles: ALL,
    status: "external",
    to: () => "https://admission.tnut.edu.vn/",
  },
  {
    key: "to-chuc",
    name: "Cơ cấu tổ chức",
    desc: "Khoa · Bộ môn · Ngành · Chuyên ngành (API sẵn sàng).",
    icon: Network,
    roles: ORG,
    status: "soon",
    phase: "GĐ0 — giao diện đang dựng",
    to: () => "/admin/dashboard",
  },
  {
    key: "la-ban",
    name: "La bàn nghề nghiệp",
    desc: "Bản đồ CTĐT, PLO, lộ trình 5 giai đoạn & nghề đích.",
    icon: Compass,
    roles: ALL,
    status: "available",
    to: () => "/laban",
  },
  {
    key: "diem-danh",
    name: "Điểm danh thông minh",
    desc: "Điểm danh camera AI theo lớp & thời khoá biểu.",
    icon: Camera,
    roles: STAFF,
    status: "available",
    to: () => "/diem-danh",
  },
  {
    key: "elearning",
    name: "RIAT E-learning",
    desc: "Đăng ký khoá bồi dưỡng năng lực hướng nghiệp.",
    icon: BookOpen,
    roles: ALL,
    status: "available",
    to: () => "/elearning",
  },
  {
    key: "webgis",
    name: "WebGIS Atlas TNUT",
    desc: "Bản đồ số: cơ sở, phân bố sinh viên ngoại trú.",
    icon: Map,
    roles: STAFF,
    status: "available",
    to: () => "/webgis",
  },
  {
    key: "noi-tru",
    name: "Quản lý nội trú",
    desc: "Ký túc xá: toà nhà, phòng ở, sinh viên lưu trú.",
    icon: Building2,
    roles: [ROLES.TRUONG, ROLES.ADMIN],
    status: "available",
    to: () => "/noitru",
  },
];

/** Ứng dụng mà một vai được thấy. */
export function appsForRole(role: Role): AtlasApp[] {
  return ATLAS_APPS.filter((a) => a.roles.includes(role));
}
