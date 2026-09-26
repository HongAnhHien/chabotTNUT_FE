import { type FC, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Presentation, Sparkles, Loader2, Trash2, CheckCircle2, FilePen, AlertTriangle, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import BaiGiangApi from '@/infra/baigiang/baigiang_api';
import type { IBaiGiangChuong, IBaiGiangSummary } from '@/infra/api/interfaces/IBaiGiang';

/**
 * Soạn bài giảng AI cho 1 môn (dự án 26 nối vào Atlas).
 * GV chọn chương/mục học liệu đã nạp → AI soạn bản nháp (slide + lời giảng + trắc nghiệm, có trích mục nguồn)
 * → mở trình duyệt/sửa để DUYỆT.
 */
const GEN_STEPS = ['Đọc học liệu chương đã chọn…', 'Soạn chuẩn đầu ra và dàn ý…', 'Viết slide và lời giảng…', 'Soạn câu hỏi trắc nghiệm…', 'Kiểm tra trích dẫn mục giáo trình…'];

const TeacherBaiGiang: FC = () => {
  const { maMon = '' } = useParams<{ maMon: string }>();
  const navigate = useNavigate();
  const [items, setItems] = useState<IBaiGiangSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [chapters, setChapters] = useState<IBaiGiangChuong[] | null>(null);
  const [chErr, setChErr] = useState('');
  const [form, setForm] = useState({ chuong: '', muc: [] as string[], so_slide: 10, so_cau_hoi: 8, song_ngu: true, xung_ho: 'cô' });
  const [generating, setGenerating] = useState(false);
  const [step, setStep] = useState(0);

  const load = () => {
    setLoading(true);
    BaiGiangApi.list(maMon).then(r => setItems(r.data ?? [])).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
    BaiGiangApi.chapters(maMon)
      .then(r => { setChapters(r.data ?? []); if (r.data?.[0]) setForm(f => ({ ...f, chuong: r.data[0].chapter })); })
      .catch(e => { setChapters([]); setChErr(e?.response?.data?.message ?? 'Không đọc được danh sách chương của môn.'); });
  }, [maMon]);

  useEffect(() => {
    if (!generating) return;
    setStep(0);
    const t = setInterval(() => setStep(s => Math.min(s + 1, GEN_STEPS.length - 1)), 11000);
    return () => clearInterval(t);
  }, [generating]);

  const chapter = useMemo(() => chapters?.find(c => c.chapter === form.chuong), [chapters, form.chuong]);
  // Mục cấp 2 (x.y) để chọn cho gọn; chọn mục cha là lấy cả mục con
  const topSections = useMemo(() => (chapter?.sections ?? []).filter(s => s.section.split('.').length === 2), [chapter]);

  const toggleMuc = (s: string) => setForm(f => ({ ...f, muc: f.muc.includes(s) ? f.muc.filter(x => x !== s) : [...f.muc, s] }));

  const generate = async () => {
    if (!form.chuong) return;
    setGenerating(true);
    try {
      const r = await BaiGiangApi.generate({ ma_mon: maMon, ...form });
      toast.success(r.message ?? 'AI đã soạn xong bản nháp.');
      navigate(`/teacher/bai-giang/${r.data.id}`);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'AI chưa soạn được bài. Vui lòng thử lại.');
    } finally { setGenerating(false); }
  };

  const del = async (b: IBaiGiangSummary) => {
    if (!confirm(`Xoá bài giảng "${b.tieu_de}"?`)) return;
    try { await BaiGiangApi.remove(b.id); toast.success('Đã xoá.'); load(); } catch { toast.error('Xoá thất bại.'); }
  };

  return (
    <div style={{ minHeight: '100%', background: '#eef4ff', fontFamily: "'Be Vietnam Pro',system-ui,sans-serif", padding: '1.5rem' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate(-1)} style={{ ...btnGhost, padding: '6px 10px' }} aria-label="Quay lại"><ArrowLeft size={15} /></button>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Presentation size={20} color="#2563eb" /> Bài giảng AI
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
              Môn <b>{maMon}</b> · AI soạn slide, lời giảng và trắc nghiệm <b>chỉ từ giáo trình đã nạp</b>, ghi rõ mục nguồn · thầy/cô duyệt rồi sinh viên mới thấy.
            </p>
          </div>
        </div>

        {/* ── Soạn bài mới ── */}
        <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: '1rem', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: 7 }}><Sparkles size={16} color="#f97316" /> Soạn bài mới</h2>
          {chapters === null ? <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Đang đọc học liệu của môn…</div>
            : chapters.length === 0 ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 12px', fontSize: '0.84rem' }}>
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{chErr || 'Môn chưa có giáo trình nạp vào AI.'} <button onClick={() => navigate(`/teacher/subjects/${maMon}/files`)} style={linkBtn}>Mở trang Tài liệu</button></span>
              </div>
            ) : (
              <>
                <label style={lbl}>Chương giáo trình
                  <select value={form.chuong} onChange={e => setForm(f => ({ ...f, chuong: e.target.value, muc: [] }))} style={{ ...sel, maxWidth: '100%' }} disabled={generating}>
                    {chapters.map(c => <option key={c.chapter} value={c.chapter}>Chương {c.chapter}. {c.title} ({c.so_doan} đoạn)</option>)}
                  </select>
                </label>
                {topSections.length > 0 && (
                  <div style={lbl}>Mục (bỏ trống = cả chương; chương dài nên chọn 2–3 mục cho mỗi bài)
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
                      {topSections.map(s => {
                        const on = form.muc.includes(s.section);
                        return (
                          <button key={s.section} type="button" disabled={generating} onClick={() => toggleMuc(s.section)}
                            style={{ ...chip, background: on ? '#2563eb' : 'white', color: on ? 'white' : '#334155', borderColor: on ? '#2563eb' : '#e2e8f0' }}>
                            {s.section} {s.title.length > 42 ? s.title.slice(0, 42) + '…' : s.title}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <label style={lbl}>Số slide
                    <input type="number" min={6} max={16} value={form.so_slide} disabled={generating}
                      onChange={e => setForm(f => ({ ...f, so_slide: Math.max(6, Math.min(16, Number(e.target.value) || 10)) }))} style={{ ...sel, width: 80 }} />
                  </label>
                  <label style={lbl}>Số câu trắc nghiệm
                    <input type="number" min={3} max={15} value={form.so_cau_hoi} disabled={generating}
                      onChange={e => setForm(f => ({ ...f, so_cau_hoi: Math.max(3, Math.min(15, Number(e.target.value) || 8)) }))} style={{ ...sel, width: 80 }} />
                  </label>
                  <label style={lbl}>Xưng hô trong lời giảng
                    <select value={form.xung_ho} disabled={generating} onChange={e => setForm(f => ({ ...f, xung_ho: e.target.value }))} style={sel}>
                      <option value="cô">Cô</option><option value="thầy">Thầy</option>
                    </select>
                  </label>
                  <label style={{ ...lbl, flexDirection: 'row', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#334155', paddingBottom: 6 }}>
                    <input type="checkbox" checked={form.song_ngu} disabled={generating} onChange={e => setForm(f => ({ ...f, song_ngu: e.target.checked }))} />
                    Song ngữ Việt – Anh
                  </label>
                  <div style={{ flex: 1 }} />
                  <button onClick={generate} disabled={generating || !form.chuong} style={{ ...btnPrimary, background: '#f97316', opacity: generating ? 0.8 : 1 }}>
                    {generating ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Đang soạn…</> : <><Sparkles size={14} /> AI soạn bài</>}
                  </button>
                </div>
                {generating && (
                  <div role="status" style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '10px 12px', fontSize: '0.84rem', color: '#9a3412' }}>
                    {GEN_STEPS[step]} <span style={{ color: '#c2410c' }}>(thường mất 40–90 giây, thầy/cô giữ nguyên trang này)</span>
                  </div>
                )}
              </>
            )}
        </div>

        {/* ── Danh sách bài ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2 style={{ margin: '4px 0 0', fontSize: '0.95rem', color: '#1e3a8a' }}>Bài giảng của môn ({items.length})</h2>
          {loading ? <div style={{ color: '#64748b' }}>Đang tải…</div>
            : items.length === 0 ? <div style={{ ...card, textAlign: 'center', color: '#64748b' }}>Chưa có bài giảng nào. Chọn chương ở trên rồi bấm “AI soạn bài”.</div>
            : items.map(b => (
              <div key={b.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 12, padding: '0.9rem 1.1rem', cursor: 'pointer' }}
                onClick={() => navigate(`/teacher/bai-giang/${b.id}`)}>
                <BookOpen size={20} color="#2563eb" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: '#1e293b' }}>Chương {b.chuong} · {b.tieu_de}</div>
                  <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: 3, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {b.trang_thai === 'da_duyet'
                      ? <span style={{ ...tag, background: 'rgba(5,150,105,0.1)', color: '#059669' }}><CheckCircle2 size={11} style={{ verticalAlign: -1 }} /> Đã duyệt</span>
                      : <span style={{ ...tag, background: 'rgba(217,119,6,0.1)', color: '#b45309' }}><FilePen size={11} style={{ verticalAlign: -1 }} /> Bản nháp</span>}
                    <span>{b.so_slide} slide · {b.so_cau_hoi} câu hỏi{b.song_ngu ? ' · Việt–Anh' : ''}</span>
                    {b.muc.length > 0 && <span>Mục {b.muc.join(', ')}</span>}
                    {b.so_canh_bao > 0 && <span style={{ color: '#b45309' }}>{b.so_canh_bao} cảnh báo cần xem</span>}
                    {b.cua_toi === false && b.nguoi_tao && <span style={{ ...tag, background: '#fff7ed', color: '#c2410c' }}>Soạn bởi {b.nguoi_tao}</span>}
                  </div>
                </div>
                {b.cua_toi !== false && (
                  <button onClick={e => { e.stopPropagation(); del(b); }} style={btnDanger} aria-label="Xoá bài giảng"><Trash2 size={14} /></button>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

const card: React.CSSProperties = { background: 'white', border: '1px solid rgba(37,99,235,0.1)', borderRadius: 14, boxShadow: '0 6px 24px rgba(37,99,235,0.05)', padding: '1.1rem' };
const sel: React.CSSProperties = { border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '7px 9px', fontSize: '0.84rem', outline: 'none', background: 'white' };
const lbl: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.74rem', color: '#64748b', fontWeight: 600 };
const chip: React.CSSProperties = { border: '1.5px solid', borderRadius: 999, padding: '4px 11px', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 };
const tag: React.CSSProperties = { borderRadius: 999, padding: '1px 9px', fontWeight: 700 };
const linkBtn: React.CSSProperties = { background: 'none', border: 'none', color: '#2563eb', fontWeight: 700, cursor: 'pointer', padding: 0, textDecoration: 'underline' };
const btnPrimary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, padding: '8px 15px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' };
const btnGhost: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, background: 'white', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 13px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' };
const btnDanger: React.CSSProperties = { display: 'inline-flex', background: 'rgba(220,38,38,0.07)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, padding: '7px 10px', cursor: 'pointer' };

export default TeacherBaiGiang;
