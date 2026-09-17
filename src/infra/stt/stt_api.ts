import axiosInstance from '@/infra/api/conflig/axiosInstance';
import { API_ENDPOINTS } from '@/infra/api/conflig/apiEndpoints';

export interface ISttResponse {
  success: boolean;
  data?: { text: string };
  message?: string;
}

class SttApi {
  /** Gửi đoạn ghi âm mic → nhận về văn bản (Whisper đọc, tiếng Việt). */
  async transcribe(audio: Blob, filename = 'audio.webm'): Promise<ISttResponse> {
    const form = new FormData();
    form.append('audio', audio, filename);
    const res = await axiosInstance.post<ISttResponse>(API_ENDPOINTS.STT.TRANSCRIBE, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 100_000,
    });
    return res.data;
  }
}

export default new SttApi();
