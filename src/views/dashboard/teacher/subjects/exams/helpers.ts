export const fmtDate = (iso?: string | null) => {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso));
};

export const fmtDt = (s?: string | null) => {
  if (!s) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(s.replace(' ', 'T')));
};

export const toInput   = (s?: string | null) => s ? s.slice(0, 16).replace(' ', 'T') : '';
export const toApiDate = (dt: string)         => dt ? dt.replace('T', ' ') + ':00' : '';

export const EXAM_TYPE_LABEL: Record<string, string> = {
  kiem_tra_chuong: 'Kiểm tra chương',
  giua_ky:         'Giữa kỳ',
};
