import { type FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Route, CheckCircle2, Lock, PlayCircle } from 'lucide-react';
import LoTrinhApi from '@/infra/lotrinh/lotrinh_api';
import type { ILoTrinhStudent, LoTrinhLoai, LoTrinhTrangThai } from '@/infra/api/interfaces/ILoTrinh';

const LOAI_LABEL: Record<LoTrinhLoai, string> = {
  kiem_tra_chuong: 'Kiểm tra chương', on_luyen_chuong: 'Ôn luyện chương', giua_ky: 'Giữa kỳ', cuoi_ky: 'Cuối kỳ',
};

const StatusIcon: FC<{ s: LoTrinhTrangThai }> = ({ s }) => {
  if (s === 'da_dat') return <CheckCircle2 size={20} color="#059669" />;
  if (s === 'mo') return <PlayCircle size={20} color="#2563eb" />;
  return <Lock size={18} color="#94a3b8" />;
};

/** "2026-10-03 16:35:00" → "16:35 03/10" */
const gioNgay = (s?: string | null) => (s && s.length >= 16 ? `${s.slice(11, 16)} ${s.slice(8, 10)}/${s.slice(5, 7)}` : '');
const hienTai = () => { const d = new Date(); const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`; };

const StudentLoTrinhPanel: FC<{ maMon: string }> = ({ maMon }) => {
  const navigate = useNavigate();
  const [data, setData] = useState<ILoTrinhStudent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    LoTrinhApi.getStudent(maMon)
      .then(r => { if (alive) setData(r.data); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [maMon]);

  if (loading) return null;
  if (!data || data.tong_chang === 0) return null; // môn chưa có lộ trình → không hiện

  return (
    <div style={{ background: 'white', border: '1px solid rgba(37,99,235,0.12)', borderRadius: 16, boxShadow: '0 6px 24px rgba(37,99,235,0.05)', padding: '1.25rem', marginTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Route size={17} color="#2563eb" /> Lộ trình học phần
        </h3>
        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Đã đạt {data.so_dat}/{data.tong_chang} chặng</span>
      </div>

      {/* Thanh tiến độ */}
      <div style={{ height: 8, borderRadius: 99, background: '#eef2f6', overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ height: '100%', width: `${data.phan_tram}%`, background: 'linear-gradient(90deg,#2563eb,#22c55e)', borderRadius: 99, transition: 'width .3s' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.changs.map((c, i) => {
          const st = c.trang_thai ?? 'khoa';
          // Chỉ cho "Làm bài" khi SV được giao và bài đã tới giờ mở; trước giờ mở hiện giờ mở, quá hạn thì báo
          const now = hienTai();
          const chuaToiGio = !!c.bai_mo_tu && now < c.bai_mo_tu;
          const quaHan = !!c.bai_han && now > c.bai_han;
          const canDo = st === 'mo' && !!c.assignment_id && c.duoc_giao !== false && !chuaToiGio && !quaHan;
          return (
            <div key={c.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12,
              border: `1px solid ${st === 'da_dat' ? 'rgba(5,150,105,0.25)' : st === 'mo' ? 'rgba(37,99,235,0.25)' : '#eef2f6'}`,
              background: st === 'khoa' ? '#f8fafc' : 'white', opacity: st === 'khoa' ? 0.75 : 1,
            }}>
              <div style={{ width: 26, textAlign: 'center', fontWeight: 800, color: '#94a3b8' }}>{i + 1}</div>
              <StatusIcon s={st} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: '#1e293b' }}>{c.ten}</div>
                <div style={{ fontSize: '0.74rem', color: '#64748b', display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
                  <span>{LOAI_LABEL[c.loai]}</span>
                  <span>· Đạt ≥ {c.diem_dat}%</span>
                  {c.ty_le != null && <span style={{ color: c.da_dat ? '#059669' : '#d97706' }}>· Bạn: {c.ty_le}%</span>}
                  {st === 'khoa' && <span style={{ color: '#94a3b8' }}>· Cần đạt chặng trước</span>}
                </div>
              </div>
              {canDo && (
                <button onClick={() => navigate(`/student/assignments/${c.assignment_id}`)}
                  style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                  Làm bài
                </button>
              )}
              {st === 'mo' && c.assignment_id && c.duoc_giao !== false && chuaToiGio && (
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#b45309', whiteSpace: 'nowrap' }}>Mở lúc {gioNgay(c.bai_mo_tu)}</span>
              )}
              {st === 'mo' && c.assignment_id && c.duoc_giao !== false && !chuaToiGio && quaHan && (
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#94a3b8', whiteSpace: 'nowrap' }}>Đã hết hạn</span>
              )}
              {st === 'da_dat' && <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#059669' }}>Đã đạt ✓</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StudentLoTrinhPanel;
