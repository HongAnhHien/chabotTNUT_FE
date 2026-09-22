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
  TrendingUp,
  ScanFace,
  Calculator,
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
  /** Phân hệ chạy riêng cần đăng nhập một lần (SSO) — mở qua vé thay vì mở thẳng. */
  sso?: "riat";
  /** Chỉ hiện khi trường mở đợt (dùng cho đăng ký khuôn mặt — dữ liệu sinh trắc, NĐ13). */
  gated?: boolean;
  /** Đích điều hướng theo vai (route nội bộ hoặc URL ngoài). */
  to: (role: Role) => string;
}

// URL phân hệ RIAT E-learning (app Next.js chạy riêng). Cấu hình qua env, mặc định cổng dev 3001.
const RIAT_ELEARNING_URL =
  (import.meta.env.VITE_RIAT_ELEARNING_URL as string | undefined) || "http://localhost:3001";

// Đợt đăng ký khuôn mặt (NĐ13 — dữ liệu sinh trắc): chỉ hiện thẻ khi trường MỞ đợt enroll.
// Bật bằng biến môi trường VITE_ENROLL_KHUON_MAT="1"; mặc định TẮT.
const ENROLL_KHUON_MAT_MO =
  (import.meta.env.VITE_ENROLL_KHUON_MAT as string | undefined) === "1";

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
    key: "danh-gia",
    name: "Đánh giá hiệu quả",
    desc: "Hiệu quả nền tảng: câu hỏi AI, tiến bộ học tập, giờ tiết kiệm, học liệu.",
    icon: TrendingUp,
    roles: ALL,
    status: "available",
    to: () => "/danh-gia",
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
    key: "tinh-toan-ha-tang",
    name: "Tính toán hạ tầng & ROI",
    desc: "Hoạch định năng lực & chi phí: ROI trợ giảng AI + hạ tầng 12.000 (VPS vs token).",
    icon: Calculator,
    roles: [ROLES.ADMIN],
    status: "available",
    to: () => "/tinh-toan-ha-tang",
  },
  {
    key: "tuyen-sinh",
    name: "AI Tuyển sinh",
    desc: "Trợ lý tuyển sinh TNUT.",
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
    desc: "Atlas 33 CTĐT toàn trường · tiên quyết · Gateway/Bridge · dịch chuyển liên ngành · định vị & cố vấn nghề.",
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
    key: "enroll-khuon-mat",
    name: "Đăng ký khuôn mặt",
    desc: "SV tự quét đa góc để điểm danh — xử lý ngay trên máy, chỉ lưu vector, không lưu ảnh (NĐ13).",
    icon: ScanFace,
    roles: [ROLES.STUDENT],
    status: "available",
    gated: true, // chỉ hiện khi mở đợt enroll (VITE_ENROLL_KHUON_MAT="1")
    to: () => "/diem-danh/enroll",
  },
  {
    key: "elearning",
    name: "RIAT E-learning",
    desc: "Nền tảng khoá học RIAT: bồi dưỡng năng lực hướng nghiệp.",
    icon: BookOpen,
    roles: ALL,
    status: "external",
    sso: "riat",
    to: () => RIAT_ELEARNING_URL,
  },
  {
    key: "webgis",
    name: "WebGIS Atlas TNUT",
    desc: "Bản đồ số khuôn viên + trợ lý AI hỏi–đáp: cơ sở, quy hoạch, ngoại trú.",
    icon: Map,
    roles: ALL,
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

/** Thẻ hiển thị trên Atlas (đã ẩn thẻ có cờ khi trường chưa mở đợt enroll). */
export const VISIBLE_APPS: AtlasApp[] = ATLAS_APPS.filter(
  (a) => !a.gated || ENROLL_KHUON_MAT_MO,
);

/** Ứng dụng mà một vai được thấy (ẩn thẻ có cờ khi chưa mở đợt). */
export function appsForRole(role: Role): AtlasApp[] {
  return VISIBLE_APPS.filter((a) => a.roles.includes(role));
}
