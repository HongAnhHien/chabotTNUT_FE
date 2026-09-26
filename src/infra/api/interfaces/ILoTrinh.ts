// Lộ trình đề kiểm tra theo môn.
export type LoTrinhLoai = 'kiem_tra_chuong' | 'on_luyen_chuong' | 'giua_ky' | 'cuoi_ky';
export type LoTrinhTrangThai = 'da_dat' | 'mo' | 'khoa';

export interface ILoTrinhChang {
  id: string;
  ma_mon: string;
  thu_tu: number;
  ten: string;
  loai: LoTrinhLoai;
  chapters: string[];
  assignment_id: string | null;
  assignment_title?: string | null;   // GV view
  diem_dat: number;
  mo_khi: 'sau_dat_truoc' | 'luon_mo';
  mo_ta: string | null;
  is_active: boolean;
  // SV view:
  ty_le?: number | null;
  da_dat?: boolean;
  trang_thai?: LoTrinhTrangThai;
}

export interface ILoTrinhTeacherResponse { success: boolean; data: ILoTrinhChang[]; }

export interface ILoTrinhStudent {
  tong_chang: number;
  so_dat: number;
  phan_tram: number;
  changs: ILoTrinhChang[];
}
export interface ILoTrinhStudentResponse { success: boolean; data: ILoTrinhStudent; }
export interface ILoTrinhMutationResponse { success: boolean; message?: string; data?: ILoTrinhChang; }
