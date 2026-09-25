import { type FC, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Save, CheckCircle2, Undo2, Download, Loader2, AlertTriangle, Plus, Trash2, Presentation, ListChecks, BookA } from 'lucide-react';
import toast from 'react-hot-toast';
import BaiGiangApi from '@/infra/baigiang/baigiang_api';
import SlidePreview from '@/components/baigiang/SlidePreview';
import type { BaiGiangFormat, BaiGiangNoiDung, BaiGiangSlide, Bi, IBaiGiang } from '@/infra/api/interfaces/IBaiGiang';

/** Duyệt & sửa bài giảng AI trước khi sinh viên thấy ("AI soạn — giảng viên duyệt", dự án 26). */
const LAYOUT_LABEL: Record<string, string> = {
  title: 'Trang bìa', bullets: 'Chuẩn đầu ra', question: 'Đặt vấn đề', definition: 'Định nghĩa', cards3: '3 ý song song',
  versus: 'So sánh', example: 'Ví dụ', summary: 'Tóm tắt', closing: 'Bài tập về nhà',
};

type Tab = 'slide' | 'quiz' | 'clo';

const TeacherBaiGiangEditor: FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [bai, setBai] = useState<IBaiGiang | null>(null);
  const [nd, setNd] = useState<BaiGiangNoiDung | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState('');
  const [cur, setCur] = useState(0);
  const [lang, setLang] = useState<'vi' | 'en'>('vi');
  const [tab, setTab] = useState<Tab>('slide');
  const [dlOpen, setDlOpen] = useState(false);

  useEffect(() => {
    BaiGiangApi.get(id).then(r => { setBai(r.data); setNd(r.data.noi_dung); })
      .catch(() => { toast.error('Không mở được bài giảng.'); navigate(-1); });
  }, [id]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  if (!bai || !nd) return <div style={{ padding: '2rem', color: '#64748b', fontFamily: "'Be Vietnam Pro',system-ui" }}>Đang mở bài giảng…</div>;

  const songNgu = nd.meta?.song_ngu !== false;
  const edit = (fn: (d: BaiGiangNoiDung) => void) => {
    setNd(prev => { const next = structuredClone(prev!) as BaiGiangNoiDung; fn(next); return next; });
    setDirty(true);
  };
  const editSlide = (fn: (s: BaiGiangSlide) => void) => edit(d => fn(d.slides[cur]));
  const slide = nd.slides[cur];

  const save = async () => {
    setBusy('save');
    try {
      const r = await BaiGiangApi.save(bai.id, nd);
      setBai(r.data); setNd(r.data.noi_dung); setDirty(false); toast.success(r.message ?? 'Đã lưu.');
    } catch { toast.error('Lưu thất bại.'); } finally { setBusy(''); }
  };
  const approve = async () => {
    if (dirty) { toast.error('Thầy/cô lưu thay đổi trước khi duyệt.'); return; }
    if ((bai.canh_bao?.length ?? 0) > 0 && !confirm('Bài còn cảnh báo chưa xử lý. Thầy/cô đã kiểm tra nội dung và vẫn duyệt?')) return;
    setBusy('approve');
    try { const r = await BaiGiangApi.approve(bai.id); setBai(r.data); toast.success(r.message ?? 'Đã duyệt.'); }
    catch { toast.error('Duyệt thất bại.'); } finally { setBusy(''); }
  };
  const unapprove = async () => {
    setBusy('approve');
    try { const r = await BaiGiangApi.unapprove(bai.id); setBai(r.data); toast.success(r.message ?? 'Đã thu hồi.'); }
    catch { toast.error('Thu hồi thất bại.'); } finally { setBusy(''); }
  };
  const download = async (fmt: BaiGiangFormat, l: 'vi' | 'en') => {
    setDlOpen(false);
    if (dirty) toast('File tải về theo bản ĐÃ LƯU — thay đổi chưa lưu chưa có trong file.', { icon: 'ℹ️' });
    setBusy('dl');
    try { await BaiGiangApi.download(bai.id, fmt, l); } catch { toast.error('Chưa xuất được file (service AI có thể đang tắt).'); }
    finally { setBusy(''); }
  };

  const approved = bai.trang_thai === 'da_duyet';

  return (
    <div style={{ minHeight: '100%', background: '#eef4ff', fontFamily: "'Be Vietnam Pro',system-ui,sans-serif", padding: '1.25rem' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* ── Thanh tiêu đề ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => navigate(`/teacher/subjects/${bai.ma_mon}/bai-giang`)} style={{ ...btnGhost, padding: '6px 10px' }} aria-label="Quay lại danh sách"><ArrowLeft size={15} /></button>
          <div style={{ minWidth: 0, flex: '1 1 320px' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{nd.meta.ma_hp} · {nd.meta.ten_mon} · Chương {nd.meta.chapter}{nd.meta.sections?.length ? ` · mục ${nd.meta.sections.join(', ')}` : ''}</div>
            <h1 style={{ margin: '2px 0 0', fontSize: '1.2rem', fontWeight: 800, color: '#1e3a8a' }}>{nd.ten_bai.vi || 'Bài giảng'}</h1>
          </div>
          {approved
            ? <span style={{ ...pill, background: 'rgba(5,150,105,0.1)', color: '#059669' }}><CheckCircle2 size={13} /> Đã duyệt — SV đang xem được</span>
            : <span style={{ ...pill, background: 'rgba(217,119,6,0.1)', color: '#b45309' }}>Bản nháp — SV chưa thấy</span>}
          <button onClick={save} disabled={!dirty || !!busy} style={{ ...btnPrimary, opacity: dirty ? 1 : 0.5 }}>
            {busy === 'save' ? <Loader2 size={14} style={spin} /> : <Save size={14} />} {dirty ? 'Lưu thay đổi' : 'Đã lưu'}
          </button>
          {approved
            ? <button onClick={unapprove} disabled={!!busy} style={btnGhost}><Undo2 size={14} /> Thu hồi</button>
            : <button onClick={approve} disabled={!!busy} style={{ ...btnPrimary, background: '#059669' }}>{busy === 'approve' ? <Loader2 size={14} style={spin} /> : <CheckCircle2 size={14} />} Duyệt</button>}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setDlOpen(o => !o)} disabled={!!busy} style={btnGhost} aria-expanded={dlOpen}>
              {busy === 'dl' ? <Loader2 size={14} style={spin} /> : <Download size={14} />} Tải về
            </button>
            {dlOpen && (
              <div style={{ position: 'absolute', right: 0, top: '110%', zIndex: 20, background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, boxShadow: '0 10px 30px rgba(15,23,42,0.12)', padding: 6, minWidth: 250 }}>
                {([['pptx', 'vi', 'Slide PowerPoint (tiếng Việt)'], ...(songNgu ? [['pptx', 'en', 'Slide PowerPoint (English)']] : []),
                  ['srt', 'vi', 'Phụ đề .srt (tiếng Việt)'], ...(songNgu ? [['srt', 'en', 'Phụ đề .srt (English)']] : []),
                  ['vtt', 'vi', 'Phụ đề .vtt cho web'], ['gift', 'vi', 'Trắc nghiệm GIFT (nhập Moodle)']] as [BaiGiangFormat, 'vi' | 'en', string][])
                  .map(([f, l, label]) => <button key={f + l} onClick={() => download(f, l)} style={menuItem}>{label}</button>)}
              </div>
            )}
          </div>
        </div>

        {(bai.canh_bao?.length ?? 0) > 0 && (
          <div style={{ display: 'flex', gap: 10, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '10px 14px', color: '#92400e', fontSize: '0.82rem' }}>
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <div><b>Cần thầy/cô kiểm tra (tự động dò lại mỗi lần lưu):</b>
              <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>{bai.canh_bao!.map((w, i) => <li key={i}>{w}</li>)}</ul>
            </div>
          </div>
        )}

        {/* ── Tab ── */}
        <div role="tablist" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {([['slide', <Presentation size={14} key="i" />, `Slide & lời giảng (${nd.slides.length})`],
            ['quiz', <ListChecks size={14} key="i" />, `Trắc nghiệm (${nd.quiz.length})`],
            ['clo', <BookA size={14} key="i" />, 'Chuẩn đầu ra & thuật ngữ']] as [Tab, React.ReactNode, string][])
            .map(([k, icon, label]) => (
              <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
                style={{ ...tabBtn, background: tab === k ? '#1e3a8a' : 'white', color: tab === k ? 'white' : '#334155' }}>{icon} {label}</button>
            ))}
          {songNgu && tab === 'slide' && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
              {(['vi', 'en'] as const).map(l => (
                <button key={l} onClick={() => setLang(l)} style={{ ...tabBtn, padding: '5px 11px', background: lang === l ? '#2563eb' : 'white', color: lang === l ? 'white' : '#334155' }}>
                  {l === 'vi' ? 'Xem tiếng Việt' : 'View English'}</button>
              ))}
            </div>
          )}
        </div>

        {tab === 'slide' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(170px, 210px) minmax(0, 1fr)', gap: 14, alignItems: 'start' }} className="bg-editor-grid">
            <nav aria-label="Danh sách slide" style={{ ...card, padding: 6, display: 'flex', flexDirection: 'column', gap: 3, maxHeight: '78vh', overflowY: 'auto' }}>
              {nd.slides.map((s, i) => (
                <button key={i} onClick={() => setCur(i)} style={{ ...railItem, background: i === cur ? 'rgba(37,99,235,0.1)' : 'transparent', borderColor: i === cur ? 'rgba(37,99,235,0.35)' : 'transparent' }}>
                  <span style={{ fontWeight: 800, color: '#2563eb', width: 20 }}>{i + 1}</span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700 }}>{LAYOUT_LABEL[s.layout] ?? s.layout}</span>
                    <span style={{ display: 'block', fontSize: '0.78rem', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {s.layout === 'title' ? nd.ten_bai.vi : s.title?.vi || '—'}</span>
                  </span>
                </button>
              ))}
            </nav>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
              <SlidePreview lec={nd} index={cur} lang={lang} />
              <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <b style={{ color: '#1e3a8a' }}>Slide {cur + 1} · {LAYOUT_LABEL[slide.layout]}</b>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Mục nguồn:</span>
                  {slide.nguon.length ? slide.nguon.map(n => <span key={n} style={srcChip}>Mục {n}</span>)
                    : <span style={{ fontSize: '0.75rem', color: slide.layout === 'title' || slide.layout === 'question' || slide.layout === 'closing' || slide.bullets === 'CLO' ? '#94a3b8' : '#b45309' }}>
                        {['title', 'question', 'closing'].includes(slide.layout) || slide.bullets === 'CLO' ? 'không cần (slide dẫn dắt)' : 'chưa có — cần kiểm tra'}</span>}
                </div>
                {slide.layout === 'title'
                  ? <BiField label="Tên bài" value={nd.ten_bai} songNgu={songNgu} onChange={v => edit(d => { d.ten_bai = v; })} />
                  : <SlideFields s={slide} songNgu={songNgu} onChange={editSlide} />}
                <NarrationEditor s={slide} songNgu={songNgu} onChange={editSlide} />
              </div>
            </div>
          </div>
        )}

        {tab === 'quiz' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Chọn nút tròn để đặt đáp án đúng. Thứ tự phương án đã được xáo sẵn; khi nhập Moodle vẫn nên bật “Shuffle answers”.</p>
            {nd.quiz.map((q, qi) => (
              <div key={qi} style={{ ...card, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <b style={{ color: '#1e3a8a' }}>Câu {qi + 1}</b>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>CLO{q.clo}</span>
                  {q.nguon.map(n => <span key={n} style={srcChip}>Mục {n}</span>)}
                  <div style={{ flex: 1 }} />
                  <button onClick={() => edit(d => { d.quiz.splice(qi, 1); })} style={btnDanger} aria-label={`Xoá câu ${qi + 1}`}><Trash2 size={13} /></button>
                </div>
                <BiField label="Câu hỏi" value={q.q} songNgu={songNgu} onChange={v => edit(d => { d.quiz[qi].q = v; })} />
                {q.opts.map((o, oi) => (
                  <div key={oi} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <input type="radio" name={`ans-${qi}`} checked={q.ans === oi} onChange={() => edit(d => { d.quiz[qi].ans = oi; })}
                      aria-label={`Đáp án đúng là ${'ABCD'[oi]}`} style={{ marginTop: 10 }} />
                    <div style={{ flex: 1 }}><BiField label={`Phương án ${'ABCD'[oi]}${q.ans === oi ? ' (đúng)' : ''}`} value={o} songNgu={songNgu} compact
                      onChange={v => edit(d => { d.quiz[qi].opts[oi] = v; })} /></div>
                  </div>
                ))}
                <BiField label="Giải thích" value={q.why} songNgu={songNgu} compact onChange={v => edit(d => { d.quiz[qi].why = v; })} />
              </div>
            ))}
          </div>
        )}

        {tab === 'clo' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 14, alignItems: 'start' }}>
            <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <b style={{ color: '#1e3a8a' }}>Chuẩn đầu ra bài học (CLO)</b>
              {nd.clo.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}><BiField label={`CLO${i + 1}`} value={c} songNgu={songNgu} compact onChange={v => edit(d => { d.clo[i] = v; })} /></div>
                  <button onClick={() => edit(d => { d.clo.splice(i, 1); })} style={{ ...btnDanger, marginTop: 18 }} aria-label={`Xoá CLO${i + 1}`}><Trash2 size={13} /></button>
                </div>
              ))}
              <button onClick={() => edit(d => { d.clo.push({ vi: '', en: '' }); })} style={btnGhost}><Plus size={13} /> Thêm CLO</button>
            </div>
            <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <b style={{ color: '#1e3a8a' }}>Thuật ngữ Việt – Anh ({nd.glossary.length})</b>
              {nd.glossary.map(([vi, en], i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 6 }}>
                  <input aria-label={`Thuật ngữ ${i + 1} tiếng Việt`} value={vi} onChange={e => edit(d => { d.glossary[i][0] = e.target.value; })} style={inp} />
                  <input aria-label={`Thuật ngữ ${i + 1} tiếng Anh`} value={en} onChange={e => edit(d => { d.glossary[i][1] = e.target.value; })} style={inp} />
                  <button onClick={() => edit(d => { d.glossary.splice(i, 1); })} style={btnDanger} aria-label={`Xoá thuật ngữ ${i + 1}`}><Trash2 size={13} /></button>
                </div>
              ))}
              <button onClick={() => edit(d => { d.glossary.push(['', '']); })} style={btnGhost}><Plus size={13} /> Thêm thuật ngữ</button>
            </div>
          </div>
        )}
      </div>
      <style>{`@media (max-width: 760px){ .bg-editor-grid{ grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
};

// ── Ô nhập song ngữ ─────────────────────────────────────────────────────────
const BiField: FC<{ label: string; value?: Bi; songNgu: boolean; onChange: (v: Bi) => void; compact?: boolean }> = ({ label, value, songNgu, onChange, compact }) => {
  const v = value ?? { vi: '', en: '' };
  const rows = compact ? 1 : 2;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={fieldLbl}>{label}</span>
      <div style={{ display: 'grid', gridTemplateColumns: songNgu ? 'repeat(auto-fit, minmax(220px, 1fr))' : '1fr', gap: 6 }}>
        <textarea aria-label={`${label} (tiếng Việt)`} rows={rows} value={v.vi} onChange={e => onChange({ ...v, vi: e.target.value })} style={ta} />
        {songNgu && <textarea aria-label={`${label} (English)`} rows={rows} value={v.en} placeholder="English" onChange={e => onChange({ ...v, en: e.target.value })} style={{ ...ta, fontStyle: 'italic', color: '#475569' }} />}
      </div>
    </div>
  );
};

// ── Trường theo từng bố cục ───────────────────────────────────────────────────
const SlideFields: FC<{ s: BaiGiangSlide; songNgu: boolean; onChange: (fn: (s: BaiGiangSlide) => void) => void }> = ({ s, songNgu, onChange }) => {
  const F = (label: string, key: 'kicker' | 'title' | 'sub' | 'body' | 'note' | 'next') =>
    <BiField key={key} label={label} value={s[key]} songNgu={songNgu} compact={key === 'kicker'} onChange={v => onChange(x => { x[key] = v; })} />;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {F('Nhãn nhỏ phía trên', 'kicker')}
      {F('Tiêu đề slide', 'title')}
      {s.layout === 'question' && F('Gợi ý dưới câu hỏi', 'sub')}
      {s.layout === 'definition' && F('Nội dung định nghĩa (**…** để nhấn mạnh)', 'body')}
      {s.layout === 'bullets' && s.bullets === 'CLO' && <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Slide này hiện các chuẩn đầu ra — sửa ở tab “Chuẩn đầu ra & thuật ngữ”.</p>}
      {(s.layout === 'summary' || s.layout === 'closing' || (s.layout === 'bullets' && s.bullets !== 'CLO')) && Array.isArray(s.bullets) && (
        s.bullets.map((b, i) => <BiField key={i} label={`Ý ${i + 1}`} value={b} songNgu={songNgu} compact
          onChange={v => onChange(x => { (x.bullets as Bi[])[i] = v; })} />)
      )}
      {s.layout === 'closing' && F('Bài tiếp theo', 'next')}
      {s.layout === 'definition' && (s.terms ?? []).map(([vi, en], i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <input aria-label={`Thuật ngữ thẻ ${i + 1}`} value={vi} onChange={e => onChange(x => { x.terms![i][0] = e.target.value; })} style={inp} />
          <input aria-label={`Term card ${i + 1}`} value={en} onChange={e => onChange(x => { x.terms![i][1] = e.target.value; })} style={inp} />
        </div>
      ))}
      {s.layout === 'cards3' && (s.cards ?? []).map((c, i) => (
        <div key={i} style={groupBox}>
          <BiField label={`Thẻ ${i + 1} — tiêu đề (≤ 20 ký tự)`} value={c.h} songNgu={songNgu} compact onChange={v => onChange(x => { x.cards![i].h = v; })} />
          <BiField label="Nội dung" value={c.b} songNgu={songNgu} onChange={v => onChange(x => { x.cards![i].b = v; })} />
          <BiField label="Ví dụ" value={c.eg} songNgu={songNgu} compact onChange={v => onChange(x => { x.cards![i].eg = v; })} />
        </div>
      ))}
      {s.layout === 'versus' && (['left', 'right'] as const).map(side => (
        <div key={side} style={groupBox}>
          <BiField label={side === 'left' ? 'Bên trái — tiêu đề' : 'Bên phải — tiêu đề'} value={s[side]?.h} songNgu={songNgu} compact onChange={v => onChange(x => { x[side]!.h = v; })} />
          <BiField label="Nội dung" value={s[side]?.b} songNgu={songNgu} onChange={v => onChange(x => { x[side]!.b = v; })} />
        </div>
      ))}
      {s.layout === 'versus' && F('Câu chốt', 'note')}
      {s.layout === 'example' && (s.rows ?? []).map(([k, v], i) => (
        <div key={i} style={groupBox}>
          <BiField label={`Dòng ${i + 1} — nhãn`} value={k} songNgu={songNgu} compact onChange={nv => onChange(x => { x.rows![i][0] = nv; })} />
          <BiField label="Nội dung" value={v} songNgu={songNgu} compact onChange={nv => onChange(x => { x.rows![i][1] = nv; })} />
        </div>
      ))}
    </div>
  );
};

// ── Lời giảng (từng câu = 1 dòng phụ đề) ─────────────────────────────────────
const NarrationEditor: FC<{ s: BaiGiangSlide; songNgu: boolean; onChange: (fn: (s: BaiGiangSlide) => void) => void }> = ({ s, songNgu, onChange }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px dashed #e2e8f0', paddingTop: 10 }}>
    <span style={fieldLbl}>Lời giảng — mỗi dòng là một câu nói và một dòng phụ đề</span>
    {s.narration.map(([vi, en], i) => (
      <div key={i} style={{ display: 'grid', gridTemplateColumns: songNgu ? '24px 1fr 1fr auto' : '24px 1fr auto', gap: 6, alignItems: 'start' }}>
        <span style={{ fontSize: '0.75rem', color: '#94a3b8', paddingTop: 8, textAlign: 'right' }}>{i + 1}</span>
        <textarea aria-label={`Câu giảng ${i + 1}`} rows={2} value={vi} onChange={e => onChange(x => { x.narration[i][0] = e.target.value; })} style={ta} />
        {songNgu && <textarea aria-label={`Narration ${i + 1}`} rows={2} value={en} onChange={e => onChange(x => { x.narration[i][1] = e.target.value; })} style={{ ...ta, fontStyle: 'italic', color: '#475569' }} />}
        <button onClick={() => onChange(x => { x.narration.splice(i, 1); })} disabled={s.narration.length <= 1} style={{ ...btnDanger, opacity: s.narration.length <= 1 ? 0.4 : 1 }} aria-label={`Xoá câu ${i + 1}`}><Trash2 size={13} /></button>
      </div>
    ))}
    <button onClick={() => onChange(x => { x.narration.push(['', '']); })} style={{ ...btnGhost, alignSelf: 'flex-start' }}><Plus size={13} /> Thêm câu</button>
  </div>
);

const spin: React.CSSProperties = { animation: 'spin 1s linear infinite' };
const card: React.CSSProperties = { background: 'white', border: '1px solid rgba(37,99,235,0.1)', borderRadius: 14, boxShadow: '0 6px 24px rgba(37,99,235,0.05)', padding: '1rem' };
const pill: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, borderRadius: 999, padding: '4px 11px', fontSize: '0.76rem', fontWeight: 700 };
const tabBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid #dbe3f0', borderRadius: 9, padding: '7px 13px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' };
const railItem: React.CSSProperties = { display: 'flex', gap: 6, alignItems: 'center', textAlign: 'left', border: '1px solid', borderRadius: 8, padding: '6px 7px', cursor: 'pointer', fontFamily: 'inherit' };
const srcChip: React.CSSProperties = { background: 'rgba(0,159,219,0.1)', color: '#0369a1', borderRadius: 999, padding: '1px 8px', fontSize: '0.72rem', fontWeight: 700 };
const groupBox: React.CSSProperties = { border: '1px solid #eef2f6', borderRadius: 10, padding: 10, display: 'flex', flexDirection: 'column', gap: 8, background: '#fafbfe' };
const fieldLbl: React.CSSProperties = { fontSize: '0.72rem', color: '#64748b', fontWeight: 700 };
const ta: React.CSSProperties = { border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '7px 9px', fontSize: '0.84rem', fontFamily: 'inherit', resize: 'vertical', outline: 'none', width: '100%', boxSizing: 'border-box' };
const inp: React.CSSProperties = { ...ta, resize: undefined };
const menuItem: React.CSSProperties = { display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', borderRadius: 7, padding: '8px 10px', fontSize: '0.83rem', color: '#1e293b', cursor: 'pointer', fontFamily: 'inherit' };
const btnPrimary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: '0.83rem', fontWeight: 700, cursor: 'pointer' };
const btnGhost: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, background: 'white', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 12px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' };
const btnDanger: React.CSSProperties = { display: 'inline-flex', background: 'rgba(220,38,38,0.07)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, padding: '7px 9px', cursor: 'pointer' };

export default TeacherBaiGiangEditor;
