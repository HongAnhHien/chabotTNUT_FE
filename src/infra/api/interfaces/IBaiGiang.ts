// Bài giảng AI (dự án 26 — Bài giảng tự động, nối vào Atlas).
// Cấu trúc noi_dung khớp bộ dựng slide của dự án 26 (build_bai_giang.py).

export interface Bi { vi: string; en: string }

export type BaiGiangLayout =
  | 'title' | 'bullets' | 'question' | 'definition' | 'cards3' | 'versus' | 'example' | 'summary' | 'closing';

export interface BaiGiangSlide {
  layout: BaiGiangLayout;
  narration: [string, string][];   // từng câu lời giảng: [tiếng Việt, English]
  nguon: string[];                 // các mục giáo trình nguồn, VD ["1.2"]
  kicker?: Bi;
  title?: Bi;
  sub?: Bi;
  body?: Bi;
  note?: Bi;
  next?: Bi;
  bullets?: Bi[] | 'CLO';
  terms?: [string, string][];
  cards?: { h: Bi; b: Bi; eg: Bi }[];
  left?: { h: Bi; b: Bi };
  right?: { h: Bi; b: Bi };
  rows?: [Bi, Bi][];
}

export interface BaiGiangQuiz {
  q: Bi;
  opts: Bi[];
  ans: number;
  clo: number;
  why: Bi;
  nguon: string[];
}

export interface BaiGiangNoiDung {
  meta: {
    ma_hp: string; ten_mon: string; chapter: string; chapter_title: string; sections: string[];
    bai: number; giang_vien: string; xung_ho: string; song_ngu: boolean; model?: string;
  };
  ten_bai: Bi;
  clo: Bi[];
  slides: BaiGiangSlide[];
  quiz: BaiGiangQuiz[];
  glossary: [string, string][];
}

export type BaiGiangTrangThai = 'nhap' | 'da_duyet';

export interface IBaiGiangSummary {
  id: string;
  ma_mon: string;
  tieu_de: string;
  chuong: string;
  muc: string[];
  trang_thai: BaiGiangTrangThai;
  so_slide: number;
  so_cau_hoi: number;
  song_ngu: boolean;
  so_canh_bao: number;
  duyet_luc: string | null;
  updated_at: string | null;
  nguoi_tao?: string | null;   // môn dạy chung: người soạn
  cua_toi?: boolean;
}

export interface IBaiGiang extends IBaiGiangSummary {
  noi_dung: BaiGiangNoiDung;
  canh_bao?: string[];
}

export interface IBaiGiangChuong {
  chapter: string;
  title: string;
  so_doan: number;
  sections: { section: string; title: string }[];
}

export interface IBaiGiangListResponse { success: boolean; data: IBaiGiangSummary[] }
export interface IBaiGiangResponse { success: boolean; message?: string; data: IBaiGiang }
export interface IBaiGiangChuongResponse { success: boolean; message?: string; data: IBaiGiangChuong[] }
export type BaiGiangFormat = 'pptx' | 'srt' | 'vtt' | 'gift';
