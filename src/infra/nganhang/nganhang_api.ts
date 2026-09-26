import axiosInstance from '@/infra/api/conflig/axiosInstance';
import { API_ENDPOINTS } from '@/infra/api/conflig/apiEndpoints';

export type CapDo = 'Biết' | 'Hiểu' | 'Áp dụng' | 'Phân tích';
export const CAP_DO: CapDo[] = ['Biết', 'Hiểu', 'Áp dụng', 'Phân tích'];

export interface ICauHoi {
  id: string;
  ma: string;
  chuong: number;
  muc: string | null;
  muc_nguon: string | null;
  cap_do: CapDo;
  do_kho: string | null;
  dang_cau: string | null;
  clo: string | null;
  cau_dan: string;
  a: string; b: string; c: string; d: string;   // A luôn là phương án ĐÚNG
  gt_a: string | null; sai_b: string | null; sai_c: string | null; sai_d: string | null;
  trang_thai: 'dang_dung' | 'tam_an';
  sua_tren_atlas: boolean;
  cap_nhat_boi: string | null;
  cap_nhat_luc: string | null;
  luot: number;
  ty_le_dung: number | null;
}

export interface INganHang {
  thong_ke: {
    tong: number; dang_dung: number; tam_an: number; sua_tren_atlas: number; da_dung: number;
    theo_chuong: Record<string, number>; theo_cap_do: Record<string, number>; theo_do_kho: Record<string, number>;
  };
  tong_loc: number;
  page: number;
  per_page: number;
  items: ICauHoi[];
}

export interface INganHangLoc { chuong?: number | ''; cap_do?: string; trang_thai?: string; q?: string; page?: number; per_page?: number }

/** Ngân hàng câu hỏi trắc nghiệm của môn (GV). */
class NganHangApi {
  async list(maMon: string, loc: INganHangLoc): Promise<INganHang> {
    const params = Object.fromEntries(Object.entries({ ma_mon: maMon, ...loc }).filter(([, v]) => v !== '' && v != null));
    const res = await axiosInstance.get<{ data: INganHang }>(API_ENDPOINTS.TEACHER.NGAN_HANG, { params });
    return res.data.data;
  }
  async them(body: Partial<ICauHoi> & { ma_mon: string }): Promise<string> {
    const res = await axiosInstance.post<{ message: string }>(API_ENDPOINTS.TEACHER.NGAN_HANG, body);
    return res.data.message;
  }
  async sua(id: string, body: Partial<ICauHoi>): Promise<string> {
    const res = await axiosInstance.patch<{ message: string }>(API_ENDPOINTS.TEACHER.NGAN_HANG_ITEM(id), body);
    return res.data.message;
  }
  async xoa(id: string): Promise<string> {
    const res = await axiosInstance.delete<{ message: string }>(API_ENDPOINTS.TEACHER.NGAN_HANG_ITEM(id));
    return res.data.message;
  }
  async xuat(maMon: string): Promise<{ blob: Blob; filename: string }> {
    // 1000 câu: ~15–20s → nới thời gian chờ
    const res = await axiosInstance.get(API_ENDPOINTS.TEACHER.NGAN_HANG_XUAT, { params: { ma_mon: maMon }, responseType: 'blob', timeout: 120000 });
    const m = (res.headers['content-disposition'] as string | undefined)?.match(/filename="?([^";]+)"?/);
    return { blob: res.data, filename: m?.[1] ?? `ngan-hang-cau-hoi-${maMon}.xlsx` };
  }
}

export default new NganHangApi();
