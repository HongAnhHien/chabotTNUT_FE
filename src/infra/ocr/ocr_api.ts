import axiosInstance from '@/infra/api/conflig/axiosInstance';
import { API_ENDPOINTS } from '@/infra/api/conflig/apiEndpoints';

export interface IOcrResponse {
  success: boolean;
  data?: { text: string };
  message?: string;
}

class OcrApi {
  /** Gửi ảnh đề bài → nhận về văn bản (AI vision đọc, công thức ghi LaTeX). */
  async extract(image: File): Promise<IOcrResponse> {
    const form = new FormData();
    form.append('image', image);
    const res = await axiosInstance.post<IOcrResponse>(API_ENDPOINTS.OCR.EXTRACT, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 70_000,
    });
    return res.data;
  }
}

export default new OcrApi();
