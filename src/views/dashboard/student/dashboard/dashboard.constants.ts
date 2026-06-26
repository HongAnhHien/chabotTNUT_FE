export const EXAM_TYPE_LABEL: Record<string, string> = {
  giua_ky: 'Giữa kỳ', kiem_tra_chuong: 'Kiểm tra chương', on_luyen_chuong: 'Ôn luyện',
};
export const EXAM_TYPE_SHORT: Record<string, string> = {
  giua_ky: 'GK', kiem_tra_chuong: 'KT', on_luyen_chuong: 'OL',
};
export const EXAM_TYPE_COLOR: Record<string, { bg: string; color: string }> = {
  giua_ky:          { bg: 'rgba(124,58,237,0.08)',  color: '#7c3aed' },
  kiem_tra_chuong:  { bg: 'rgba(8,145,178,0.08)',   color: '#0891b2' },
  on_luyen_chuong:  { bg: 'rgba(217,119,6,0.08)',   color: '#d97706' },
};
export const MONTHS_VN = ['Th.1','Th.2','Th.3','Th.4','Th.5','Th.6','Th.7','Th.8','Th.9','Th.10','Th.11','Th.12'];
export const HEAT_COLORS = ['#eef0f5', '#c7d7fd', '#93b4fb', '#2966EB'];
export const HEAT_WEEKS  = 18;

export const scoreColor = (s: number | null) =>
  s == null    ? { bg: '#f1f5f9',               color: '#94a3b8' } :
  s >= 8.5     ? { bg: 'rgba(22,163,74,0.1)',   color: '#16a34a' } :
  s >= 7.0     ? { bg: 'rgba(41,102,235,0.1)',  color: '#2966EB' } :
  s >= 5.5     ? { bg: 'rgba(217,119,6,0.1)',   color: '#d97706' } :
                 { bg: 'rgba(220,38,38,0.1)',    color: '#dc2626' };

export const fmt1 = (n: number | null | undefined) => n != null ? n.toFixed(1) : '—';

export const levelCfg = (l: string) => ({
  gioi:       { bg: 'rgba(22,163,74,0.1)',  color: '#16a34a', label: 'Giỏi' },
  kha:        { bg: 'rgba(41,102,235,0.1)', color: '#2966EB', label: 'Khá' },
  trung_binh: { bg: 'rgba(217,119,6,0.1)', color: '#d97706', label: 'Trung bình' },
  yeu:        { bg: 'rgba(220,38,38,0.1)', color: '#dc2626', label: 'Yếu' },
}[l] ?? { bg: '#f1f5f9', color: '#64748b', label: l });

export const fmtDate = (s: string) => {
  try { return new Date(s).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' }); }
  catch { return s; }
};

export const toDs = (s: string) => s.slice(0, 10);
