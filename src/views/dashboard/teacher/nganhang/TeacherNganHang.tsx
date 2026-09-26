import { type FC, useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Database, Download, EyeOff, Eye, Pencil, Plus, Search, Trash2, X, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import NganHangApi, { CAP_DO, type ICauHoi, type INganHang, type INganHangLoc } from '@/infra/nganhang/nganhang_api';

const MAU_CAP_DO: Record<string, [string, string]> = {
  'Biết': ['#eff6ff', '#1d4ed8'], 'Hiểu': ['#f0fdf4', '#15803d'], 'Áp dụng': ['#fff7ed', '#c2410c'], 'Phân tích': ['#faf5ff', '#7e22ce'],
};
const card: React.CSSProperties = { background: 'white', border: '1px solid #e8edf5', borderRadius: 14, padding: '1rem 1.1rem', boxShadow: '0 4px 16px rgba(30,58,138,0.04)' };
const inp: React.CSSProperties = { border: '1px solid #cbd5e1', borderRadius: 8, padding: '6px 9px', fontSize: '0.8rem', outline: 'none', background: 'white' };
const btn = (bg: string, fg: string, bd = 'transparent'): React.CSSProperties => ({ display: 'inline-flex', alignItems: 'center', gap: 5, background: bg, color: fg, border: `1px solid ${bd}`, borderRadius: 8, padding: '6px 11px', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' });
const errMsg = (e: unknown, d: string) => (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? d;

/** Chỉ số dùng thật → nhãn độ khó thực nghiệm. */
const ChiSo: FC<{ c: ICauHoi }> = ({ c }) => {
  if (!c.luot) return <span style={{ color: '#94a3b8' }}>Chưa có SV làm</span>;
  const p = c.ty_le_dung ?? 0;
  const [mau, nhan] = c.luot < 5 ? ['#64748b', 'ít dữ liệu'] : p >= 90 ? ['#b45309', 'rất dễ'] : p <= 30 ? ['#b91c1c', 'rất khó'] : ['#15803d', 'phù hợp'];
  return <span style={{ color: mau }}>{c.luot} lượt · đúng {p}% <i>({nhan})</i></span>;
};

const TRONG: Partial<ICauHoi> = { chuong: 1, cap_do: 'Hiểu', do_kho: 'Trung bình', cau_dan: '', a: '', b: '', c: '', d: '', gt_a: '', sai_b: '', sai_c: '', sai_d: '', muc: '', muc_nguon: '' };

/** Hộp thêm / sửa câu. Phương án A luôn là đáp án đúng (đề luyện tập tự trộn khi ra đề). */
const FormCau: FC<{ ban: Partial<ICauHoi>; onClose: () => void; onSave: (v: Partial<ICauHoi>) => Promise<void> }> = ({ ban, onClose, onSave }) => {
  const [v, setV] = useState<Partial<ICauHoi>>(ban);
  const [luu, setLuu] = useState(false);
  const set = (k: keyof ICauHoi) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setV({ ...v, [k]: k === 'chuong' ? Number(e.target.value) : e.target.value });
  const ta = (k: keyof ICauHoi, rows = 2, ph = '') => (
    <textarea value={(v[k] as string) ?? ''} onChange={set(k)} rows={rows} placeholder={ph} style={{ ...inp, width: '100%', resize: 'vertical', fontFamily: 'inherit' }} />
  );
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ ...card, width: 'min(760px,100%)', maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
          <h3 style={{ margin: 0, fontSize: '1rem', color: '#1e3a8a', flex: 1 }}>{ban.id ? `Sửa câu ${ban.ma}` : 'Thêm câu hỏi'}</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 8, marginBottom: 8 }}>
          <label style={{ fontSize: '0.72rem', color: '#64748b' }}>Chương<input type="number" min={0} value={v.chuong ?? 1} onChange={set('chuong')} style={{ ...inp, width: '100%' }} /></label>
          <label style={{ fontSize: '0.72rem', color: '#64748b' }}>Mục (VD 2.2.1)<input value={v.muc ?? ''} onChange={set('muc')} style={{ ...inp, width: '100%' }} /></label>
          <label style={{ fontSize: '0.72rem', color: '#64748b' }}>Cấp độ<select value={v.cap_do} onChange={set('cap_do')} style={{ ...inp, width: '100%' }}>{CAP_DO.map(x => <option key={x}>{x}</option>)}</select></label>
          <label style={{ fontSize: '0.72rem', color: '#64748b' }}>Độ khó<select value={v.do_kho ?? ''} onChange={set('do_kho')} style={{ ...inp, width: '100%' }}>{['Dễ', 'Trung bình', 'Khó'].map(x => <option key={x}>{x}</option>)}</select></label>
        </div>
        <div style={{ fontSize: '0.72rem', color: '#64748b', margin: '4px 0' }}>Câu dẫn</div>{ta('cau_dan', 3)}
        {(['a', 'b', 'c', 'd'] as const).map(k => (
          <div key={k} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 6 }}>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: k === 'a' ? '#15803d' : '#64748b' }}>Phương án {k.toUpperCase()}{k === 'a' ? ' — ĐÁP ÁN ĐÚNG' : ''}</div>
              {ta(k, 2)}
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{k === 'a' ? 'Vì sao đúng (giải thích)' : `Vì sao ${k.toUpperCase()} sai`}</div>
              {ta(k === 'a' ? 'gt_a' : (`sai_${k}` as keyof ICauHoi), 2)}
            </div>
          </div>
        ))}
        <div style={{ fontSize: '0.72rem', color: '#64748b', margin: '8px 0 4px' }}>Mục nguồn (tên mục giáo trình, hiện cho SV "Đọc lại")</div>
        <input value={v.muc_nguon ?? ''} onChange={set('muc_nguon')} style={{ ...inp, width: '100%' }} />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
          <button onClick={onClose} style={btn('white', '#475569', '#cbd5e1')}>Huỷ</button>
          <button disabled={luu} onClick={async () => { setLuu(true); await onSave(v); setLuu(false); }} style={btn('#2563eb', 'white')}>
            {luu ? <Loader2 size={13} /> : null} Lưu
          </button>
        </div>
      </div>
    </div>
  );
};

