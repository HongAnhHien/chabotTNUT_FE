export type LuyenTapTrangThai = 'chua_mo' | 'dang_mo' | 'qua_han';

export interface ILuyenTapBuoi {
  id: string;
  ma_buoi: string;            // LT.1 | TH.4 …
  loai: 'ly_thuyet' | 'thuc_hanh';
  thu_tu: number;
  tuan: number;
  ten: string;
  chuong: number[];
  muc: string[];
  mo_tu: string | null;
  han: string | null;
  so_cau: number;
  thoi_gian: number;
  trang_thai?: LuyenTapTrangThai;
  // SV
  so_lan?: number;
  diem?: number | null;          // điểm cao nhất nộp trước hạn (thang 10)
  diem_moi_nhat?: number | null;
  // GV
  so_sv_da_luyen?: number;
}

export interface ILuyenTapTongKet { da_mo: number; da_lam: number; tong: number; diem_tb: number | null }

export interface ILuyenTapStudentResponse {
  success: boolean;
  data: { ma_mon: string; buoi: ILuyenTapBuoi[]; tong_ket: ILuyenTapTongKet; tuan_nay: ILuyenTapBuoi[] };
}

export interface ILuyenTapNhacResponse {
  success: boolean;
  data: { can_lam: ILuyenTapBuoi[]; tong_ket: ILuyenTapTongKet } | null;
}

export interface ILuyenTapTeacherResponse {
  success: boolean;
  data: { buoi: ILuyenTapBuoi[]; so_cau_ngan_hang: number };
}

export type CotDiem = 'luyen_tap' | 'kttx' | 'kttp' | 'du_an';

export interface IBangDiemRow {
  ma_sv: string;
  ho_ten: string;
  ten_lop: string;
  luyen_tap: Record<string, number | null>;   // buoi_id → điểm
  luyen_tap_so_lan: number;
  luyen_tap_da_lam: number;
  luyen_tap_tb: number | null;
  kttx: number | null;
  kttx_tu_dong: number | null;
  kttx_dieu_chinh: number | null;
  kttp: number | null;
  du_an: number | null;
  tam_tinh: number;
  tong: number | null;
  thieu: CotDiem[];
  chot: boolean;
  diem_chot: number | null;
  ghi_chu: string | null;
  chuong_yeu: { chuong: number; dung: number; tong: number; ty_le: number }[];
  goi_y: string;
}

export interface IBangDiem {
  trong_so: Record<CotDiem, number>;
  cot: Record<CotDiem, string>;
  lop: { id_to_hoc: string; ten_lop: string; sl_dk: number } | null;
  buoi: { id: string; ma_buoi: string; trang_thai: LuyenTapTrangThai; han: string | null }[];
  kttx_bai: string[];
  rows: IBangDiemRow[];
}

export interface IBangDiemLop { id_to_hoc: string; ten_lop: string; nhom_to: string; hoc_ky: number; sl_dk: number; phong: string }
