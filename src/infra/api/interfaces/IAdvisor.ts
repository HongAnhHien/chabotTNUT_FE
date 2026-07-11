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
  | { content: ''; done: true; full_response: string };

export type IAdvisorSSEDoneEvent = Extract<IAdvisorSSEEvent, { done: true }>;
