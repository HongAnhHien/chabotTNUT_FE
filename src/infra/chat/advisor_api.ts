import axiosInstance from '@/infra/api/conflig/axiosInstance';
import { API_ENDPOINTS } from '@/infra/api/conflig/apiEndpoints';
import { storage, STORAGE_KEYS } from '@/helper/storage';
import { checkProxyError } from '@/infra/api/checkProxyError';
import type { IChatSession, IFeedbackResponse, IRatingResponse, IAnalyticsSummaryResponse } from '@/infra/api/interfaces/IChat';
import type {
  ICreateAdvisorSessionResponse,
  IAdvisorSessionsResponse,
  IAdvisorSessionHistoryResponse,
  IDeleteAdvisorSessionResponse,
  IRefreshPortalTokenResponse,
  IAdvisorChatResponse,
  IAdvisorSSEEvent,
  IAdvisorSSEDoneEvent,
  IAdvisorTrendResponse,
  IPortalStudentInfoResponse,
  IUserHistoryResponse,
  ILastRecommendationResponse,
  IClassRiskResponse,
  IAdoptionRateResponse,
  IRiskOverviewResponse,
  IStudentActivityResponse,
  ITopKeywordsResponse,
  ITopicGroupsResponse,
} from '@/infra/api/interfaces/IAdvisor';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

// Backend advisor trả tên session ở field `title` (khác với `name` của IChatSession
// dùng chung cho ChatHistory/ChatContent) — chuẩn hoá lại ở đây.
const normalizeSession = (raw: (IChatSession & { title?: string }) | null | undefined): IChatSession | null => {
  if (!raw) return null;
  return { ...raw, name: raw.name ?? raw.title ?? '' };
};

class AdvisorApi {
  async createSession(): Promise<ICreateAdvisorSessionResponse> {
    const res = await axiosInstance.post<ICreateAdvisorSessionResponse>(API_ENDPOINTS.ADVISOR.SESSION);
    return res.data;
  }

  async getSessions(): Promise<IAdvisorSessionsResponse> {
    const res = await axiosInstance.get<IAdvisorSessionsResponse & { sessions: (IChatSession & { title?: string })[] | null }>(
      API_ENDPOINTS.ADVISOR.SESSIONS
    );
    return {
      ...res.data,
      sessions: res.data.sessions?.map(s => normalizeSession(s)!) ?? null,
    };
  }

  async getSessionHistory(sessionId: string): Promise<IAdvisorSessionHistoryResponse> {
    const res = await axiosInstance.get<IAdvisorSessionHistoryResponse & { session: (IChatSession & { title?: string }) | null }>(
      API_ENDPOINTS.ADVISOR.SESSION_DETAIL(sessionId)
    );
    return {
      ...res.data,
      session: normalizeSession(res.data.session),
    };
  }

  async deleteSession(sessionId: string): Promise<IDeleteAdvisorSessionResponse> {
    const res = await axiosInstance.delete<IDeleteAdvisorSessionResponse>(
      API_ENDPOINTS.ADVISOR.SESSION_DELETE(sessionId)
    );
    return res.data;
  }

  // Refresh Portal token khi token cũ hết hạn giữa chừng cuộc chat
  async refreshPortalToken(sessionId: string): Promise<IRefreshPortalTokenResponse> {
    const res = await axiosInstance.put<IRefreshPortalTokenResponse>(
      API_ENDPOINTS.ADVISOR.SESSION_TOKEN(sessionId)
    );
    return res.data;
  }

