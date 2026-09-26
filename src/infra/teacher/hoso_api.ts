import axiosInstance from '@/infra/api/conflig/axiosInstance';
import { API_ENDPOINTS } from '@/infra/api/conflig/apiEndpoints';

export interface ITeacherHoSo {
  ho_ten: string;
  ma_gv: string;
  email: string | null;
  /** Bản ghi danh bạ cán bộ TNUT (null nếu chưa khớp được). */
  can_bo: { ma_can_bo: string | null; gioi_tinh: string | null; don_vi: string | null; bo_phan: string | null; chuc_vu: string | null; tinh_trang: string | null } | null;
  to_chuc: { bo_mon: string | null; khoa: string | null };
  giang_day: {
    hoc_ky_moi_nhat: number | null;
    so_lop_hp: number;
    so_hoc_ky: number;
    mon: { ma_mon: string; ten_mon: string; so_tc: string | number | null; so_lop: number; hoc_ky: number[] }[];
    lop_co_van: string[];
  };
}

/** Hồ sơ công tác của GV đang đăng nhập (danh bạ cán bộ + cơ cấu tổ chức + môn giảng dạy). */
export async function getTeacherHoSo(): Promise<ITeacherHoSo> {
  const res = await axiosInstance.get<{ data: ITeacherHoSo }>(API_ENDPOINTS.TEACHER.HO_SO);
  return res.data.data;
}
