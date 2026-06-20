import axiosInstance from '@/infra/api/conflig/axiosInstance';
import { API_ENDPOINTS } from '@/infra/api/conflig/apiEndpoints';
import { storage, STORAGE_KEYS } from '@/helper/storage';
import type {
  ICreateSessionResponse,
  ISessionsResponse,
  ISessionHistoryResponse,
  IExamResponse,
  ISSEDoneEvent,
  IConfirmExamBody,
  IConfirmExamResponse,
  ISavedExamsResponse,
  ISavedExamDetailResponse,
  IDeleteExamResponse,
} from '@/infra/api/interfaces/IChat';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://chatbotbe.girc.edu.vn/api';

class ChatApi {
  async createSession(subjectId: string): Promise<ICreateSessionResponse> {
    const res = await axiosInstance.post<ICreateSessionResponse>(
      API_ENDPOINTS.CHAT.SESSION,
      { subject_id: subjectId }
    );
    return res.data;
  }

  async getSessions(): Promise<ISessionsResponse> {
    const res = await axiosInstance.get<ISessionsResponse>(API_ENDPOINTS.CHAT.SESSIONS);
    return res.data;
  }

  async getSessionHistory(sessionId: string): Promise<ISessionHistoryResponse> {
    const res = await axiosInstance.get<ISessionHistoryResponse>(
      API_ENDPOINTS.CHAT.SESSION_HISTORY(sessionId)
    );
    return res.data;
  }

  async getExam(examId: string): Promise<IExamResponse> {
    const res = await axiosInstance.get<IExamResponse>(API_ENDPOINTS.CHAT.EXAM(examId));
    return res.data;
  }

  async streamChat(
    sessionId: string,
    subjectId: string,
    question: string,
    callbacks: {
      onChunk: (content: string) => void;
      onDone: (data: ISSEDoneEvent) => void;
      onError: (err: Error) => void;
    }
  ): Promise<void> {
    const token = storage.get<string>(STORAGE_KEYS.TOKEN, '');

    const res = await fetch(`${BASE_URL}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({ session_id: sessionId, subject_id: subjectId, question }),
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
              const data = JSON.parse(line.slice(6));
              if (data.done) {
                callbacks.onDone(data as ISSEDoneEvent);
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

  // ── Exam CRUD ────────────────────────────────────────
  async confirmExam(subjectId: string, body: IConfirmExamBody): Promise<IConfirmExamResponse> {
    const res = await axiosInstance.post<IConfirmExamResponse>(
      API_ENDPOINTS.EXAM.CONFIRM(subjectId),
      body
    );
    return res.data;
  }

  async getExams(maMon?: string): Promise<ISavedExamsResponse> {
    const res = await axiosInstance.get<ISavedExamsResponse>(API_ENDPOINTS.EXAM.LIST, {
      params: maMon ? { ma_mon: maMon } : undefined,
    });
    return res.data;
  }

  async getExamDetail(id: string): Promise<ISavedExamDetailResponse> {
    const res = await axiosInstance.get<ISavedExamDetailResponse>(API_ENDPOINTS.EXAM.DETAIL(id));
    return res.data;
  }

  async deleteExam(id: string): Promise<IDeleteExamResponse> {
    const res = await axiosInstance.delete<IDeleteExamResponse>(API_ENDPOINTS.EXAM.DELETE(id));
    return res.data;
  }
}

export default new ChatApi();
