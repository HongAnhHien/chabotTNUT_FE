import { type FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { CalendarCheck, Lock, PlayCircle, RotateCcw, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import LuyenTapApi from '@/infra/luyentap/luyentap_api';
import type { ILuyenTapBuoi, ILuyenTapTongKet } from '@/infra/api/interfaces/ILuyenTap';

const ngay = (s: string | null) => (s ? s.slice(8, 10) + '/' + s.slice(5, 7) : '');

/** Mở (hoặc tiếp tục) một lượt luyện tập rồi chuyển sang trang làm bài. Dùng chung cho chatbot. */
export async function batDauLuyenTap(buoiId: string, navigate: (to: string) => void): Promise<void> {
  try {
    const asgId = await LuyenTapApi.batDau(buoiId);
    navigate(`/student/assignments/${asgId}`);
  } catch (e: unknown) {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
    toast.error(msg ?? 'Chưa mở được bài luyện tập.');
  }
}

const BuoiCard: FC<{ b: ILuyenTapBuoi; busy: boolean; onStart: () => void }> = ({ b, busy, onStart }) => {
  const st = b.trang_thai ?? 'chua_mo';
  const coDiem = b.diem != null;
  const mau = coDiem ? (b.diem! >= 5 ? '#059669' : '#d97706') : '#64748b';
  return (
    <div style={{
      flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10,
      border: `1px solid ${st === 'dang_mo' && !coDiem ? 'rgba(37,99,235,0.35)' : '#eef2f6'}`,
      background: st === 'chua_mo' ? '#f8fafc' : 'white', opacity: st === 'chua_mo' ? 0.7 : 1,
    }}>
      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: b.loai === 'ly_thuyet' ? '#1d4ed8' : '#7c3aed', width: 38, flexShrink: 0 }}>{b.ma_buoi}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={b.ten}>{b.ten}</div>
        <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
          {st === 'chua_mo' ? `Mở ${ngay(b.mo_tu)}` : `Hạn tính điểm ${ngay(b.han)}`}
          {b.so_lan ? ` · ${b.so_lan} lượt` : ''}
        </div>
      </div>
      {coDiem && <span style={{ fontSize: '0.8rem', fontWeight: 800, color: mau }}>{b.diem}</span>}
      {st === 'chua_mo'
        ? <Lock size={15} color="#94a3b8" />
        : (
          <button onClick={onStart} disabled={busy} title={st === 'qua_han' ? 'Luyện thêm — không tính điểm' : 'Làm 10 câu, máy chấm ngay'}
            style={{ display: 'flex', alignItems: 'center', gap: 4, border: 'none', borderRadius: 8, padding: '5px 9px', cursor: 'pointer',
              fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap',
              background: coDiem || st === 'qua_han' ? 'rgba(37,99,235,0.08)' : '#2563eb', color: coDiem || st === 'qua_han' ? '#2563eb' : 'white' }}>
            {busy ? <Loader2 size={13} style={{ animation: 'ssd-spin 1s linear infinite' }} /> : coDiem ? <RotateCcw size={13} /> : <PlayCircle size={13} />}
            {coDiem ? 'Làm lại' : 'Luyện tập'}
          </button>
        )}
    </div>
  );
};

/** Luyện tập hằng tuần theo buổi (LT/TH) — điểm cao nhất nộp trước hạn tính vào cột luyện tập. */
const StudentLuyenTapPanel: FC<{ maMon: string }> = ({ maMon }) => {
  const navigate = useNavigate();
  const [buoi, setBuoi] = useState<ILuyenTapBuoi[]>([]);
  const [tk, setTk] = useState<ILuyenTapTongKet | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    LuyenTapApi.getStudent(maMon)
      .then(r => { if (alive) { setBuoi(r.data.buoi ?? []); setTk(r.data.tong_ket); } })
      .catch(() => {});
    return () => { alive = false; };
  }, [maMon]);

  if (buoi.length === 0) return null; // môn chưa có lịch luyện tập

  const tuan = [...new Set(buoi.map(b => b.tuan))].sort((a, b) => a - b);
  const start = async (id: string) => { setBusy(id); await batDauLuyenTap(id, navigate); setBusy(null); };

  return (
    <div style={{ background: 'white', border: '1px solid rgba(37,99,235,0.12)', borderRadius: 16, boxShadow: '0 6px 24px rgba(37,99,235,0.05)', padding: '1.25rem', marginTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: 8 }}>
          <CalendarCheck size={17} color="#2563eb" /> Luyện tập hằng tuần
        </h3>
        {tk && (
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
            Đã luyện {tk.da_lam}/{tk.da_mo} buổi đã mở · TB <b style={{ color: '#1e3a8a' }}>{tk.diem_tb ?? '—'}</b>/10
          </span>
        )}
      </div>
      <p style={{ margin: '0 0 12px', fontSize: '0.74rem', color: '#64748b' }}>
        Mỗi buổi 10 câu từ ngân hàng câu hỏi đúng nội dung buổi học, máy chấm và giải thích ngay. Làm lại được nhiều lần;
        điểm cao nhất nộp trước hạn được tính vào cột <b>luyện tập</b> của bảng điểm — buổi chưa làm tính 0.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {tuan.map(t => (
          <div key={t} style={{ display: 'flex', gap: 8, alignItems: 'stretch', flexWrap: 'wrap' }}>
            <div style={{ width: 52, fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', display: 'flex', alignItems: 'center' }}>Tuần {t}</div>
            {buoi.filter(b => b.tuan === t).map(b => (
              <BuoiCard key={b.id} b={b} busy={busy === b.id} onStart={() => start(b.id)} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentLuyenTapPanel;
