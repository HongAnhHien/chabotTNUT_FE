import { type FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Download, Loader2, Lock, LockOpen, Search, Sheet, CalendarCheck, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import LuyenTapApi from '@/infra/luyentap/luyentap_api';
import type { CotDiem, IBangDiem, IBangDiemLop, IBangDiemRow, ILuyenTapBuoi } from '@/infra/api/interfaces/ILuyenTap';

const COT: CotDiem[] = ['luyen_tap', 'kttx', 'kttp', 'du_an'];
const NHAN: Record<CotDiem, string> = { luyen_tap: 'Luyện tập', kttx: 'KTTX', kttp: 'KT thành phần', du_an: 'Dự án' };
const card: React.CSSProperties = { background: 'white', border: '1px solid #e8edf5', borderRadius: 14, padding: '1rem 1.1rem', boxShadow: '0 4px 16px rgba(30,58,138,0.04)' };
const th: React.CSSProperties = { padding: '8px 6px', fontSize: '0.7rem', fontWeight: 700, color: '#475569', textAlign: 'left', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap', background: '#f8fafc', position: 'sticky', top: 0 };
const td: React.CSSProperties = { padding: '6px', fontSize: '0.78rem', color: '#1e293b', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' };
const f = (v: number | null | undefined) => (v == null ? '—' : String(v));

/** Ô nhập điểm thang 10 — lưu khi rời ô. */
const DiemInput: FC<{ value: number | null; disabled?: boolean; placeholder?: string; onSave: (v: number | null) => Promise<void> }> = ({ value, disabled, placeholder, onSave }) => {
  const [v, setV] = useState(value == null ? '' : String(value));
  useEffect(() => { setV(value == null ? '' : String(value)); }, [value]);
  const commit = async () => {
    const t = v.trim().replace(',', '.');
    const n = t === '' ? null : Number(t);
    if (n !== null && (Number.isNaN(n) || n < 0 || n > 10)) { toast.error('Điểm thang 10 (0–10).'); setV(value == null ? '' : String(value)); return; }
    if (n === value) return;
    await onSave(n);
  };
  return (
    <input value={v} disabled={disabled} placeholder={placeholder} onChange={e => setV(e.target.value)} onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
      style={{ width: 52, padding: '4px 6px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.78rem', textAlign: 'center', background: disabled ? '#f1f5f9' : 'white' }} />
  );
};

const TeacherBangDiem: FC = () => {
  const { maMon = '' } = useParams<{ maMon: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'diem' | 'lich'>('diem');
  const [lops, setLops] = useState<IBangDiemLop[]>([]);
  const [idToHoc, setIdToHoc] = useState('');
  const [bd, setBd] = useState<IBangDiem | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [hienBuoi, setHienBuoi] = useState(false);
  const [ts, setTs] = useState<Record<CotDiem, number> | null>(null);
  const [lich, setLich] = useState<ILuyenTapBuoi[]>([]);
  const [soCau, setSoCau] = useState(0);

  useEffect(() => {
    LuyenTapApi.getLop(maMon).then(ls => { setLops(ls); if (ls[0]) setIdToHoc(ls[0].id_to_hoc); else setLoading(false); })
      .catch(() => { toast.error('Không tải được danh sách lớp.'); setLoading(false); });
    LuyenTapApi.getTeacher(maMon).then(r => { setLich(r.data.buoi); setSoCau(r.data.so_cau_ngan_hang); }).catch(() => {});
  }, [maMon]);

  const load = useCallback(async () => {
    if (!idToHoc) return;
    setLoading(true);
    try { const d = await LuyenTapApi.getBangDiem(maMon, idToHoc); setBd(d); setTs(d.trong_so); }
    catch { toast.error('Không tải được bảng điểm.'); }
    finally { setLoading(false); }
  }, [maMon, idToHoc]);
  useEffect(() => { void load(); }, [load]);

  const rows = useMemo(() => {
    const k = q.trim().toLowerCase();
    return (bd?.rows ?? []).filter(r => !k || r.ho_ten.toLowerCase().includes(k) || r.ma_sv.toLowerCase().includes(k));
  }, [bd, q]);

  const thongKe = useMemo(() => {
    const rs = bd?.rows ?? [];
    const coLuyen = rs.filter(r => r.luyen_tap_da_lam > 0).length;
    const tb = rs.length ? rs.reduce((s, r) => s + (r.luyen_tap_tb ?? 0), 0) / rs.length : 0;
    return { tong: rs.length, coLuyen, tb: Math.round(tb * 100) / 100, chot: rs.filter(r => r.chot).length, canTuVan: rs.filter(r => r.goi_y).length };
  }, [bd]);

  const luu = async (r: IBangDiemRow, patch: Record<string, unknown>) => {
    try { await LuyenTapApi.luuSinhVien({ ma_mon: maMon, id_to_hoc: idToHoc, ma_sv: r.ma_sv, ...patch }); await load(); }
    catch (e: unknown) { toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Lưu thất bại.'); }
  };
  const chot = async (maSvs?: string[], boChot = false) => {
    if (!maSvs && !confirm(boChot ? 'Bỏ chốt điểm cả lớp?' : 'Chốt điểm tổng kết cho mọi sinh viên đã đủ các cột điểm?')) return;
    try { toast.success(await LuyenTapApi.chot({ ma_mon: maMon, id_to_hoc: idToHoc, ma_svs: maSvs, bo_chot: boChot })); await load(); }
    catch { toast.error('Không chốt được.'); }
  };
  const xuat = async () => {
    try {
      const { blob, filename } = await LuyenTapApi.xuat(maMon, idToHoc);
      const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
    } catch { toast.error('Xuất Excel thất bại.'); }
  };
  const luuTrongSo = async () => {
    if (!ts) return;
    const tong = COT.reduce((s, c) => s + Number(ts[c] || 0), 0);
    if (Math.abs(tong - 100) > 0.01) { toast.error(`Tổng trọng số đang là ${tong}% — phải bằng 100%.`); return; }
    try { await LuyenTapApi.luuTrongSo(maMon, ts); toast.success('Đã lưu trọng số.'); await load(); } catch { toast.error('Lưu trọng số thất bại.'); }
  };
  const suaBuoi = async (b: ILuyenTapBuoi, patch: Record<string, unknown>) => {
    try { await LuyenTapApi.updateBuoi(b.id, patch); const r = await LuyenTapApi.getTeacher(maMon); setLich(r.data.buoi); toast.success(`Đã cập nhật ${b.ma_buoi}.`); }
    catch { toast.error('Cập nhật buổi thất bại.'); }
  };

  return (
    <div style={{ minHeight: '100%', background: '#f4f6fb', padding: '1rem 1.25rem 2rem' }}>
      <style>{`@keyframes bd-spin{to{transform:rotate(360deg)}}`}</style>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <button onClick={() => navigate(-1)} style={{ width: 34, height: 34, borderRadius: 10, border: '1.5px solid rgba(37,99,235,0.18)', background: 'rgba(37,99,235,0.06)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><ArrowLeft size={15} /></button>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h1 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}><Sheet size={18} color="#2563eb" /> Bảng điểm & luyện tập — {maMon}</h1>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Máy tự tính cột luyện tập hằng tuần và KTTX; thầy/cô nhập KT thành phần, dự án rồi chốt điểm tổng kết.</div>
        </div>
        <select value={idToHoc} onChange={e => setIdToHoc(e.target.value)} style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.8rem' }}>
          {lops.map(l => <option key={l.id_to_hoc} value={l.id_to_hoc}>{l.ten_lop} · {l.sl_dk} SV</option>)}
        </select>
        <button onClick={xuat} disabled={!idToHoc} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, border: 'none', background: '#059669', color: 'white', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}><Download size={14} /> Xuất Excel</button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {([['diem', 'Bảng điểm'], ['lich', `Lịch luyện tập (${lich.length} buổi)`]] as const).map(([k, t]) => (
          <button key={k} onClick={() => setTab(k)} style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid ' + (tab === k ? '#2563eb' : '#e2e8f0'), background: tab === k ? '#2563eb' : 'white', color: tab === k ? 'white' : '#475569', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}>{t}</button>
        ))}
      </div>

      {lops.length === 0 && !loading && <div style={card}>Thầy/cô chưa có tổ học nào của môn {maMon}.</div>}

      {tab === 'diem' && bd && (
        <>
          {/* Trọng số + thống kê */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12, marginBottom: 12 }}>
            <div style={card}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e3a8a', marginBottom: 8 }}>Trọng số (%)</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                {ts && COT.map(c => (
                  <label key={c} style={{ fontSize: '0.7rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: 3 }}>{NHAN[c]}
                    <input type="number" value={ts[c]} onChange={e => setTs({ ...ts, [c]: Number(e.target.value) })} style={{ width: 70, padding: '4px 6px', borderRadius: 6, border: '1px solid #cbd5e1' }} />
                  </label>
                ))}
                <button onClick={luuTrongSo} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 8, border: '1px solid #2563eb', background: 'white', color: '#2563eb', fontWeight: 700, fontSize: '0.74rem', cursor: 'pointer' }}><Save size={13} /> Lưu</button>
              </div>
            </div>
            <div style={card}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e3a8a', marginBottom: 8 }}>Lớp {bd.lop?.ten_lop}</div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.78rem', color: '#334155' }}>
                <span><b>{thongKe.tong}</b> SV</span>
                <span><b>{thongKe.coLuyen}</b> SV đã luyện tập</span>
                <span>TB luyện tập lớp <b>{thongKe.tb}</b></span>
                <span><b>{thongKe.canTuVan}</b> SV cần tư vấn</span>
                <span><b>{thongKe.chot}</b> đã chốt</span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button onClick={() => chot()} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 8, border: 'none', background: '#1e3a8a', color: 'white', fontWeight: 700, fontSize: '0.74rem', cursor: 'pointer' }}><Lock size={13} /> Chốt cả lớp</button>
                <button onClick={() => chot(undefined, true)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 8, border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontWeight: 700, fontSize: '0.74rem', cursor: 'pointer' }}><LockOpen size={13} /> Bỏ chốt</button>
              </div>
            </div>
          </div>

          <div style={{ ...card, padding: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderBottom: '1px solid #eef2f6', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #e2e8f0', borderRadius: 8, padding: '4px 8px', flex: 1, minWidth: 180 }}>
                <Search size={14} color="#94a3b8" /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm tên hoặc mã SV" style={{ border: 'none', outline: 'none', fontSize: '0.8rem', flex: 1 }} />
              </div>
              <label style={{ fontSize: '0.75rem', color: '#475569', display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                <input type="checkbox" checked={hienBuoi} onChange={e => setHienBuoi(e.target.checked)} /> Hiện điểm từng buổi
              </label>
              {loading && <Loader2 size={15} color="#2563eb" style={{ animation: 'bd-spin 1s linear infinite' }} />}
            </div>
            <div style={{ overflow: 'auto', maxHeight: '65vh' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr>
                    <th style={th}>#</th><th style={th}>Mã SV</th><th style={th}>Họ tên</th>
                    {hienBuoi && bd.buoi.map(b => <th key={b.id} style={{ ...th, textAlign: 'center', color: b.trang_thai === 'chua_mo' ? '#cbd5e1' : '#475569' }}>{b.ma_buoi}</th>)}
                    <th style={th}>Luyện tập ({bd.trong_so.luyen_tap}%)</th>
                    <th style={th}>KTTX ({bd.trong_so.kttx}%)</th>
                    <th style={th}>KT thành phần ({bd.trong_so.kttp}%)</th>
                    <th style={th}>Dự án ({bd.trong_so.du_an}%)</th>
                    <th style={th}>Tổng</th><th style={th}>Chốt</th><th style={th}>Tư vấn học tập</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.ma_sv} style={{ background: r.chot ? 'rgba(5,150,105,0.04)' : undefined }}>
                      <td style={{ ...td, color: '#94a3b8' }}>{i + 1}</td>
                      <td style={{ ...td, fontFamily: 'monospace', fontSize: '0.72rem' }}>{r.ma_sv}</td>
                      <td style={{ ...td, whiteSpace: 'nowrap', fontWeight: 600 }}>{r.ho_ten}</td>
                      {hienBuoi && bd.buoi.map(b => <td key={b.id} style={{ ...td, textAlign: 'center', color: r.luyen_tap[b.id] == null ? '#cbd5e1' : '#0f172a' }}>{f(r.luyen_tap[b.id])}</td>)}
                      <td style={td}><b>{f(r.luyen_tap_tb)}</b> <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>({r.luyen_tap_da_lam} buổi)</span></td>
                      <td style={td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <DiemInput value={r.kttx_dieu_chinh} disabled={r.chot} placeholder={f(r.kttx_tu_dong)} onSave={v => luu(r, { kttx_dieu_chinh: v })} />
                          {r.kttx_dieu_chinh == null && r.kttx_tu_dong != null && <span style={{ fontSize: '0.66rem', color: '#94a3b8' }}>máy</span>}
                        </div>
                      </td>
                      <td style={td}><DiemInput value={r.kttp} disabled={r.chot} onSave={v => luu(r, { kttp: v })} /></td>
                      <td style={td}><DiemInput value={r.du_an} disabled={r.chot} onSave={v => luu(r, { du_an: v })} /></td>
                      <td style={td} title={r.thieu.length ? 'Thiếu: ' + r.thieu.map(c => NHAN[c]).join(', ') : ''}>
                        {r.chot ? <b style={{ color: '#059669' }}>{r.diem_chot}</b> : r.tong != null ? <b>{r.tong}</b> : <span style={{ color: '#94a3b8' }}>{r.tam_tinh}*</span>}
                      </td>
                      <td style={td}>
                        {r.chot
                          ? <button onClick={() => chot([r.ma_sv], true)} title="Bỏ chốt" style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#059669' }}><Lock size={15} /></button>
                          : <button onClick={() => chot([r.ma_sv])} disabled={r.tong == null} title={r.tong == null ? 'Chưa đủ cột điểm' : 'Chốt điểm'} style={{ border: 'none', background: 'none', cursor: r.tong == null ? 'not-allowed' : 'pointer', color: r.tong == null ? '#cbd5e1' : '#475569' }}><LockOpen size={15} /></button>}
                      </td>
                      <td style={{ ...td, fontSize: '0.72rem', color: '#92400e', minWidth: 220 }}>{r.goi_y || <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '8px 12px', fontSize: '0.7rem', color: '#94a3b8' }}>
              * Tạm tính (cột còn thiếu tính 0). KTTX: ô trống = điểm máy chấm bài trên Atlas; nhập số để điều chỉnh (VD cộng phần bài tập ngắn). Luyện tập = TB các buổi đã mở, buổi chưa làm tính 0.
            </div>
          </div>
        </>
      )}

      {tab === 'lich' && (
        <div style={{ ...card, padding: 0 }}>
          <div style={{ padding: '10px 12px', fontSize: '0.78rem', color: '#475569', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarCheck size={15} color="#2563eb" /> Ngân hàng câu hỏi: <b>{soCau}</b> câu. Mỗi lượt rút {lich[0]?.so_cau ?? 10} câu đúng phạm vi buổi, tỉ lệ Biết/Hiểu/Áp dụng/Phân tích 3/3/3/1.
          </div>
          <div style={{ overflow: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead><tr>{['Buổi', 'Nội dung', 'Phạm vi', 'Mở từ', 'Hạn tính điểm', 'Số câu', 'Phút', 'SV đã luyện', 'Trạng thái'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {lich.map(b => (
                  <tr key={b.id}>
                    <td style={{ ...td, fontWeight: 800, color: b.loai === 'ly_thuyet' ? '#1d4ed8' : '#7c3aed' }}>{b.ma_buoi}</td>
                    <td style={td}>{b.ten}</td>
                    <td style={{ ...td, fontSize: '0.7rem', color: '#64748b' }}>C{b.chuong.join(', C')}{b.muc.length ? ' · mục ' + b.muc.join(', ') : ''}</td>
                    <td style={td}><input type="date" defaultValue={b.mo_tu?.slice(0, 10)} onBlur={e => e.target.value && e.target.value !== b.mo_tu?.slice(0, 10) && suaBuoi(b, { mo_tu: e.target.value + ' 00:00:00' })} style={{ fontSize: '0.74rem' }} /></td>
                    <td style={td}><input type="date" defaultValue={b.han?.slice(0, 10)} onBlur={e => e.target.value && e.target.value !== b.han?.slice(0, 10) && suaBuoi(b, { han: e.target.value + ' 23:59:59' })} style={{ fontSize: '0.74rem' }} /></td>
                    <td style={td}>{b.so_cau}</td>
                    <td style={td}>{b.thoi_gian}</td>
                    <td style={td}>{b.so_sv_da_luyen ?? 0}</td>
                    <td style={{ ...td, fontSize: '0.72rem', color: b.trang_thai === 'dang_mo' ? '#059669' : '#94a3b8', fontWeight: 700 }}>
                      {b.trang_thai === 'dang_mo' ? 'Đang mở' : b.trang_thai === 'qua_han' ? 'Quá hạn' : 'Chưa mở'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherBangDiem;
