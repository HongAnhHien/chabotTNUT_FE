import axiosInstance from '@/infra/api/conflig/axiosInstance';
import { API_ENDPOINTS } from '@/infra/api/conflig/apiEndpoints';
import { storage, STORAGE_KEYS } from '@/helper/storage';
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
    return res.data;
  }

  async getAnalyticsTrend(days?: number): Promise<IAdvisorTrendResponse> {
    const res = await axiosInstance.get<IAdvisorTrendResponse>(API_ENDPOINTS.ADVISOR.ANALYTICS_TREND, {
      params: days ? { days } : undefined,
    });
    return res.data;
  }
}

export default new AdvisorApi();
