export const fmtDt = (s?: string | null) => {
  if (!s) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(s.replace(' ', 'T')));
};

// date string "YYYY-MM-DD HH:mm:ss" → datetime-local input value (local, no timezone shift)
export const toInput = (s?: string | null) => s ? s.slice(0, 16).replace(' ', 'T') : '';

// datetime-local value → API format "YYYY-MM-DD HH:mm:ss"
export const toApiDate = (dt: string) => dt ? dt.replace('T', ' ') + ':00' : '';

export const initials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  return ((parts[parts.length - 2] ?? parts[0] ?? '').charAt(0) + (parts[parts.length - 1] ?? '').charAt(0)).toUpperCase();
};

export const fmtDuration = (seconds?: number | null) => {
  if (seconds == null) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}ph ${s}s`;
};

export const statusPill = (status: string) => {
  const open = status === 'published' || status === 'open';
  return {
    background: open ? '#ecfdf3' : '#f1f5f9',
    color:      open ? '#15803d' : '#64748b',
    label:      open ? 'Đang mở' : 'Đã đóng',
  };
};

export const studentStatusMeta = {
  submitted:   { label: 'Đã nộp',   bg: '#ecfdf3', color: '#15803d' },
  in_progress: { label: 'Đang làm', bg: '#eff5ff', color: '#1d4ed8' },
  not_started: { label: 'Chưa làm', bg: '#f1f5f9', color: '#64748b' },
} as const;

// score theo thang tổng số câu (vd: 8 đúng / 10 câu) — dùng cho bảng điểm danh sách
export const scoreColor = (score: number | null, total: number | null) => {
  if (score == null || total == null || total === 0) return '#cbd5e1';
  const pct = (score / total) * 10;
  return pct >= 8 ? '#15803d' : pct >= 5 ? '#b45309' : '#dc2626';
};

// score đã ở thang điểm 10 sẵn (vd: chi tiết bài làm 1 học sinh) — không chia lại theo total
export const scoreColorTen = (score: number | null) => {
  if (score == null) return '#cbd5e1';
  return score >= 8 ? '#15803d' : score >= 5 ? '#b45309' : '#dc2626';
};
