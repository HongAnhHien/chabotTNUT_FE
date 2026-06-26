import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import type { IStudentAssignmentListItem, ExamType } from "@/infra/api/interfaces/IAssignment";

export const TYPE_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  de_cuong:          { bg: "rgba(30,58,138,0.07)",   color: "#1e3a8a", border: "rgba(30,58,138,0.15)"  },
  ly_thuyet:         { bg: "rgba(124,58,237,0.07)",  color: "#7c3aed", border: "rgba(124,58,237,0.18)" },
  ma_tran_cau_hoi:   { bg: "rgba(5,150,105,0.07)",   color: "#059669", border: "rgba(5,150,105,0.18)"  },
  ngan_hang_cau_hoi: { bg: "rgba(217,119,6,0.07)",   color: "#d97706", border: "rgba(217,119,6,0.18)"  },
  khac:              { bg: "rgba(100,116,139,0.07)", color: "#64748b", border: "rgba(100,116,139,0.15)" },
};

export const TYPE_LABEL: Record<string, string> = {
  de_cuong: "Đề cương",
  ly_thuyet: "Lý thuyết",
  ma_tran_cau_hoi: "Ma trận câu hỏi",
  ngan_hang_cau_hoi: "Ngân hàng câu hỏi",
  khac: "Khác",
};

export const STATUS_CFG = {
  submitted:   { label: "Đã nộp",   bg: "rgba(5,150,105,0.09)",  color: "#059669", icon: <CheckCircle2 size={14} /> },
  not_started: { label: "Chưa làm", bg: "rgba(37,99,235,0.08)",  color: "#2563eb", icon: <Clock        size={14} /> },
  overdue:     { label: "Quá hạn",  bg: "rgba(220,38,38,0.08)",  color: "#dc2626", icon: <AlertCircle  size={14} /> },
};

export const EXAM_TYPE_CFG: Record<ExamType, { label: string; bg: string; color: string; border: string }> = {
  giua_ky:          { label: "Giữa kỳ",          bg: "rgba(124,58,237,0.08)", color: "#7c3aed", border: "rgba(124,58,237,0.2)" },
  kiem_tra_chuong:  { label: "Kiểm tra chương",   bg: "rgba(8,145,178,0.08)",  color: "#0891b2", border: "rgba(8,145,178,0.2)"  },
  on_luyen_chuong:  { label: "Ôn luyện chương",   bg: "rgba(217,119,6,0.08)",  color: "#d97706", border: "rgba(217,119,6,0.2)"  },
};

export const EXAM_TYPE_FILTER = [
  { key: "all",              label: "Tất cả loại" },
  { key: "giua_ky",         label: "Giữa kỳ" },
  { key: "kiem_tra_chuong", label: "Kiểm tra chương" },
  { key: "on_luyen_chuong", label: "Ôn luyện chương" },
];

export const STATUS_FILTER = [
  { key: "all",         label: "Tất cả trạng thái" },
  { key: "not_started", label: "Chưa làm" },
  { key: "submitted",   label: "Đã nộp" },
  { key: "overdue",     label: "Quá hạn" },
];

export const fmtSize = (b: number | null) =>
  !b ? "" : b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1048576).toFixed(1)} MB`;

export const fmtDate = (s: string) => {
  try {
    return new Date(s).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return s;
  }
};

export const getStatusKey = (a: IStudentAssignmentListItem): keyof typeof STATUS_CFG =>
  a.my_status === "submitted" ? "submitted" : a.is_overdue ? "overdue" : "not_started";
