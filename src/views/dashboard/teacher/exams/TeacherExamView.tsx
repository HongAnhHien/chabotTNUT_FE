import { type FC, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft, Loader2, ClipboardList, Clock, BookOpen,
  Hash, CheckCircle, ChevronDown, ChevronUp, Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import ChatApi from '@/infra/chat/chat_api';
import type { ISavedExam, IExamQuestion, IExamChapter } from '@/infra/api/interfaces/IChat';

// ── CSS ──────────────────────────────────────────────────
const CSS = `
  @keyframes tev-fade { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes tev-spin  { to{transform:rotate(360deg)} }
  @keyframes tev-shimmer {
    0%{background-position:200% 0} 100%{background-position:-200% 0}
  }
  .tev-stat {
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    padding:16px 12px; border-radius:14px; flex:1;
  }
  .tev-q-row {
    background:white; border-radius:11px;
    border:1px solid rgba(37,99,235,0.07);
    overflow:hidden; animation:tev-fade .3s ease both;
    transition:box-shadow .18s;
  }
  .tev-q-row:hover { box-shadow:0 4px 16px rgba(37,99,235,0.08); }
  .tev-q-header {
    display:flex; align-items:center; gap:10px;
    padding:11px 14px; cursor:pointer; user-select:none;
  }
  .tev-q-header:hover { background:rgba(37,99,235,0.02); }
  .tev-opt {
    display:flex; align-items:flex-start; gap:8px;
    padding:5px 0; font-size:0.8rem; color:#334155;
  }
  .tev-opt-key {
    flex-shrink:0; width:22px; height:22px; border-radius:6px;
    display:flex; align-items:center; justify-content:center;
    font-size:0.7rem; font-weight:800;
  }
  .tev-opt-key.correct { background:rgba(5,150,105,0.12); color:#059669; }
  .tev-opt-key.normal  { background:rgba(37,99,235,0.07); color:#2563eb; }
  .tev-skeleton {
    border-radius:12px;
    background:linear-gradient(90deg,#f0f4ff 25%,#e8f0fe 50%,#f0f4ff 75%);
    background-size:200% 100%;
    animation:tev-shimmer 1.4s ease infinite;
  }
`;

// ── LaTeX ─────────────────────────────────────────────────
const _rk = (src: string, display: boolean) => {
  try { return katex.renderToString(src, { throwOnError: false, displayMode: display, output: 'html' }); }
  catch { return src; }
};
const _pl = (text: string) => {
  const chunks: Array<{ t: 'text' | 'inline' | 'display'; c: string }> = [];
  const re = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;
  let last = 0, m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) chunks.push({ t: 'text', c: text.slice(last, m.index) });
    const raw = m[0];
    if (raw.startsWith('$$')) chunks.push({ t: 'display', c: raw.slice(2, -2) });
    else                      chunks.push({ t: 'inline',  c: raw.slice(1, -1) });
    last = m.index + raw.length;
  }
  if (last < text.length) chunks.push({ t: 'text', c: text.slice(last) });
  return chunks;
};
const LT: FC<{ text: string }> = ({ text }) => (
  <span>
    {_pl(text ?? '').map((c, i) =>
      c.t === 'text'
        ? <span key={i}>{c.c}</span>
        : <span key={i} dangerouslySetInnerHTML={{ __html: _rk(c.c, c.t === 'display') }} />
    )}
  </span>
);

// ── Types ─────────────────────────────────────────────────
type FullExam = ISavedExam & { questions?: IExamQuestion[]; session_id?: string | null };

