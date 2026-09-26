import axiosInstance from '@/infra/api/conflig/axiosInstance';
import { API_ENDPOINTS } from '@/infra/api/conflig/apiEndpoints';

export interface ICvhtKy {
  hoc_ky: number | string | null;
  ten_hoc_ky: string;
  gpa_hk_4: number | null;
  gpa_hk_10: number | null;
  gpa_tl_4: number | null;
  gpa_tl_10: number | null;
  tc_tich_luy: number | null;
  canh_cao: string;
}

export interface ICvhtHocVu {
  available: boolean;
  message?: string;
  gpa_4?: number | null;
  gpa_10?: number | null;
  gpa_hk_gan?: number | null;
  tc_tich_luy?: number | null;
  tc_chuan?: number;
  canh_cao?: string;
  so_mon_dat?: number;
  mon_no?: { ma_mon: string; ten_mon: string; so_tc: number }[];
  tc_no?: number;
  lich_su?: ICvhtKy[];
}

export interface ICvhtRuiRo {
  score: number;
  level: 'binh_thuong' | 'can_theo_doi' | 'can_tu_van_som' | 'nguy_co_cao';
  label: string;
  color: 'green' | 'yellow' | 'orange' | 'red';
  hk_cham: number;
  components: { key: string; ten: string; diem: number; toi_da: number }[];
}

export interface ICvhtTongQuan {
  ma_sv: string;
  ho_ten: string;
  cvht: string | null;
  hoc_ky_hien_tai: number | null;
  hoc_vu: ICvhtHocVu;
  rui_ro: ICvhtRuiRo | null;
  moc_gpa: { ngay: string | null; hoc_ky: string | null; moc: string; diem_tbtl: number | null; dtb_hk: number | null; tc: number | null }[];
  so_tu_van: { id: string; ngay: string | null; hinh_thuc: string; ten_cvht: string | null; noi_dung: string; khuyen_nghi: string | null; ket_qua: string | null; trang_thai: string }[];
  thong_bao: { id: string; tieu_de: string; noi_dung: string; luc: string | null; da_doc: boolean }[];
  khuyen_nghi: { category: string | null; summary: string; created_at: number } | null;
}

export interface ICvhtLichThi { ma_mon: string | null; ten_mon: string | null; ngay_thi: string; gio_bat_dau: string | null; phong_thi: string | null; hinh_thuc_thi: string | null; days_left: number }

export interface ICvhtChuyenCan { tong_buoi: number; ty_le_co_mat: number | null; diem_chuyen_can: number | null; muc: string; mau: string; vang: number; canh_bao: string[] }

/** Dashboard Cố vấn học tập phía SV — mọi dữ liệu là của chính SV đang đăng nhập. */
class CvhtApi {
  async tongQuan(): Promise<ICvhtTongQuan> {
    const res = await axiosInstance.get<{ data: ICvhtTongQuan }>(API_ENDPOINTS.STUDENT.CVHT_TONG_QUAN, { timeout: 90000 });
    return res.data.data;
  }
  async lichThi(): Promise<ICvhtLichThi[]> {
    const res = await axiosInstance.get<{ data: ICvhtLichThi[] }>(API_ENDPOINTS.STUDENT.UPCOMING_EXAMS);
    return res.data.data ?? [];
  }
  async chuyenCan(): Promise<ICvhtChuyenCan | null> {
    // 404 (chưa có mã SV/chưa điểm danh) là trạng thái bình thường → không để interceptor bật toast lỗi
    const res = await axiosInstance.get<{ success: boolean; data?: ICvhtChuyenCan }>(API_ENDPOINTS.STUDENT.CVHT_CHUYEN_CAN, { validateStatus: s => s < 500 });
    return res.data?.success ? res.data.data ?? null : null;
  }
}

export default new CvhtApi();