  async chat(sessionId: string, question: string): Promise<IAdvisorChatResponse> {
    const form = new FormData();
    form.append('session_id', sessionId);
    form.append('question', question);
    const res = await axiosInstance.post<IAdvisorChatResponse>(API_ENDPOINTS.ADVISOR.CHAT, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  }

  async streamChat(
    sessionId: string,
    question: string,
    callbacks: {
      onChunk: (content: string) => void;
      onDone: (data: IAdvisorSSEDoneEvent) => void;
      onError: (err: Error) => void;
    }
  ): Promise<void> {
    const token = storage.get<string>(STORAGE_KEYS.TOKEN, '');

    const form = new FormData();
    form.append('session_id', sessionId);
    form.append('question', question);

    const res = await fetch(`${BASE_URL}${API_ENDPOINTS.ADVISOR.STREAM}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'text/event-stream',
      },
      body: form,
    });

    if (!res.ok || !res.body) {
      throw new Error(`Stream failed: ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6)) as IAdvisorSSEEvent;
              if (data.done) {
                callbacks.onDone(data);
              } else if (data.content) {
                callbacks.onChunk(data.content);
              }
            } catch {
              // ignore malformed lines
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  // ── Feedback / Rating / Analytics ─────────────────────
  async sendFeedback(messageId: string, value: 'like' | 'dislike'): Promise<IFeedbackResponse> {
    const form = new FormData();
    form.append('message_id', messageId);
    form.append('value', value);
    const res = await axiosInstance.post<IFeedbackResponse>(API_ENDPOINTS.ADVISOR.FEEDBACK, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  }

  async sendRating(score: number, sessionId?: string, comment?: string): Promise<IRatingResponse> {
    const form = new FormData();
    form.append('score', String(score));
    if (sessionId) form.append('session_id', sessionId);
    if (comment) form.append('comment', comment);
    const res = await axiosInstance.post<IRatingResponse>(API_ENDPOINTS.ADVISOR.RATING, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  }

  async getAnalyticsSummary(): Promise<IAnalyticsSummaryResponse> {
    const res = await axiosInstance.get<IAnalyticsSummaryResponse>(API_ENDPOINTS.ADVISOR.ANALYTICS_SUMMARY);
    checkProxyError(res.data.data);
    return res.data;
  }

  async getAnalyticsTrend(days?: number): Promise<IAdvisorTrendResponse> {
    const res = await axiosInstance.get<IAdvisorTrendResponse>(API_ENDPOINTS.ADVISOR.ANALYTICS_TREND, {
      params: days ? { days } : undefined,
    });
    checkProxyError(res.data.data);
    return res.data;
  }

  // ── Dashboard CVHT — Tầng 1/2/3 (xem DASHBOARD_CVHT.md) ─
  // Nhóm Portal-based (student-info/class-risk/adoption-rate/risk-overview) không
  // cần session_id CVHT — BE tự lấy Portal access_token qua PortalService.
  async getPortalStudentInfo(maSv: string): Promise<IPortalStudentInfoResponse> {
    const res = await axiosInstance.get<IPortalStudentInfoResponse>(API_ENDPOINTS.ADVISOR.PORTAL_STUDENT_INFO, {
      params: { ma_sv: maSv },
    });
    checkProxyError(res.data.data);
    return res.data;
  }

  async getClassRisk(): Promise<IClassRiskResponse> {
    const res = await axiosInstance.get<IClassRiskResponse>(API_ENDPOINTS.ADVISOR.CLASS_RISK);
    checkProxyError(res.data.data);
    return res.data;
  }

  async getAdoptionRate(): Promise<IAdoptionRateResponse> {
    const res = await axiosInstance.get<IAdoptionRateResponse>(API_ENDPOINTS.ADVISOR.ADOPTION_RATE);
    checkProxyError(res.data.data);
    return res.data;
  }

  async getRiskOverview(): Promise<IRiskOverviewResponse> {
    const res = await axiosInstance.get<IRiskOverviewResponse>(API_ENDPOINTS.ADVISOR.RISK_OVERVIEW);
    checkProxyError(res.data.data);
    return res.data;
  }

  async getUserHistory(userId: string, limit?: number): Promise<IUserHistoryResponse> {
    const res = await axiosInstance.get<IUserHistoryResponse>(API_ENDPOINTS.ADVISOR.USER_HISTORY, {
      params: { user_id: userId, ...(limit ? { limit } : {}) },
    });
    checkProxyError(res.data.data);
    return res.data;
  }

  async getStudentActivity(days?: number): Promise<IStudentActivityResponse> {
    const res = await axiosInstance.get<IStudentActivityResponse>(API_ENDPOINTS.ADVISOR.STUDENT_ACTIVITY, {
      params: days ? { days } : undefined,
    });
    checkProxyError(res.data.data);
    return res.data;
  }

  async getTopKeywords(days?: number, limit?: number): Promise<ITopKeywordsResponse> {
    const res = await axiosInstance.get<ITopKeywordsResponse>(API_ENDPOINTS.ADVISOR.TOP_KEYWORDS, {
      params: { ...(days ? { days } : {}), ...(limit ? { limit } : {}) },
    });
    checkProxyError(res.data.data);
    return res.data;
  }

  async getTopicGroups(days?: number): Promise<ITopicGroupsResponse> {
    const res = await axiosInstance.get<ITopicGroupsResponse>(API_ENDPOINTS.ADVISOR.TOPIC_GROUPS, {
      params: days ? { days } : undefined,
    });
    checkProxyError(res.data.data);
    return res.data;
  }

  async getLastRecommendation(userId: string): Promise<ILastRecommendationResponse> {
    const res = await axiosInstance.get<ILastRecommendationResponse>(API_ENDPOINTS.ADVISOR.LAST_RECOMMENDATION, {
      params: { user_id: userId },
    });
    checkProxyError(res.data.data);
    return res.data;
  }
}

export default new AdvisorApi();
