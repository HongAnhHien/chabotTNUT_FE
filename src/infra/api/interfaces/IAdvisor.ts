import type { IChatSession } from '@/infra/api/interfaces/IChat';

// ── Advisor (CVHT) session ─────────────────────────────
// Reuses IChatSession (id/name/user_id/created_at/...) since ChatHistory/ChatContent
// are shared components already typed against it; advisor sessions just leave
// subject_id/role unset.
export interface ICreateAdvisorSessionResponse {
  success: boolean;
  session_id: string;
}

export interface IAdvisorSessionsResponse {
  success: boolean;
  count?: number | null;
  sessions: IChatSession[] | null;
}

// ── Session history ────────────────────────────────────
// role kept as `string` (not a literal union) — chưa xác nhận backend luôn trả
// đúng chuỗi 'user'/'assistant'; AdvisorChatPage.mapHistory tự chuẩn hoá lại.
export interface IAdvisorHistoryMessage {
  role: string;
  content: string;
  timestamp?: string;
}

export interface IAdvisorSessionHistoryResponse {
  success: boolean;
  session: IChatSession | null;
  messages: IAdvisorHistoryMessage[] | null;
}

export interface IDeleteAdvisorSessionResponse {
  success: boolean;
  message?: string;
}

export interface IRefreshPortalTokenResponse {
  success: boolean;
  message?: string;
}

// ── Chat (non-stream) ──────────────────────────────────
export interface IAdvisorChatResponse {
  success: boolean;
  content?: string;
  session?: IChatSession;
  [key: string]: unknown;
}

// ── SSE streaming ───────────────────────────────────────
// Confirmed shape (BE, 2026-07-11): chunk events carry `content` (length/count
// not fixed — can be per-token or a whole sentence in one event, must be
// appended, not assumed char-by-char); the final event always has
// content: "" plus the authoritative `full_response`. No `intent` field in
// stream events (that only appears on the non-stream POST /advisor/chat).
export type IAdvisorSSEEvent =
  | { content: string; done: false }
  | { content: ''; done: true; full_response: string; message_id: string };

export type IAdvisorSSEDoneEvent = Extract<IAdvisorSSEEvent, { done: true }>;

// ── Trend theo ngày (chỉ CVHT) ─────────────────────────
export interface IAdvisorTrendItem {
  date: string;
  message_count: number;
  unique_users: number;
}

export interface IAdvisorTrendResponse {
  success: boolean;
  data: { trend: IAdvisorTrendItem[] };
}

// ── Dashboard CVHT — Tầng 1 (chi tiết 1 SV) ────────────
export interface IAdvisorRisk {
  score: number;
  level: 'binh_thuong' | 'can_theo_doi' | 'can_tu_van_som' | 'nguy_co_cao';
  label: string;
  color: 'green' | 'yellow' | 'orange' | 'red' | string;
  // tuong_tac đã bị bỏ khỏi response (2026-08-05) — không còn field này.
  // canh_cao giờ cap tối đa 5đ (trước đó không giới hạn, 4đ/lần).
  components: {
    gpa_tich_luy: number;
    gpa_hk_gan: number;
    tien_do: number;
    tc_no: number;
    canh_cao: number;
  };
}

// data có thể là { error: string } khi SV không tồn tại/không thuộc quyền quản lý
// (HTTP 200 giả, xem checkProxyError) — các field dưới đây chỉ có khi thành công.
export interface IPortalStudentInfo {
  ma_sv?: string;
  ho_ten?: string;
  ma_lop?: string;
  // GPA tích lũy (diem_tbtl) trả null khi HK hiện tại chưa được Portal tính điểm
  // (VD: HK mới bắt đầu) — dtb_hoc_ky_truoc cũng có thể null (SV năm nhất, chưa có HK trước).
  diem_tbtl?: number | null;
  dtb_hoc_ky_truoc?: number | null;
  tong_tc_da_hoc?: number;
  so_tc_da_hoc_chua_dat?: number;
  muc_canh_bao?: string;
  risk?: IAdvisorRisk;
  [key: string]: unknown;
}

export interface IPortalStudentInfoResponse {
  success: boolean;
  data: IPortalStudentInfo;
}

// `query` (nội dung câu hỏi thật) luôn null — CVHT chỉ trả độ dài, không trả nội dung.
export interface IAdvisorHistoryItem {
  query: null;
  query_len: number;
  response_len: number;
  elapsed_s: number;
  used_portal_data: boolean;
  created_at: number;
}

export interface IUserHistoryResponse {
  success: boolean;
  data: { user_id: string; history: IAdvisorHistoryItem[] };
}

export interface ILastRecommendationResponse {
  success: boolean;
  data: { user_id: string; recommendation: string | null };
}

// ── Dashboard CVHT — Tầng 2 (lớp CVHT phụ trách) ───────
export interface IClassRiskStudent {
  ma_sv: string;
  ho_ten: string;
  ma_lop: string;
  // null khi Portal chưa tính điểm HK hiện tại / SV chưa có HK trước — xác nhận qua data thật (2026-08-04).
  diem_tbtl: number | null;
  dtb_hoc_ky_truoc: number | null;
  tong_tc_da_hoc: number;
  so_tc_da_hoc_chua_dat: number;
  muc_canh_bao: string;
  chatbot_msgs_30d: number;
  risk: IAdvisorRisk;
}

export interface IClassRiskSummary {
  binh_thuong: number;
  can_theo_doi: number;
  can_tu_van_som: number;
  nguy_co_cao: number;
}

export interface IClassRiskResponse {
  success: boolean;
  data: {
    nhhk: number;
    total: number;
    // Đã gặp thực tế trên production: total > 0 nhưng summary/students thiếu (lỗi
    // Portal giữa chừng phía BE) — FE phải tự fallback, không giả định luôn có đủ.
    summary?: IClassRiskSummary;
    students?: IClassRiskStudent[];
  };
}

export interface IAdoptionRateResponse {
  success: boolean;
  data: {
    nhhk: number;
    total_sv: number;
    da_dung: number;
    chua_dung: number;
    rate: number;
    chatbot_total_sv: number;
  };
}

export interface IRiskOverviewResponse {
  success: boolean;
  data: {
    total_cached: number;
    summary: Record<keyof IClassRiskSummary, { count: number; pct: number }>;
    at_risk_count: number;
    at_risk_rate: number;
    last_updated: string | null;
  };
}

// ── Dashboard CVHT — Tầng 3 (thống kê admin) ───────────
export interface IStudentActivityBucket {
  count: number;
  label: string;
}

export interface IStudentActivityResponse {
  success: boolean;
  data: {
    period_days: number;
    total_students: number;
    active: IStudentActivityBucket;
    occasional: IStudentActivityBucket;
    low: IStudentActivityBucket;
    unused: IStudentActivityBucket;
  };
}

export interface ITopKeywordsResponse {
  success: boolean;
  data: { days: number; keywords: { term: string; count: number }[] };
}

export interface ITopicGroupsResponse {
  success: boolean;
  data: { days: number; groups: { group: string; count: number }[] };
}
