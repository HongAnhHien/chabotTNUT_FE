import { type FC, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Route, Plus, Trash2, ArrowLeft, Loader2, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '@/infra/api/conflig/axiosInstance';
import { API_ENDPOINTS } from '@/infra/api/conflig/apiEndpoints';
import LoTrinhApi from '@/infra/lotrinh/lotrinh_api';
import type { ILoTrinhChang, LoTrinhLoai } from '@/infra/api/interfaces/ILoTrinh';

const LOAI_LABEL: Record<LoTrinhLoai, string> = {
  kiem_tra_chuong: 'Kiểm tra chương', on_luyen_chuong: 'Ôn luyện chương', giua_ky: 'Giữa kỳ', cuoi_ky: 'Cuối kỳ',
};

interface AsgOpt { id: string; title: string }

const TeacherLoTrinh: FC = () => {
  const { maMon = '' } = useParams<{ maMon: string }>();
  const navigate = useNavigate();
  const [changs, setChangs] = useState<ILoTrinhChang[]>([]);
  const [asgs, setAsgs] = useState<AsgOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ten: '', loai: 'kiem_tra_chuong' as LoTrinhLoai, diem_dat: 50, mo_khi: 'sau_dat_truoc', assignment_id: '', mo_ta: '' });
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    LoTrinhApi.getTeacher(maMon).then(r => setChangs(r.data ?? [])).catch(() => {}).finally(() => setLoading(false));
    // Nạp danh sách bài để gắn vào chặng (best-effort)
    axiosInstance.get(API_ENDPOINTS.ASSIGNMENT.LIST).then(r => {
      const list = (r.data?.data ?? r.data ?? []) as Array<Record<string, unknown>>;
      setAsgs(list
        .filter(a => !a.ma_mon || a.ma_mon === maMon)
        .map(a => ({ id: String(a._id ?? a.id ?? ''), title: String(a.title ?? a.ten ?? a._id ?? '') }))
        .filter(a => a.id));
    }).catch(() => {});
  };
  useEffect(load, [maMon]);

  const submit = async () => {
    if (!form.ten.trim()) return;
    setSaving(true);
    try {
      await LoTrinhApi.create({ ma_mon: maMon, ...form, assignment_id: form.assignment_id || null });
      toast.success('Đã thêm chặng.');
      setForm({ ten: '', loai: 'kiem_tra_chuong', diem_dat: 50, mo_khi: 'sau_dat_truoc', assignment_id: '', mo_ta: '' });
      setAdding(false); load();
    } catch { toast.error('Thêm chặng thất bại.'); }
    finally { setSaving(false); }
  };

  const del = async (id: string, ten: string) => {
    if (!confirm(`Xoá chặng "${ten}"?`)) return;
    try { await LoTrinhApi.remove(id); toast.success('Đã xoá.'); load(); }
    catch { toast.error('Xoá thất bại.'); }
  };

  const persistOrder = async (next: ILoTrinhChang[]) => {
    setChangs(next); // cập nhật ngay (optimistic)
    try {
      await LoTrinhApi.reorder(maMon, next.map(c => c.id));
      toast.success('Đã đổi thứ tự.');
      load();
    } catch { toast.error('Lưu thứ tự thất bại.'); load(); }
  };

  const handleDrop = async (target: number) => {
    const from = dragIdx;
    setDragIdx(null); setOverIdx(null);
    if (from === null || from === target) return;
    const next = [...changs];
    const [moved] = next.splice(from, 1);
    next.splice(target, 0, moved);
    await persistOrder(next);
  };

  const moveChang = async (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= changs.length) return;
    const next = [...changs];
    [next[i], next[j]] = [next[j], next[i]];
    await persistOrder(next);
  };

  return (
    <div style={{ minHeight: '100%', background: '#eef4ff', fontFamily: "'Be Vietnam Pro',system-ui,sans-serif", padding: '1.5rem' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate(-1)} style={{ ...btnGhost, padding: '6px 10px' }}><ArrowLeft size={15} /></button>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Route size={20} color="#2563eb" /> Lộ trình đề kiểm tra
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#64748b' }}>Môn <b>{maMon}</b> · SV phải ĐẠT chặng trước mới mở chặng sau · <span style={{ color: '#2563eb' }}>kéo hàng để đổi thứ tự</span>.</p>
          </div>
          <div style={{ flex: 1 }} />
          {!adding && <button onClick={() => setAdding(true)} style={btnPrimary}><Plus size={14} /> Thêm chặng</button>}
        </div>

        {adding && (
          <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input value={form.ten} onChange={e => setForm(f => ({ ...f, ten: e.target.value }))} placeholder="Tên chặng (VD: Chương 1 — Kiểm tra)" style={inp} />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <label style={lbl}>Loại
                <select value={form.loai} onChange={e => setForm(f => ({ ...f, loai: e.target.value as LoTrinhLoai }))} style={sel}>
                  {Object.entries(LOAI_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
              <label style={lbl}>Điểm đạt (%)
                <input type="number" min={0} max={100} value={form.diem_dat} onChange={e => setForm(f => ({ ...f, diem_dat: Number(e.target.value) }))} style={{ ...sel, width: 90 }} />
              </label>
              <label style={lbl}>Mở khi
                <select value={form.mo_khi} onChange={e => setForm(f => ({ ...f, mo_khi: e.target.value }))} style={sel}>
                  <option value="sau_dat_truoc">Sau khi đạt chặng trước</option>
                  <option value="luon_mo">Luôn mở</option>
                </select>
              </label>
              <label style={lbl}>Bài gắn (tuỳ chọn)
                <select value={form.assignment_id} onChange={e => setForm(f => ({ ...f, assignment_id: e.target.value }))} style={{ ...sel, minWidth: 200 }}>
                  <option value="">— Chưa gắn —</option>
                  {asgs.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                </select>
              </label>
            </div>
            <input value={form.mo_ta} onChange={e => setForm(f => ({ ...f, mo_ta: e.target.value }))} placeholder="Mô tả ngắn (tuỳ chọn)" style={inp} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setAdding(false)} style={btnGhost}>Huỷ</button>
              <button onClick={submit} disabled={saving || !form.ten.trim()} style={{ ...btnPrimary, opacity: form.ten.trim() ? 1 : 0.6 }}>{saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Lưu chặng'}</button>
            </div>
          </div>
        )}

        {loading ? <div style={{ color: '#64748b' }}>Đang tải…</div>
          : changs.length === 0 ? <div style={{ ...card, textAlign: 'center', color: '#64748b' }}>Chưa có chặng nào. Bấm "Thêm chặng" để dựng lộ trình cho môn này.</div>
          : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {changs.map((c, i) => (
                <div
                  key={c.id}
                  draggable
                  onDragStart={() => setDragIdx(i)}
                  onDragOver={e => { e.preventDefault(); if (overIdx !== i) setOverIdx(i); }}
                  onDrop={() => handleDrop(i)}
                  onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
                  style={{
                    ...card, display: 'flex', alignItems: 'center', gap: 12, padding: '0.9rem 1.1rem',
                    opacity: dragIdx === i ? 0.4 : 1,
                    borderTop: overIdx === i && dragIdx !== null && dragIdx !== i ? '2px solid #2563eb' : card.border as string,
                    transition: 'opacity .15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', cursor: 'grab' }} title="Kéo để đổi thứ tự">
                    <GripVertical size={16} /><span style={{ fontWeight: 800, color: '#2563eb', fontSize: '1.1rem' }}>{i + 1}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: '#1e293b' }}>{c.ten}</div>
                    <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: 2, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={tag}>{LOAI_LABEL[c.loai]}</span>
                      <span>Đạt ≥ {c.diem_dat}%</span>
                      <span>{c.mo_khi === 'luon_mo' ? 'Luôn mở' : 'Mở sau chặng trước'}</span>
                      <span style={{ color: c.assignment_id ? '#059669' : '#d97706' }}>{c.assignment_id ? `Bài: ${c.assignment_title ?? c.assignment_id}` : 'Chưa gắn bài'}</span>
                    </div>
                    {c.mo_ta && <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 3 }}>{c.mo_ta}</div>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <button onClick={() => moveChang(i, -1)} disabled={i === 0} title="Lên"
                      style={{ ...arrowBtn, opacity: i === 0 ? 0.35 : 1, cursor: i === 0 ? 'default' : 'pointer' }}><ChevronUp size={15} /></button>
                    <button onClick={() => moveChang(i, 1)} disabled={i === changs.length - 1} title="Xuống"
                      style={{ ...arrowBtn, opacity: i === changs.length - 1 ? 0.35 : 1, cursor: i === changs.length - 1 ? 'default' : 'pointer' }}><ChevronDown size={15} /></button>
                  </div>
                  <button onClick={() => del(c.id, c.ten)} style={btnDanger}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
};

const card: React.CSSProperties = { background: 'white', border: '1px solid rgba(37,99,235,0.1)', borderRadius: 14, boxShadow: '0 6px 24px rgba(37,99,235,0.05)', padding: '1.1rem' };
const inp: React.CSSProperties = { border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '9px 12px', fontSize: '0.88rem', outline: 'none', width: '100%' };
const sel: React.CSSProperties = { border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '6px 9px', fontSize: '0.82rem', outline: 'none' };
const lbl: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 3, fontSize: '0.72rem', color: '#64748b', fontWeight: 600 };
const tag: React.CSSProperties = { background: 'rgba(37,99,235,0.08)', color: '#2563eb', borderRadius: 999, padding: '1px 9px', fontWeight: 700 };
const btnPrimary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, padding: '7px 13px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' };
const btnGhost: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, background: 'white', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 13px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' };
const btnDanger: React.CSSProperties = { display: 'inline-flex', background: 'rgba(220,38,38,0.07)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, padding: '7px 10px', cursor: 'pointer' };
const arrowBtn: React.CSSProperties = { display: 'grid', placeItems: 'center', width: 26, height: 20, background: 'rgba(37,99,235,0.06)', color: '#2563eb', border: '1px solid rgba(37,99,235,0.18)', borderRadius: 6 };

export default TeacherLoTrinh;
