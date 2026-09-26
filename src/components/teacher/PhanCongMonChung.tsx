import { type FC, useEffect, useState } from 'react';
import { Users2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '@/infra/api/conflig/axiosInstance';
import { API_ENDPOINTS } from '@/infra/api/conflig/apiEndpoints';

type Vai = 'gvc' | 'gvth' | 'tro_giang';
interface GV { teacher_id: string; username: string | null; name: string | null; vai: Vai | null; la_toi: boolean }
interface PhanCong { ma_mon: string; day_chung: boolean; vai: Record<Vai, string>; giang_vien: GV[] }

const NHAN: Record<Vai, string> = { gvc: 'GVC', gvth: 'GVTH', tro_giang: 'Trợ giảng' };
const MAU: Record<Vai, string> = { gvc: '#1d4ed8', gvth: '#7c3aed', tro_giang: '#0f766e' };

/** Môn có mã PĐT dạy chung toàn trường. */
export const laMonDayChung = (maMon?: string | null) => /^(PDT|PĐT)/i.test((maMon ?? '').trim());

/**
 * Nhóm GV của MÔN DẠY CHUNG + vai (GVC lý thuyết · GVTH thực hành · trợ giảng). Học liệu, đề, bài giảng
 * của một GV hiển thị cho cả nhóm; GV trong nhóm đổi vai trực tiếp ở đây.
 */
const PhanCongMonChung: FC<{ maMon: string }> = ({ maMon }) => {
  const [pc, setPc] = useState<PhanCong | null>(null);

  const load = () => {
    axiosInstance.get<{ data: PhanCong }>(API_ENDPOINTS.TEACHER.PHAN_CONG, { params: { ma_mon: maMon } })
      .then(r => setPc(r.data.data)).catch(() => {});
  };
  useEffect(() => { if (laMonDayChung(maMon)) load(); }, [maMon]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!pc || !pc.day_chung) return null;

  const doiVai = async (g: GV, vai: string) => {
    try {
      await axiosInstance.patch(API_ENDPOINTS.TEACHER.PHAN_CONG, { ma_mon: maMon, teacher_id: g.teacher_id, vai: vai || null });
      toast.success(`Đã cập nhật vai của ${g.name ?? g.username}.`);
      load();
    } catch { toast.error('Không cập nhật được phân công.'); }
  };

  return (
    <div onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', margin: '0 0 6px', fontSize: '0.7rem' }}>
      <span title="Môn học chung toàn trường: tài liệu, đề, bài giảng của một giảng viên hiển thị cho cả nhóm"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fff7ed', color: '#c2410c', borderRadius: 6, padding: '1px 8px', fontWeight: 700 }}>
        <Users2 size={11} /> Môn dạy chung
      </span>
      {pc.giang_vien.map(g => (
        <span key={g.teacher_id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: '1px solid #e2e8f0', borderRadius: 6, padding: '1px 4px 1px 7px', background: 'white' }}>
          <span style={{ color: '#334155', fontWeight: g.la_toi ? 700 : 500 }}>{g.name ?? g.username}{g.la_toi ? ' (tôi)' : ''}</span>
          <select value={g.vai ?? ''} onChange={e => doiVai(g, e.target.value)} title="Vai trong môn"
            style={{ border: 'none', background: 'transparent', fontSize: '0.7rem', fontWeight: 700, color: g.vai ? MAU[g.vai] : '#94a3b8', cursor: 'pointer', outline: 'none' }}>
            <option value="">— vai —</option>
            {(Object.keys(NHAN) as Vai[]).map(v => <option key={v} value={v}>{NHAN[v]}</option>)}
          </select>
        </span>
      ))}
    </div>
  );
};

export default PhanCongMonChung;
