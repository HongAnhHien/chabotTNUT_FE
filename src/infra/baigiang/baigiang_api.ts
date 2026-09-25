import axiosInstance from '@/infra/api/conflig/axiosInstance';
import { API_ENDPOINTS } from '@/infra/api/conflig/apiEndpoints';
import type {
  BaiGiangFormat, BaiGiangNoiDung, IBaiGiangChuongResponse, IBaiGiangListResponse, IBaiGiangResponse,
} from '@/infra/api/interfaces/IBaiGiang';

/** AI đọc cả chương + soạn song ngữ: thường 40–90 giây. */
const GENERATE_TIMEOUT_MS = 5 * 60 * 1000;

/** Tải file trả về dạng blob (có Bearer token) rồi lưu với tên máy chủ đặt. */
async function saveBlob(url: string, params: Record<string, string>, fallbackName: string) {
  const res = await axiosInstance.get(url, { params, responseType: 'blob', timeout: 120_000 });
  const cd = String(res.headers['content-disposition'] ?? '');
  const m = cd.match(/filename\*=UTF-8''([^;]+)/i);
  const name = m ? decodeURIComponent(m[1]) : fallbackName;
  const href = URL.createObjectURL(res.data as Blob);
  const a = document.createElement('a');
  a.href = href; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 2000);
}

/** Soạn bài giảng AI — GV soạn/duyệt, SV xem bài đã duyệt. */
class BaiGiangApi {
  // GV
  async list(maMon: string): Promise<IBaiGiangListResponse> {
    const res = await axiosInstance.get<IBaiGiangListResponse>(API_ENDPOINTS.TEACHER.BAI_GIANG, { params: { ma_mon: maMon } });
    return res.data;
  }
  async chapters(maMon: string): Promise<IBaiGiangChuongResponse> {
    const res = await axiosInstance.get<IBaiGiangChuongResponse>(API_ENDPOINTS.TEACHER.BAI_GIANG_CHUONG, { params: { ma_mon: maMon } });
    return res.data;
  }
  async generate(body: {
    ma_mon: string; chuong: string; muc?: string[]; so_slide?: number; so_cau_hoi?: number; song_ngu?: boolean; xung_ho?: string;
  }): Promise<IBaiGiangResponse> {
    const res = await axiosInstance.post<IBaiGiangResponse>(API_ENDPOINTS.TEACHER.BAI_GIANG_SINH, body, { timeout: GENERATE_TIMEOUT_MS });
    return res.data;
  }
  async get(id: string): Promise<IBaiGiangResponse> {
    const res = await axiosInstance.get<IBaiGiangResponse>(API_ENDPOINTS.TEACHER.BAI_GIANG_ITEM(id));
    return res.data;
  }
  async save(id: string, noiDung: BaiGiangNoiDung): Promise<IBaiGiangResponse> {
    const res = await axiosInstance.patch<IBaiGiangResponse>(API_ENDPOINTS.TEACHER.BAI_GIANG_ITEM(id), { noi_dung: noiDung });
    return res.data;
  }
  async approve(id: string): Promise<IBaiGiangResponse> {
    const res = await axiosInstance.post<IBaiGiangResponse>(API_ENDPOINTS.TEACHER.BAI_GIANG_DUYET(id));
    return res.data;
  }
  async unapprove(id: string): Promise<IBaiGiangResponse> {
    const res = await axiosInstance.post<IBaiGiangResponse>(API_ENDPOINTS.TEACHER.BAI_GIANG_BO_DUYET(id));
    return res.data;
  }
  async remove(id: string): Promise<{ success: boolean; message?: string }> {
    const res = await axiosInstance.delete(API_ENDPOINTS.TEACHER.BAI_GIANG_ITEM(id));
    return res.data;
  }
  download(id: string, fmt: BaiGiangFormat, lang: 'vi' | 'en' = 'vi') {
    return saveBlob(API_ENDPOINTS.TEACHER.BAI_GIANG_TAI(id), { fmt, lang }, `bai-giang.${fmt}`);
  }

  // SV
  async studentList(maMon: string): Promise<IBaiGiangListResponse> {
    const res = await axiosInstance.get<IBaiGiangListResponse>(API_ENDPOINTS.STUDENT.BAI_GIANG, { params: { ma_mon: maMon } });
    return res.data;
  }
  async studentGet(id: string): Promise<IBaiGiangResponse> {
    const res = await axiosInstance.get<IBaiGiangResponse>(API_ENDPOINTS.STUDENT.BAI_GIANG_ITEM(id));
    return res.data;
  }
  studentDownload(id: string, lang: 'vi' | 'en' = 'vi') {
    return saveBlob(API_ENDPOINTS.STUDENT.BAI_GIANG_TAI(id), { fmt: 'pptx', lang }, 'bai-giang.pptx');
  }
}

export default new BaiGiangApi();