// ── Question card ─────────────────────────────────────────
const QuestionCard: FC<{ q: IExamQuestion; idx: number; delay: number }> = ({ q, idx, delay }) => {
  const [open, setOpen] = useState(false);
  const opts   = q.options ?? {};
  const answer = (q.answer ?? '').toUpperCase();

  return (
    <div className="tev-q-row" style={{ animationDelay: `${delay}s` }}>
      <div className="tev-q-header" onClick={() => setOpen(v => !v)}>
        {/* Index badge */}
        <div style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 8, background: 'rgba(37,99,235,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 900, color: '#2563eb' }}>
          {idx}
        </div>
        {/* Question text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b', lineHeight: 1.45 }}>
            <LT text={q.question ?? '—'} />
          </div>
          {q.chapter_title && (
            <span style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 500 }}>{q.chapter_title}</span>
          )}
        </div>
        {/* Answer badge */}
        {answer && (
          <span style={{ flexShrink: 0, fontSize: '0.65rem', fontWeight: 800, color: '#059669', background: 'rgba(5,150,105,0.09)', borderRadius: 6, padding: '2px 7px' }}>
            ĐA: {answer}
          </span>
        )}
        <div style={{ flexShrink: 0, color: '#94a3b8' }}>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>

      {open && (
        <div style={{ padding: '0 14px 12px', borderTop: '1px solid rgba(37,99,235,0.06)', background: 'rgba(248,250,255,0.5)' }}>
          {/* Options */}
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {(['A','B','C','D'] as const).map(k => {
              const text = (opts as Record<string, string>)[k] ?? (opts as Record<string, string>)[k.toLowerCase()];
              if (!text) return null;
              const isCorrect = k === answer;
              return (
                <div key={k} className="tev-opt">
                  <div className={`tev-opt-key ${isCorrect ? 'correct' : 'normal'}`}>{k}</div>
                  <span style={{ flex: 1, color: isCorrect ? '#059669' : '#334155', fontWeight: isCorrect ? 700 : 400, lineHeight: 1.45 }}>
                    <LT text={text} />
                  </span>
                  {isCorrect && <CheckCircle size={13} color="#059669" style={{ flexShrink: 0, marginTop: 3 }} />}
                </div>
              );
            })}
          </div>

          {/* Explanation */}
          {q.explanation && (
            <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 8, background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.12)', fontSize: '0.76rem', color: '#92400e', lineHeight: 1.5 }}>
              <strong>Giải thích:</strong> <LT text={q.explanation} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Chapter header ────────────────────────────────────────
const ChapterHeader: FC<{ chapter: IExamChapter; count: number }> = ({ chapter, count }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '7px 12px', borderRadius: 10, background: 'linear-gradient(135deg,rgba(30,58,138,0.07),rgba(37,99,235,0.04))', border: '1px solid rgba(37,99,235,0.1)' }}>
    <BookOpen size={13} color="#1e3a8a" />
    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e3a8a' }}>{chapter.title}</span>
    <span style={{ fontSize: '0.65rem', color: '#64748b', marginLeft: 'auto' }}>{count} câu</span>
  </div>
);

// ── Main page ─────────────────────────────────────────────
const TeacherExamView: FC = () => {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [exam,    setExam]    = useState<FullExam | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    ChatApi.getExamDetail(id)
      .then(r => setExam(r.data))
      .catch(() => toast.error('Không thể tải đề kiểm tra.'))
      .finally(() => setLoading(false));
  }, [id]);

  const questions = exam?.questions ?? [];
  const chapters  = exam?.chapters  ?? [];
  const isConfirmed = exam?.status === 'confirmed';

  const grouped = chapters.length > 0
    ? chapters.map(ch => ({ chapter: ch, qs: questions.filter(q => q.chapter_id === ch.id) }))
    : [{ chapter: null as IExamChapter | null, qs: questions }];

  let globalIdx = 1;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#f0f4ff 0%,#e8f0fe 50%,#f5f3ff 100%)' }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e3a8a)', padding: '0 20px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', height: 56, display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate(-1)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', color: 'white', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
          >
            <ArrowLeft size={13} /> Quay lại
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {loading ? 'Đang tải...' : (exam?.ten_mon ?? 'Đề kiểm tra')}
            </div>
            {exam && (
              <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.55)', display: 'flex', alignItems: 'center', gap: 8 }}>
                {exam.ma_mon && <><ClipboardList size={10} /> <span style={{ fontFamily: 'monospace' }}>{exam.ma_mon}</span></>}
                {exam.ma_mon && <span>·</span>}
                <span style={{ color: isConfirmed ? '#4ade80' : '#fbbf24' }}>
                  {isConfirmed ? 'Đã xác nhận' : 'Nháp'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem' }}>
          <Loader2 size={28} color="#2563eb" style={{ animation: 'tev-spin 1s linear infinite', margin: '0 auto 10px', display: 'block' }} />
          <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Đang tải...</div>
        </div>
      ) : !exam ? (
        <div style={{ textAlign: 'center', padding: '5rem', color: '#94a3b8' }}>
          <ClipboardList size={42} color="#bfdbfe" style={{ margin: '0 auto 12px', display: 'block' }} />
          Không tìm thấy đề kiểm tra.
        </div>
      ) : (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {[
              { label: 'Số câu hỏi', value: questions.length, icon: Hash,         bg: 'rgba(30,58,138,0.06)',   color: '#1e3a8a' },
              { label: 'Thời gian',  value: exam.time_limit ? `${exam.time_limit} phút` : '—', icon: Clock, bg: 'rgba(124,58,237,0.06)',  color: '#7c3aed' },
              { label: 'Chương',     value: chapters.length || '—', icon: Layers,  bg: 'rgba(5,150,105,0.06)',   color: '#059669' },
            ].map(({ label, value, icon: Icon, bg, color }) => (
              <div key={label} className="tev-stat" style={{ background: bg, border: `1px solid ${color}22` }}>
                <Icon size={20} color={color} style={{ marginBottom: 6 }} />
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600, marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Questions */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Câu hỏi ({questions.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {grouped.map(({ chapter, qs }) => {
                const startIdx = globalIdx;
                globalIdx += qs.length;
                return (
                  <div key={chapter?.id ?? 'no-chapter'}>
                    {chapter && <ChapterHeader chapter={chapter} count={qs.length} />}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      {qs.map((q, i) => (
                        <QuestionCard key={q.id ?? i} q={q} idx={startIdx + i} delay={i * 0.03} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherExamView;
