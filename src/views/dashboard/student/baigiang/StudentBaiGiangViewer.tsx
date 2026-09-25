import { type FC, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, ChevronLeft, ChevronRight, Download, Loader2, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import BaiGiangApi from '@/infra/baigiang/baigiang_api';
import SlidePreview from '@/components/baigiang/SlidePreview';
import SpeakButton from '@/components/learning/SpeakButton';
import type { IBaiGiang } from '@/infra/api/interfaces/IBaiGiang';

/** Sinh viên học bài giảng đã duyệt: slide + lời giảng (đọc to được) + tự kiểm tra cuối bài. */
const StudentBaiGiangViewer: FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [bai, setBai] = useState<IBaiGiang | null>(null);
  const [cur, setCur] = useState(0);
  const [lang, setLang] = useState<'vi' | 'en'>('vi');
  const [view, setView] = useState<'slide' | 'quiz'>('slide');
  const [picked, setPicked] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState(false);
  const [dl, setDl] = useState(false);

  useEffect(() => {
    BaiGiangApi.studentGet(id).then(r => setBai(r.data)).catch(() => { toast.error('Bài giảng không còn khả dụng.'); navigate(-1); });
  }, [id]);

  useEffect(() => {
    if (view !== 'slide' || !bai) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.key === 'ArrowRight') setCur(c => Math.min(c + 1, bai.noi_dung.slides.length - 1));
      if (e.key === 'ArrowLeft') setCur(c => Math.max(c - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view, bai]);

  if (!bai) return <div style={{ padding: '2rem', color: '#64748b', fontFamily: "'Be Vietnam Pro',system-ui" }}>Đang mở bài giảng…</div>;

  const nd = bai.noi_dung;
  const songNgu = nd.meta?.song_ngu !== false;
  const slide = nd.slides[cur];
  const last = cur === nd.slides.length - 1;
  const score = nd.quiz.reduce((s, q, i) => s + (picked[i] === q.ans ? 1 : 0), 0);
  const L = (vi: string, en: string) => (lang === 'en' && en ? en : vi);

  const download = async () => {
    setDl(true);
    try { await BaiGiangApi.studentDownload(bai.id, lang); } catch { toast.error('Chưa tải được slide, em thử lại sau.'); } finally { setDl(false); }
  };

  return (
    <div style={{ minHeight: '100%', background: '#eef4ff', fontFamily: "'Be Vietnam Pro',system-ui,sans-serif", padding: '1.25rem' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => navigate(`/student/subjects/${bai.ma_mon}`)} style={{ ...btnGhost, padding: '6px 10px' }} aria-label="Về trang môn học"><ArrowLeft size={15} /></button>
          <div style={{ flex: '1 1 260px', minWidth: 0 }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{nd.meta.ma_hp} · {nd.meta.ten_mon} · Chương {nd.meta.chapter}</div>
            <h1 style={{ margin: '2px 0 0', fontSize: '1.2rem', fontWeight: 800, color: '#1e3a8a' }}>{L(nd.ten_bai.vi, nd.ten_bai.en)}</h1>
          </div>
          {songNgu && (['vi', 'en'] as const).map(l => (
            <button key={l} onClick={() => setLang(l)} style={{ ...btnGhost, background: lang === l ? '#2563eb' : 'white', color: lang === l ? 'white' : '#475569' }}>{l === 'vi' ? 'Tiếng Việt' : 'English'}</button>
          ))}
          <button onClick={download} disabled={dl} style={btnGhost}>{dl ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={14} />} Tải slide</button>
        </div>

        <div role="tablist" style={{ display: 'flex', gap: 6 }}>
          <button role="tab" aria-selected={view === 'slide'} onClick={() => setView('slide')} style={{ ...tabBtn, background: view === 'slide' ? '#1e3a8a' : 'white', color: view === 'slide' ? 'white' : '#334155' }}>Học bài ({nd.slides.length} slide)</button>
          {nd.quiz.length > 0 && <button role="tab" aria-selected={view === 'quiz'} onClick={() => setView('quiz')} style={{ ...tabBtn, background: view === 'quiz' ? '#1e3a8a' : 'white', color: view === 'quiz' ? 'white' : '#334155' }}>Tự kiểm tra ({nd.quiz.length} câu)</button>}
        </div>

        {view === 'slide' && (
          <>
            <SlidePreview lec={nd} index={cur} lang={lang} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => setCur(c => Math.max(c - 1, 0))} disabled={cur === 0} style={{ ...btnGhost, opacity: cur === 0 ? 0.4 : 1 }} aria-label="Slide trước"><ChevronLeft size={16} /> Trước</button>
              <div style={{ flex: 1, height: 6, background: '#dbe3f0', borderRadius: 99, overflow: 'hidden' }} aria-label={`Slide ${cur + 1} trên ${nd.slides.length}`}>
                <div style={{ width: `${((cur + 1) / nd.slides.length) * 100}%`, height: '100%', background: 'linear-gradient(90deg,#1B1F55,#FF7A00)', transition: 'width .25s' }} />
              </div>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontVariantNumeric: 'tabular-nums' }}>{cur + 1}/{nd.slides.length}</span>
              {last && nd.quiz.length > 0
                ? <button onClick={() => setView('quiz')} style={{ ...btnPrimary, background: '#f97316' }}>Làm tự kiểm tra <ChevronRight size={16} /></button>
                : <button onClick={() => setCur(c => Math.min(c + 1, nd.slides.length - 1))} disabled={last} style={{ ...btnPrimary, opacity: last ? 0.4 : 1 }} aria-label="Slide sau">Sau <ChevronRight size={16} /></button>}
            </div>
            <div style={{ ...card }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <b style={{ color: '#1e3a8a', fontSize: '0.9rem' }}>{lang === 'vi' ? 'Lời giảng' : 'Narration'}</b>
                {lang === 'vi' && <SpeakButton text={slide.narration.map(p => p[0]).join(' ')} size={14} />}
                {slide.nguon.length > 0 && <span style={{ marginLeft: 'auto', fontSize: '0.74rem', color: '#0369a1' }}>Nguồn: giáo trình mục {slide.nguon.join(', ')}</span>}
              </div>
              <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.7, color: '#1e293b', maxWidth: '75ch' }}>
                {slide.narration.map(([vi, en]) => L(vi, en)).join(' ')}
              </p>
            </div>
          </>
        )}

        {view === 'quiz' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {checked && (
              <div role="status" style={{ ...card, display: 'flex', alignItems: 'center', gap: 12, borderColor: score / nd.quiz.length >= 0.5 ? 'rgba(5,150,105,0.35)' : 'rgba(217,119,6,0.35)' }}>
                <b style={{ fontSize: '1.4rem', color: '#1e3a8a', fontVariantNumeric: 'tabular-nums' }}>{score}/{nd.quiz.length}</b>
                <span style={{ color: '#475569', fontSize: '0.88rem' }}>{score === nd.quiz.length ? 'Xuất sắc! Em đã nắm chắc bài.' : score / nd.quiz.length >= 0.5 ? 'Khá tốt — xem lại giải thích các câu sai.' : 'Em nên học lại các slide liên quan rồi làm lại.'}</span>
                <div style={{ flex: 1 }} />
                <button onClick={() => { setPicked({}); setChecked(false); }} style={btnGhost}><RotateCcw size={14} /> Làm lại</button>
              </div>
            )}
            {nd.quiz.map((q, qi) => (
              <fieldset key={qi} style={{ ...card, border: '1px solid rgba(37,99,235,0.1)', margin: 0 }}>
                <legend style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.92rem', padding: 0, float: 'left', width: '100%', marginBottom: 8 }}>
                  Câu {qi + 1}. {L(q.q.vi, q.q.en)}
                </legend>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, clear: 'both' }}>
                  {q.opts.map((o, oi) => {
                    const chosen = picked[qi] === oi;
                    const right = checked && oi === q.ans;
                    const wrong = checked && chosen && oi !== q.ans;
                    return (
                      <label key={oi} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 11px', borderRadius: 10, cursor: checked ? 'default' : 'pointer',
                        border: `1.5px solid ${right ? '#059669' : wrong ? '#dc2626' : chosen ? '#2563eb' : '#e2e8f0'}`,
                        background: right ? 'rgba(5,150,105,0.06)' : wrong ? 'rgba(220,38,38,0.05)' : 'white', fontSize: '0.88rem' }}>
                        <input type="radio" name={`q-${qi}`} checked={chosen} disabled={checked} onChange={() => setPicked(p => ({ ...p, [qi]: oi }))} />
                        <span style={{ fontWeight: 700, color: '#64748b' }}>{'ABCD'[oi]}.</span>
                        <span style={{ flex: 1 }}>{L(o.vi, o.en)}</span>
                        {right && <CheckCircle2 size={16} color="#059669" />}
                        {wrong && <XCircle size={16} color="#dc2626" />}
                      </label>
                    );
                  })}
                </div>
                {checked && (L(q.why.vi, q.why.en)) && (
                  <p style={{ margin: '8px 0 0', fontSize: '0.82rem', color: '#475569' }}>💡 {L(q.why.vi, q.why.en)}{q.nguon.length ? ` (mục ${q.nguon.join(', ')})` : ''}</p>
                )}
              </fieldset>
            ))}
            {!checked && (
              <button onClick={() => setChecked(true)} disabled={Object.keys(picked).length < nd.quiz.length}
                style={{ ...btnPrimary, alignSelf: 'flex-end', opacity: Object.keys(picked).length < nd.quiz.length ? 0.5 : 1 }}>
                Nộp và xem kết quả ({Object.keys(picked).length}/{nd.quiz.length})
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const card: React.CSSProperties = { background: 'white', border: '1px solid rgba(37,99,235,0.1)', borderRadius: 14, boxShadow: '0 6px 24px rgba(37,99,235,0.05)', padding: '1rem 1.1rem' };
const tabBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid #dbe3f0', borderRadius: 9, padding: '7px 13px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' };
const btnPrimary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer' };
const btnGhost: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, background: 'white', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 12px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' };

export default StudentBaiGiangViewer;
