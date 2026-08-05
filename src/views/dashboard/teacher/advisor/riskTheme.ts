// Theme màu dùng chung cho các trang CVHT — cùng convention gradient/tint với
// trang Môn học (xem SubjectRow.tsx COLORS) để đồng bộ phong cách toàn app.
export interface IRiskTheme {
  label: string;
  grad: string;
  glow: string;
  light: string;
  accent: string;
}

export const RISK_THEME: Record<string, IRiskTheme> = {
  binh_thuong: {
    label: 'Bình thường',
    grad: 'linear-gradient(135deg,#065f46,#059669)',
    glow: 'rgba(5,150,105,0.28)',
    light: '#f0fdf4',
    accent: '#059669',
  },
  can_theo_doi: {
    label: 'Cần theo dõi',
    grad: 'linear-gradient(135deg,#78350f,#d97706)',
    glow: 'rgba(217,119,6,0.28)',
    light: '#fffbeb',
    accent: '#d97706',
  },
  can_tu_van_som: {
    label: 'Cần tư vấn sớm',
    grad: 'linear-gradient(135deg,#9a3412,#ea580c)',
    glow: 'rgba(234,88,12,0.28)',
    light: '#fff7ed',
    accent: '#ea580c',
  },
  nguy_co_cao: {
    label: 'Nguy cơ cao',
    grad: 'linear-gradient(135deg,#7f1d1d,#dc2626)',
    glow: 'rgba(220,38,38,0.28)',
    light: '#fef2f2',
    accent: '#dc2626',
  },
};

export const RISK_FALLBACK: IRiskTheme = {
  label: '—',
  grad: 'linear-gradient(135deg,#334155,#64748b)',
  glow: 'rgba(100,116,139,0.25)',
  light: '#f8fafc',
  accent: '#64748b',
};

export function riskTheme(level: string): IRiskTheme {
  return RISK_THEME[level] ?? RISK_FALLBACK;
}