const TeacherNganHang: FC = () => {
  const { maMon = '' } = useParams<{ maMon: string }>();
  const navigate = useNavigate();
  const [loc, setLoc] = useState<INganHangLoc>({ chuong: '', cap_do: '', trang_thai: '', q: '', page: 1, per_page: 20 });
  const [qNhap, setQNhap] = useState('');
  const [data, setData] = useState<INganHang | null>(null);
  const [loading, setLoading] = useState(true);
  const [mo, setMo] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState<Partial<ICauHoi> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await NganHangApi.list(maMon, loc)); }
    catch (e) { toast.error(errMsg(e, 'Không tải được ngân hàng câu hỏi.')); }
    finally { setLoading(false); }
  }, [maMon, loc]);
  useEffect(() => { void load(); }, [load]);

  const doiLoc = (p: Partial<INganHangLoc>) => setLoc(l => ({ ...l, ...p, page: p.page ?? 1 }));
  const luu = async (v: Partial<ICauHoi>) => {
    try {
      toast.success(v.id ? await NganHangApi.sua(v.id, { chuong: v.chuong, muc: v.muc, muc_nguon: v.muc_nguon, cap_do: v.cap_do, do_kho: v.do_kho,
        cau_dan: v.cau_dan, a: v.a, b: v.b, c: v.c, d: v.d, gt_a: v.gt_a, sai_b: v.sai_b, sai_c: v.sai_c, sai_d: v.sai_d })
        : await NganHangApi.them({ ...v, ma_mon: maMon }));
      setForm(null); await load();
    } catch (e) { toast.error(errMsg(e, 'Lưu thất bại.')); }
  };
  const anHien = async (c: ICauHoi) => {
    try { toast.success(await NganHangApi.sua(c.id, { trang_thai: c.trang_thai === 'tam_an' ? 'dang_dung' : 'tam_an' })); await load(); }
    catch (e) { toast.error(errMsg(e, 'Không đổi được trạng thái.')); }
  };
  const xoa = async (c: ICauHoi) => {
    if (!confirm(`Xoá câu ${c.ma}?`)) return;
    try { toast.success(await NganHangApi.xoa(c.id)); await load(); } catch (e) { toast.error(errMsg(e, 'Không xoá được.')); }
  };
  const xuat = async () => {
    try {
      const { blob, filename } = await NganHangApi.xuat(maMon);
      const u = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = u; a.download = filename; a.click(); URL.revokeObjectURL(u);
    } catch { toast.error('Xuất Excel thất bại.'); }
  };

  const tk = data?.thong_ke;
  const soTrang = data ? Math.max(1, Math.ceil(data.tong_loc / data.per_page)) : 1;

  return (
    <div style={{ minHeight: '100%', background: '#f4f6fb', padding: '1rem 1.25rem 2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <button onClick={() => navigate(-1)} style={{ width: 34, height: 34, borderRadius: 10, border: '1.5px solid rgba(37,99,235,0.18)', background: 'rgba(37,99,235,0.06)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><ArrowLeft size={15} /></button>
        <div style={{ flex: 1, minWidth: 220 }}>
          <h1 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}><Database size={18} color="#2563eb" /> Ngân hàng câu hỏi — {maMon}</h1>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Đáp án đúng lưu ở phương án A; đề luyện tập tự trộn khi ra đề. Câu tạm ẩn không được rút vào đề. Dùng chung cho mọi GV dạy môn.</div>
        </div>
        <button onClick={() => setForm({ ...TRONG })} style={btn('#2563eb', 'white')}><Plus size={14} /> Thêm câu</button>
        <button onClick={xuat} style={btn('#059669', 'white')}><Download size={14} /> Xuất Excel</button>
      </div>

      {tk && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 12, marginBottom: 12 }}>
          <div style={card}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e3a8a' }}>{tk.tong} <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>câu</span></div>
            <div style={{ fontSize: '0.74rem', color: '#475569', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <span>{tk.dang_dung} đang dùng</span><span>{tk.tam_an} tạm ẩn</span><span>{tk.sua_tren_atlas} sửa/thêm trên Atlas</span><span>{tk.da_dung} câu đã có SV làm</span>
            </div>
          </div>
          <div style={card}>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#1e3a8a', marginBottom: 6 }}>Theo chương (bấm để lọc)</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {Object.entries(tk.theo_chuong).map(([ch, n]) => (
                <button key={ch} onClick={() => doiLoc({ chuong: loc.chuong === Number(ch) ? '' : Number(ch) })}
                  style={{ ...btn(loc.chuong === Number(ch) ? '#2563eb' : '#f1f5f9', loc.chuong === Number(ch) ? 'white' : '#334155'), padding: '3px 9px' }}>C{ch} · {n}</button>
              ))}
            </div>
          </div>
          <div style={card}>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#1e3a8a', marginBottom: 6 }}>Theo cấp độ</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {CAP_DO.map(cd => (
                <button key={cd} onClick={() => doiLoc({ cap_do: loc.cap_do === cd ? '' : cd })}
                  style={{ ...btn(loc.cap_do === cd ? MAU_CAP_DO[cd][1] : MAU_CAP_DO[cd][0], loc.cap_do === cd ? 'white' : MAU_CAP_DO[cd][1]), padding: '3px 9px' }}>{cd} · {tk.theo_cap_do[cd] ?? 0}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ ...card, padding: '10px 12px', marginBottom: 10, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #e2e8f0', borderRadius: 8, padding: '4px 8px', flex: 1, minWidth: 220 }}>
          <Search size={14} color="#94a3b8" />
          <input value={qNhap} onChange={e => setQNhap(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') doiLoc({ q: qNhap }); }}
            placeholder="Tìm trong câu dẫn / phương án / mã câu / mục — Enter" style={{ border: 'none', outline: 'none', fontSize: '0.8rem', flex: 1 }} />
        </div>
        <select value={loc.trang_thai} onChange={e => doiLoc({ trang_thai: e.target.value })} style={inp}>
          <option value="">Mọi trạng thái</option><option value="dang_dung">Đang dùng</option><option value="tam_an">Tạm ẩn</option>
        </select>
        {(loc.chuong !== '' || loc.cap_do || loc.trang_thai || loc.q) && (
          <button onClick={() => { setQNhap(''); setLoc({ chuong: '', cap_do: '', trang_thai: '', q: '', page: 1, per_page: 20 }); }} style={btn('white', '#475569', '#cbd5e1')}>Bỏ lọc</button>
        )}
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{data?.tong_loc ?? 0} câu khớp</span>
        {loading && <Loader2 size={15} color="#2563eb" />}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data?.items.map(c => {
          const [bg, fg] = MAU_CAP_DO[c.cap_do] ?? ['#f1f5f9', '#334155'];
          const an = c.trang_thai === 'tam_an';
          return (
            <div key={c.id} style={{ ...card, padding: '0.8rem 1rem', opacity: an ? 0.6 : 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: '0.72rem', marginBottom: 6 }}>
                <b style={{ fontFamily: 'monospace', color: '#0f172a' }}>{c.ma}</b>
                <span style={{ background: bg, color: fg, borderRadius: 6, padding: '1px 8px', fontWeight: 700 }}>{c.cap_do}</span>
                {c.do_kho && <span style={{ color: '#64748b' }}>{c.do_kho}</span>}
                <span style={{ color: '#64748b' }}>C{c.chuong}{c.muc ? ` · mục ${c.muc}` : ''}</span>
                {c.dang_cau && <span style={{ color: '#94a3b8' }}>{c.dang_cau}</span>}
                {an && <span style={{ background: '#f1f5f9', color: '#475569', borderRadius: 6, padding: '1px 8px', fontWeight: 700 }}>Tạm ẩn</span>}
                {c.sua_tren_atlas && <span style={{ background: '#fff7ed', color: '#c2410c', borderRadius: 6, padding: '1px 8px', fontWeight: 700 }} title={c.cap_nhat_luc ?? ''}>Sửa bởi {c.cap_nhat_boi}</span>}
                <span style={{ marginLeft: 'auto' }}><ChiSo c={c} /></span>
              </div>
              <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#1e293b', marginBottom: 6 }}>{c.cau_dan}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 5 }}>
                {(['a', 'b', 'c', 'd'] as const).map(k => (
                  <div key={k} style={{ fontSize: '0.78rem', padding: '5px 8px', borderRadius: 8, border: `1px solid ${k === 'a' ? 'rgba(21,128,61,0.35)' : '#eef2f6'}`, background: k === 'a' ? '#f0fdf4' : 'white', color: k === 'a' ? '#14532d' : '#334155' }}>
                    <b>{k.toUpperCase()}.</b> {c[k]} {k === 'a' && <b style={{ color: '#15803d' }}>✓</b>}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                <button onClick={() => setMo({ ...mo, [c.id]: !mo[c.id] })} style={btn('white', '#2563eb', '#dbeafe')}>
                  {mo[c.id] ? <ChevronUp size={13} /> : <ChevronDown size={13} />} Giải thích
                </button>
                <button onClick={() => setForm({ ...c })} style={btn('white', '#475569', '#e2e8f0')}><Pencil size={13} /> Sửa</button>
                <button onClick={() => anHien(c)} style={btn('white', an ? '#15803d' : '#b45309', '#e2e8f0')}>{an ? <Eye size={13} /> : <EyeOff size={13} />}{an ? 'Dùng lại' : 'Tạm ẩn'}</button>
                {/^\d+\.9\./.test(c.ma) && <button onClick={() => xoa(c)} style={btn('rgba(220,38,38,0.06)', '#dc2626', 'rgba(220,38,38,0.2)')}><Trash2 size={13} /> Xoá</button>}
                {c.muc_nguon && <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Nguồn: {c.muc_nguon}</span>}
              </div>
              {mo[c.id] && (
                <div style={{ marginTop: 8, fontSize: '0.76rem', color: '#334155', background: '#f8fafc', borderRadius: 8, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {c.gt_a && <div><b style={{ color: '#15803d' }}>A đúng:</b> {c.gt_a}</div>}
                  {c.sai_b && <div><b style={{ color: '#b91c1c' }}>B sai:</b> {c.sai_b}</div>}
                  {c.sai_c && <div><b style={{ color: '#b91c1c' }}>C sai:</b> {c.sai_c}</div>}
                  {c.sai_d && <div><b style={{ color: '#b91c1c' }}>D sai:</b> {c.sai_d}</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {data && soTrang > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 14, fontSize: '0.8rem' }}>
          <button disabled={data.page <= 1} onClick={() => doiLoc({ page: data.page - 1 })} style={btn('white', '#2563eb', '#dbeafe')}>‹ Trước</button>
          <span>Trang {data.page}/{soTrang}</span>
          <button disabled={data.page >= soTrang} onClick={() => doiLoc({ page: data.page + 1 })} style={btn('white', '#2563eb', '#dbeafe')}>Sau ›</button>
        </div>
      )}

      {form && <FormCau ban={form} onClose={() => setForm(null)} onSave={luu} />}
    </div>
  );
};

export default TeacherNganHang;
