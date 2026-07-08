import { type FC, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { ArrowDown, Copy, Check, Trash2, CheckCircle, Eye, ChevronDown, ChevronUp, ExternalLink, X, Loader2, Hash, Clock, BookOpen } from 'lucide-react';
import logoTNUT from '@/assets/logo_tnut/logo_tnut.png';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';
import katex from 'katex';
import ChatApi from '@/infra/chat/chat_api';
import type { IExamQuestion, IExamChapter } from '@/infra/api/interfaces/IChat';
import type { ChatMessage } from './types';

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

// ── Exam question card ─────────────────────────────────────
const EQCard: FC<{ q: IExamQuestion; idx: number }> = ({ q, idx }) => {
  const [open, setOpen] = useState(false);
  const opts   = (q.options ?? {}) as Record<string, string>;
  const answer = (q.answer ?? '').toUpperCase();
  return (
    <div style={{ background: 'white', borderRadius: 11, border: '1px solid rgba(37,99,235,0.08)', overflow: 'hidden' }}>
      <div onClick={() => setOpen(v => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', cursor: 'pointer', userSelect: 'none' }}>
        <div style={{ flexShrink: 0, width: 26, height: 26, borderRadius: 7, background: 'rgba(37,99,235,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 900, color: '#2563eb' }}>{idx}</div>
        <div style={{ flex: 1, minWidth: 0, fontSize: '0.82rem', fontWeight: 600, color: '#1e293b', lineHeight: 1.4 }}>
          <LT text={q.question ?? '—'} />
        </div>
        {answer && <span style={{ flexShrink: 0, fontSize: '0.62rem', fontWeight: 800, color: '#059669', background: 'rgba(5,150,105,0.09)', borderRadius: 5, padding: '2px 6px' }}>ĐA: {answer}</span>}
        <div style={{ flexShrink: 0, color: '#94a3b8' }}>{open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}</div>
      </div>
      {open && (
        <div style={{ padding: '0 14px 10px', borderTop: '1px solid rgba(37,99,235,0.06)', background: 'rgba(248,250,255,0.6)' }}>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {(['A','B','C','D'] as const).map(k => {
              const val = opts[k] ?? opts[k.toLowerCase()];
              if (!val) return null;
              const ok = k === answer;
              return (
                <div key={k} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: '0.78rem' }}>
                  <div style={{ flexShrink: 0, width: 20, height: 20, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, background: ok ? 'rgba(5,150,105,0.12)' : 'rgba(37,99,235,0.07)', color: ok ? '#059669' : '#2563eb' }}>{k}</div>
                  <span style={{ flex: 1, color: ok ? '#059669' : '#334155', fontWeight: ok ? 700 : 400, lineHeight: 1.4 }}><LT text={val} /></span>
                  {ok && <CheckCircle size={12} color="#059669" style={{ flexShrink: 0, marginTop: 2 }} />}
                </div>
              );
            })}
          </div>
          {q.explanation && (
            <div style={{ marginTop: 8, padding: '7px 9px', borderRadius: 7, background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.12)', fontSize: '0.72rem', color: '#92400e', lineHeight: 1.5 }}>
              <strong>Giải thích:</strong> <LT text={q.explanation} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Exam detail modal ──────────────────────────────────────
type ExamData = { ten_mon?: string | null; ma_mon?: string | null; time_limit?: number | null; questions?: IExamQuestion[]; chapters?: IExamChapter[] };

const ExamModal: FC<{ examId: string; onClose: () => void }> = ({ examId, onClose }) => {
  const [exam,    setExam]    = useState<ExamData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    Promise.resolve().then(() => {
      if (active) setLoading(true);
    });

    ChatApi.getExamDetail(examId)
      .then(r => {
        if (active) setExam(r.data);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [examId]);

  const questions = exam?.questions ?? [];
  const chapters  = exam?.chapters  ?? [];
  const groups = chapters.length > 0
    ? chapters.map(ch => ({ chapter: ch, qs: questions.filter(q => q.chapter_id === ch.id) }))
    : [{ chapter: null as IExamChapter | null, qs: questions }];
  const grouped = groups.reduce<Array<{ chapter: IExamChapter | null; qs: IExamQuestion[]; startIdx: number }>>((acc, g) => {
    const prev = acc[acc.length - 1];
    const startIdx = prev ? prev.startIdx + prev.qs.length : 1;
    acc.push({ ...g, startIdx });
    return acc;
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 720, height: '100dvh', background: '#f0f4ff', display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 40px rgba(15,23,42,0.3)', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e3a8a)', padding: '0 16px', position: 'sticky', top: 0, zIndex: 1, flexShrink: 0 }}>
          <div style={{ height: 52, display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', color: 'white', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
              <X size={12} /> Đóng
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {loading ? 'Đang tải...' : (exam?.ten_mon ?? 'Đề kiểm tra')}
              </div>
              {exam?.ma_mon && <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>{exam.ma_mon}</div>}
            </div>
            {!loading && exam && (
              <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                {exam.time_limit && <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}><Clock size={10} /> {exam.time_limit} phút</div>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}><Hash size={10} /> {questions.length} câu</div>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#64748b', fontSize: '0.82rem' }}>
            <Loader2 size={20} color="#2563eb" style={{ animation: 'spin 1s linear infinite' }} /> Đang tải đề...
          </div>
        ) : (
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {grouped.map(({ chapter, qs, startIdx }) => {
              return (
                <div key={chapter?.id ?? 'nc'}>
                  {chapter && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8, padding: '6px 10px', borderRadius: 9, background: 'linear-gradient(135deg,rgba(30,58,138,0.07),rgba(37,99,235,0.04))', border: '1px solid rgba(37,99,235,0.1)' }}>
                      <BookOpen size={12} color="#1e3a8a" />
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1e3a8a' }}>{chapter.title}</span>
                      <span style={{ fontSize: '0.62rem', color: '#64748b', marginLeft: 'auto' }}>{qs.length} câu</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {qs.map((q, i) => <EQCard key={q.id ?? i} q={q} idx={startIdx + i} />)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

interface Props {
  messages: ChatMessage[];
  isStreaming?: boolean;
  role?: 'teacher' | 'student';
  sessionId?: string;
  onExamDismiss: (msgId: string) => void;
  onExamConfirm: (msgId: string) => void;
  onExamPreview: (msgId: string) => void;
}

const fmtTime = (d: Date) => d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

const EXAM_API_RE = /^GET \/api\/exam\/([a-zA-Z0-9_-]+)$/;

const cleanContent = (s: string) =>
  s.replace(/ API:/g, ':').replace(/ API\b/g, '');

const ChatContent = ({ messages, isStreaming = false, role = 'teacher', sessionId, onExamDismiss, onExamConfirm, onExamPreview }: Props) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const viewingExamId = searchParams.get('exam');
  const setViewingExamId = (id: string | null) =>
    id ? setSearchParams({ exam: id }, { replace: true }) : setSearchParams({}, { replace: true });

  // Custom ReactMarkdown renderer: `GET /api/exam/{id}` → opens modal
  const mdComponents = useMemo(() => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    code: ({ children, ...props }: any) => {
      const text = String(children ?? '').trim();
      const match = text.match(EXAM_API_RE);
      if (match) {
        const examId = match[1];
        return (
          <button
            onClick={() => setViewingExamId(examId)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '8px 12px', borderRadius: 8,
              margin: '4px ',
              background: 'linear-gradient(135deg,#1e3a8a,#2563eb)',
              border: 'none', color: 'white',
              fontSize: '0.72rem', fontWeight: 500, cursor: 'pointer',
              verticalAlign: 'middle',
            }}
          >
            <ExternalLink size={11} /> Xem đề kiểm tra
          </button>
        );
      }
      return <code {...props}>{children}</code>;
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef    = useRef<HTMLDivElement>(null);
  const [showScroll,  setShowScroll]  = useState(false);
  const [copiedId,    setCopiedId]    = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) =>
    setExpandedIds(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });

  const prevSessionRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const timer = setTimeout(() => {
      const c = containerRef.current;
      if (!c) return;
      // Đổi phiên chat (chọn session khác / vừa reload trang) — nhảy thẳng đến tin nhắn mới nhất, không cần animation
      const sessionChanged = prevSessionRef.current !== sessionId;
      prevSessionRef.current = sessionId;
      if (sessionChanged) {
        bottomRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
        return;
      }
      const nearBottom = c.scrollHeight - c.scrollTop - c.clientHeight < 120;
      if (nearBottom || messages.length <= 1 || isStreaming) {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, 60);
    return () => clearTimeout(timer);
  }, [messages, isStreaming, sessionId]);

  const handleScroll = () => {
    const c = containerRef.current;
    if (!c) return;
    setShowScroll(c.scrollHeight - c.scrollTop - c.clientHeight > 200);
  };

  const handleCopy = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .chat-bubble-bot hr { border:none; border-top:1.5px solid rgba(37,99,235,0.12); margin:10px 0; }
        .chat-bubble-bot p { margin:0 0 6px; }
        .chat-bubble-bot p:last-child { margin-bottom:0; }
        .chat-bubble-bot ul { padding-left:0; list-style:none; display:flex; flex-direction:column; gap:4px; margin:6px 0; }
        .chat-bubble-bot li { padding:6px 10px; border-radius:8px; background:rgba(37,99,235,0.04); border:1px solid rgba(37,99,235,0.09); font-size:0.85rem; }
        .chat-bubble-bot strong { color:#1e293b; }
        .chat-bubble-bot code { background:rgba(37,99,235,0.08); color:#2563eb; padding:1px 6px; border-radius:5px; font-size:0.82em; }
        .chat-bubble-bot h1,.chat-bubble-bot h2,.chat-bubble-bot h3 { font-size:0.9rem; font-weight:700; color:#1e293b; margin:8px 0 4px; }
        .chat-bubble-bot table { border-collapse:collapse; width:100%; margin:8px 0; font-size:0.8rem; display:block; overflow-x:auto; white-space:nowrap; }
        .chat-bubble-bot th,.chat-bubble-bot td { border:1px solid rgba(37,99,235,0.15); padding:6px 10px; text-align:center; }
        .chat-bubble-bot thead th { background:rgba(37,99,235,0.08); color:#1e3a8a; font-weight:700; }
        .chat-bubble-bot tbody tr:nth-child(even) { background:rgba(37,99,235,0.03); }
      `}</style>
      <div ref={containerRef} onScroll={handleScroll} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
          {messages.length === 0 && !isStreaming ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', marginBottom: 16, boxShadow: '0 2px 12px rgba(37,99,235,0.2)' }}>
                <img src={logoTNUT} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1e293b', marginBottom: 6 }}>Xin chào!</div>
              <div style={{ fontSize: '0.82rem', color: '#94a3b8', textAlign: 'center', maxWidth: 360 }}>
                Tôi là <strong>TAI-TNUT</strong> — trợ lý AI hỗ trợ học tập. Hãy đặt câu hỏi để bắt đầu!
              </div>
            </div>
          ) : (
            <div style={{ maxWidth: 860, margin: '0 auto', width: '100%', padding: '16px 16px 8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {messages.map(msg => {
                  // Tin bot đang stream: hiện typing indicator + nút dropdown xem live text
                  if (msg.role === 'assistant' && msg.isStreaming) {
                    const expanded = expandedIds.has(msg.id);
                    return (
                      <div key={msg.id} style={{ display: 'flex', gap: 10 }}>
                        <div style={{ flexShrink: 0, width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', marginTop: 2, animation: 'pulse 1.5s ease infinite', boxShadow: '0 2px 8px rgba(109,40,217,0.3)' }}>
                          <img src={logoTNUT} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: '80%' }}>
                          {/* Typing indicator row */}
                          <div style={{ padding: '10px 14px', borderRadius: '4px 16px 16px 16px', background: 'white', border: '1px solid rgba(37,99,235,0.08)', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                              {[0, 1, 2].map(i => (
                                <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#2563eb', display: 'inline-block', animation: `pulse 1.2s ease ${i * 0.2}s infinite` }} />
                              ))}
                            </div>
                            <span style={{ fontSize: '0.78rem', color: '#94a3b8', flex: 1 }}>TAI đang soạn...</span>
                            {/* Dropdown toggle — luôn hiển thị, disable khi chưa có text */}
                            <button
                              onClick={() => msg.content && toggleExpand(msg.id)}
                              title={expanded ? 'Ẩn nội dung' : 'Xem nội dung đang tạo'}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 3,
                                padding: '2px 7px', borderRadius: 6,
                                background: expanded ? 'rgba(37,99,235,0.1)' : 'rgba(37,99,235,0.05)',
                                border: '1px solid rgba(37,99,235,0.15)',
                                color: msg.content ? '#2563eb' : '#94a3b8',
                                fontSize: '0.68rem', fontWeight: 700,
                                cursor: msg.content ? 'pointer' : 'not-allowed',
                                flexShrink: 0, opacity: msg.content ? 1 : 0.5,
                              }}
                            >
                              <ChevronDown size={11} style={{ transition: 'transform .2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                              {expanded ? 'Ẩn' : 'Xem'}
                            </button>
                          </div>
                          {/* Live streaming text (expandable) */}
                          {expanded && msg.content && (
                            <div style={{ padding: '10px 14px', borderRadius: '4px 16px 16px 16px', background: 'white', border: '1px solid rgba(37,99,235,0.08)', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', fontSize: '0.875rem', lineHeight: 1.6, color: '#1e293b' }}>
                              <div className="chat-bubble-bot prose prose-sm max-w-none" style={{ fontSize: '0.875rem' }}>
                                <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={mdComponents}>
                                  {cleanContent(msg.content)}
                                </ReactMarkdown>
                              </div>
                              <span style={{ display: 'inline-block', width: 6, height: 14, background: '#2563eb', borderRadius: 2, marginLeft: 2, animation: 'blink 0.7s step-start infinite', verticalAlign: 'middle' }} />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  return (
                  <div key={msg.id}>
                    <div style={{ display: 'flex', gap: 10, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                      {msg.role === 'assistant' && (
                        <div style={{ flexShrink: 0, width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', marginTop: 2, boxShadow: '0 2px 8px rgba(109,40,217,0.25)' }}>
                          <img src={logoTNUT} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                        {/* Bubble */}
                        <div style={{
                          padding: '10px 14px',
                          borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                          background: msg.role === 'user' ? 'linear-gradient(135deg,#1e3a8a,#2563eb)' : 'white',
                          color: msg.role === 'user' ? 'white' : '#1e293b',
                          boxShadow: msg.role === 'user' ? '0 2px 10px rgba(37,99,235,0.25)' : '0 2px 12px rgba(0,0,0,0.07)',
                          fontSize: '0.875rem',
                          lineHeight: 1.6,
                        }}>
                          {msg.role === 'assistant' ? (
                            <div className="chat-bubble-bot prose prose-sm max-w-none" style={{ fontSize: '0.875rem' }}>
                              <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={mdComponents}>
                                {cleanContent(msg.content)}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                          )}
                          {/* Assignment button — inside bubble, student only */}
                          {role === 'student' && msg.role === 'assistant' && msg.intent === 'luyen_tap_tao_de' && msg.assignmentLink && !msg.isStreaming && (
                            <div style={{ marginTop: 10 }}>
                              <a
                                href={(() => { try { return new URL(msg.assignmentLink).pathname; } catch { return msg.assignmentLink; } })()}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 7,
                                  padding: '8px 18px', borderRadius: 9,
                                  background: 'linear-gradient(135deg,#2563eb,#3b82f6)',
                                  color: 'white', fontWeight: 700, fontSize: '0.8rem',
                                  textDecoration: 'none', boxShadow: '0 2px 8px rgba(37,99,235,0.28)',
                                  transition: 'opacity .15s',
                                }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                              >
                                ✏️ Làm bài kiểm tra
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Footer: time + copy */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, padding: '0 2px' }}>
                          {msg.role === 'assistant' && !msg.isStreaming && (
                            <button onClick={() => handleCopy(msg.content, msg.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px 5px', borderRadius: 5, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.68rem' }}
                              title="Sao chép"
                            >
                              {copiedId === msg.id ? <Check size={11} color="#059669" /> : <Copy size={11} />}
                            </button>
                          )}
                          <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{fmtTime(msg.timestamp)}</span>
                        </div>

                        {/* Exam action buttons — teacher only */}
                        {role === 'teacher' && msg.role === 'assistant' && msg.examMeta && !msg.examMeta.dismissed && !msg.examMeta.confirmed && (
                          <div style={{ marginTop: 8, display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                            <button
                              onClick={() => onExamDismiss(msg.id)}
                              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 8, background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', color: '#dc2626', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                              <Trash2 size={12} /> Xóa
                            </button>
                            <button
                              onClick={() => onExamPreview(msg.id)}
                              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 8, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)', color: '#d97706', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                              <Eye size={12} /> Preview
                            </button>
                            <button
                              onClick={() => onExamConfirm(msg.id)}
                              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 8, background: 'linear-gradient(135deg,#059669,#10b981)', border: 'none', color: 'white', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                            >
                              <CheckCircle size={12} /> Chấp nhận
                            </button>
                          </div>
                        )}
                        {role === 'teacher' && msg.role === 'assistant' && msg.examMeta?.confirmed && (
                          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>
                              <CheckCircle size={12} /> Đã lưu đề kiểm tra
                            </span>
                            {msg.examMeta.savedExamId && (
                              <button
                                onClick={() => setViewingExamId(msg.examMeta!.savedExamId!)}
                                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 7, background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', border: 'none', color: 'white', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
                              >
                                <ExternalLink size={10} /> Xem đề kiểm tra
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                  );
                })}

                <div ref={bottomRef} style={{ height: 8 }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Exam detail modal */}
      {viewingExamId && (
        <ExamModal examId={viewingExamId} onClose={() => setViewingExamId(null)} />
      )}

      {/* Jump to current (scroll to bottom) */}
      {showScroll && (
        <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
          <button
            onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })}
            title="Nhảy đến hiện tại"
            style={{
              pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 20, background: 'white',
              border: '1px solid rgba(30,58,138,0.2)', boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
              cursor: 'pointer', color: '#2563eb', fontSize: '0.75rem', fontWeight: 700,
            }}
          >
            <ArrowDown size={14} /> Đến hiện tại
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatContent;
