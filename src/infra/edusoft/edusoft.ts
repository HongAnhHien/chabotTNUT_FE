import { useEffect, useState } from 'react';
import axiosInstance from '@/infra/api/conflig/axiosInstance';
import { API_ENDPOINTS } from '@/infra/api/conflig/apiEndpoints';

// ── Kiểu bản đồ giải mã ──────────────────────────────
export interface IEduTienTo { tien_to: string; mo_ta: string; khoa_chinh: string | null; don_vi_chinh: string | null; }
export interface IEduNhom   { kieu_ma: string; nhom: string; y_nghia: string; muc_tin_cay: string; }
export interface IEduMaps {
  lop: { co_so: Record<string, string>; hinh_thuc: Record<string, string>; danh_hieu: Record<string, string>; chuyen_nganh: unknown[] };
  mon: { tien_to: IEduTienTo[]; nhom_ma: IEduNhom[] };
}

export interface IMonHocLabel {
  tien_to: string;
  khoa: string | null;
  bo_mon: string | null;
  nam_hoc: string | null;
  tin_cay: string | null;
}

// ── Cache maps (1 lần / phiên) ───────────────────────
let _cache: Promise<IEduMaps> | null = null;
export function fetchEduMaps(): Promise<IEduMaps> {
  if (!_cache) {
    _cache = axiosInstance
      .get<{ success: boolean; data: IEduMaps }>(API_ENDPOINTS.EDUSOFT.MAPS)
      .then(r => r.data.data)
      .catch(err => { _cache = null; throw err; });
  }
  return _cache;
}

/** Gắn nhãn mã môn học (thuần, dựa trên maps). Không tra được → null. */
export function labelMonHoc(maMon: string, maps: IEduMaps | null): IMonHocLabel | null {
  if (!maps || !maMon) return null;
  const m = /^([A-Za-z]+)(\d+)([A-Za-z]*)$/.exec(maMon.trim());
  if (!m) return null;
  const pre = m[1].toUpperCase();
  const num = m[2];
  const tt = maps.mon.tien_to.find(t => (t.tien_to || '').toUpperCase() === pre) || null;
  const kieu = num.length === 4 ? '4 số' : num.length === 5 ? '5 số' : '3 số (cũ)';
  const nhom = kieu === '3 số (cũ)' ? num.slice(0, 1) : num.slice(0, 2);
  const ny = maps.mon.nhom_ma.find(n => n.kieu_ma === kieu && n.nhom === nhom) || null;
  return {
    tien_to: pre,
    khoa: tt?.khoa_chinh ?? null,
    bo_mon: tt?.don_vi_chinh ?? null,
    nam_hoc: ny?.y_nghia ?? null,
    tin_cay: ny?.muc_tin_cay ?? null,
  };
}

/** Hook tiện dụng: nạp maps 1 lần cho component. */
export function useEduMaps(): IEduMaps | null {
  const [maps, setMaps] = useState<IEduMaps | null>(null);
  useEffect(() => {
    let alive = true;
    fetchEduMaps().then(m => { if (alive) setMaps(m); }).catch(() => { /* im lặng: nhãn chỉ là phụ trợ */ });
    return () => { alive = false; };
  }, []);
  return maps;
}
