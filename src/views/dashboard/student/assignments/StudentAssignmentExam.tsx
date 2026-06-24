import { type FC, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Loader2, Clock, CheckCircle, XCircle, AlertTriangle, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import StudentApi from '@/infra/student/student_api';
import type { IStudentAssignmentDetailResponse, IStudentQuestion } from '@/infra/api/interfaces/IAssignment';

// ── LaTeX renderer ─────────────────────────────────────
const renderKatex = (src: string, display: boolean) => {
  try {
    return katex.renderToString(src, { throwOnError: false, displayMode: display, output: 'html' });
  } catch { return src; }
};

// Split "text $inline$ more $$display$$ rest" into chunks
const parseLatex = (text: string): Array<{ type: 'text' | 'inline' | 'display'; content: string }> => {
  const chunks: Array<{ type: 'text' | 'inline' | 'display'; content: string }> = [];
  // Match $$...$$ first, then $...$
  const re = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;
  let last = 0, m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) chunks.push({ type: 'text', content: text.slice(last, m.index) });
    const raw = m[0];
    if (raw.startsWith('$$')) chunks.push({ type: 'display', content: raw.slice(2, -2) });
    else                      chunks.push({ type: 'inline',  content: raw.slice(1, -1) });
    last = m.index + raw.length;
  }
  if (last < text.length) chunks.push({ type: 'text', content: text.slice(last) });
  return chunks;
};

const LatexText: FC<{ text: string; style?: React.CSSProperties }> = ({ text, style }) => {
  const chunks = parseLatex(text ?? '');
  return (
    <span style={style}>
      {chunks.map((c, i) =>
        c.type === 'text' ? <span key={i}>{c.content}</span> :
        <span key={i} dangerouslySetInnerHTML={{ __html: renderKatex(c.content, c.type === 'display') }} />
      )}
    </span>
  );
};

const CSS = `
  @keyframes sae-fade { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes sae-spin { to{transform:rotate(360deg)} }
  @keyframes sae-pulse { 0%,100%{opacity:1} 50%{opacity:.6} }
  .sae-opt {
    display:flex; align-items:flex-start; gap:10px; padding:10px 12px; border-radius:11px;
    cursor:pointer; transition:all .15s; border:2px solid transparent;
  }
  .sae-opt:hover { background: rgba(37,99,235,0.05); }
  .sae-opt.selected { border-color:#2563eb; background:rgba(37,99,235,0.06); }
  .sae-opt.correct  { border-color:#059669; background:rgba(5,150,105,0.07); }
  .sae-opt.wrong    { border-color:#dc2626; background:rgba(220,38,38,0.05); }
  .sae-opt.missed   { border-color:#059669; background:rgba(5,150,105,0.05); }
`;

const OPT_COLORS: Record<string, string> = { A: '#2563eb', B: '#7c3aed', C: '#059669', D: '#d97706' };

const fmtDt = (s?: string | null) => {
  if (!s) return '—';
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(s.replace(' ', 'T')));
};

const pad = (n: number) => String(n).padStart(2, '0');
const fmtSeconds = (sec: number) => `${pad(Math.floor(sec / 60))}:${pad(sec % 60)}`;

const StudentAssignmentExam: FC = () => {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [detail,    setDetail]    = useState<IStudentAssignmentDetailResponse['data'] | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [answers,   setAnswers]   = useState<Record<number, string>>({});
  const [submitting,setSubmitting]= useState(false);
  const [timeLeft,  setTimeLeft]  = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    StudentApi.getAssignmentDetail(id)
      .then(r => {
        setDetail(r.data);
        if (!r.data.my_submission && r.data.assignment.time_limit) {
          setTimeLeft(r.data.assignment.time_limit * 60);
        }
      })
      .catch(() => toast.error('Không thể tải bài kiểm tra.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft === null || detail?.my_submission) return;
    if (timeLeft <= 0) { handleSubmit(); return; }
    timerRef.current = setInterval(() => setTimeLeft(prev => (prev !== null ? prev - 1 : null)), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft === null ? null : Math.floor(timeLeft / 60), detail?.my_submission]);

  const handleSubmit = async () => {
    if (!id) return;
    if (timerRef.current) clearInterval(timerRef.current);
    const qs = detail?.questions ?? [];
    const unanswered = qs.filter(q => !answers[q.id]);
    if (unanswered.length > 0 && timeLeft !== 0) {
      if (!confirm(`Còn ${unanswered.length} câu chưa trả lời. Vẫn nộp bài?`)) return;
    }
    setSubmitting(true);
    try {
      const r = await StudentApi.submitAssignment(id, {
        answers: qs.map(q => ({ question_id: q.id, answer: answers[q.id] ?? '' })).filter(a => a.answer),
      });
      if (r.success) {
        toast.success(`Nộp thành công! Điểm: ${r.data?.score}/${r.data?.total}`);
        load();
      } else {
        toast.error(r.message ?? 'Nộp thất bại.');
      }
    } catch {
      toast.error('Nộp thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const hasSubmitted = !!detail?.my_submission;

  const getOptClass = (q: IStudentQuestion, key: string): string => {
    if (!hasSubmitted) return answers[q.id] === key ? 'sae-opt selected' : 'sae-opt';
    const myAns = detail?.my_submission?.answers.find(a => a.question_id === q.id)?.answer;
    if (key === q.answer) return 'sae-opt correct';
    if (key === myAns && key !== q.answer) return 'sae-opt wrong';
    return 'sae-opt';
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 40%,#f0fdf4 100%)' }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#0f172a,#0369a1)', padding: '0 20px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 760, margin: '0 auto', height: 56, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/student/assignments')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', color: 'white', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
          >
            <ArrowLeft size={13} /> Quay lại
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {detail?.assignment.title ?? 'Bài kiểm tra'}
            </div>
          </div>
          {/* Timer */}
          {timeLeft !== null && !hasSubmitted && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 8, background: timeLeft < 120 ? 'rgba(220,38,38,0.25)' : 'rgba(255,255,255,0.12)', border: `1px solid ${timeLeft < 120 ? 'rgba(220,38,38,0.4)' : 'rgba(255,255,255,0.2)'}` }}>
              <Clock size={13} color={timeLeft < 120 ? '#fca5a5' : 'white'} style={timeLeft < 120 ? { animation: 'sae-pulse 1s ease infinite' } : {}} />
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: timeLeft < 120 ? '#fca5a5' : 'white', fontVariantNumeric: 'tabular-nums' }}>{fmtSeconds(timeLeft)}</span>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem' }}>
          <Loader2 size={28} color="#0369a1" style={{ animation: 'sae-spin 1s linear infinite', margin: '0 auto 10px', display: 'block' }} />
          <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Đang tải bài...</div>
        </div>
      ) : !detail ? (
        <div style={{ textAlign: 'center', padding: '5rem', color: '#94a3b8' }}>Không tìm thấy bài kiểm tra.</div>
      ) : (
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Info card */}
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid rgba(3,105,161,0.1)', padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#1e293b', marginBottom: 6 }}>{detail.assignment.title}</div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {detail.assignment.time_limit && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: '#64748b' }}>
                      <Clock size={12} /> {detail.assignment.time_limit} phút
                    </span>
                  )}
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Hạn nộp: {fmtDt(detail.assignment.due_at)}</span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{detail.questions.length} câu hỏi</span>
                </div>
                {detail.assignment.instructions && (
                  <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(3,105,161,0.05)', borderRadius: 8, fontSize: '0.78rem', color: '#334155', borderLeft: '3px solid #0369a1' }}>
                    {detail.assignment.instructions}
                  </div>
                )}
              </div>
              {/* Result badge if submitted */}
              {hasSubmitted && detail.my_submission && (
                <div style={{ textAlign: 'center', padding: '10px 18px', background: 'linear-gradient(135deg,rgba(5,150,105,0.08),rgba(16,185,129,0.05))', borderRadius: 14, border: '1px solid rgba(5,150,105,0.15)', flexShrink: 0 }}>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#059669', lineHeight: 1 }}>
                    {detail.my_submission.score}/{detail.my_submission.total}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 2 }}>điểm</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', marginTop: 4 }}>
                    {Math.round((detail.my_submission.score / (detail.my_submission.total || 1)) * 100)}%
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submitted banner */}
          {hasSubmitted && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.2)', borderRadius: 11 }}>
              <CheckCircle size={16} color="#059669" />
              <span style={{ fontSize: '0.82rem', color: '#059669', fontWeight: 600 }}>
                Đã nộp lúc {fmtDt(detail.my_submission!.submitted_at)} — Xem đáp án đúng/sai bên dưới
              </span>
            </div>
          )}

          {detail.assignment.is_overdue && !hasSubmitted && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 11 }}>
              <AlertTriangle size={16} color="#dc2626" />
              <span style={{ fontSize: '0.82rem', color: '#dc2626', fontWeight: 600 }}>Bài kiểm tra đã quá hạn nộp.</span>
            </div>
          )}

          {/* Questions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {detail.questions.map((q, idx) => {
              const myAns = detail.my_submission?.answers.find(a => a.question_id === q.id);
              const isCorrect = myAns?.is_correct;
              return (
                <div key={q.id} style={{ background: 'white', borderRadius: 14, border: hasSubmitted ? `1.5px solid ${isCorrect ? 'rgba(5,150,105,0.2)' : myAns ? 'rgba(220,38,38,0.2)' : 'rgba(37,99,235,0.08)'}` : '1px solid rgba(37,99,235,0.08)', overflow: 'hidden', animation: 'sae-fade .3s ease both', animationDelay: `${idx * 0.03}s` }}>
                  {/* Question header */}
                  <div style={{ padding: '8px 14px', background: 'linear-gradient(135deg,rgba(3,105,161,0.05),rgba(37,99,235,0.03))', borderBottom: '1px solid rgba(37,99,235,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#0369a1', background: 'rgba(3,105,161,0.1)', borderRadius: 20, padding: '1px 8px' }}>Câu {idx + 1}</span>
                      {q.chapter_title && <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{q.chapter_title}</span>}
                    </div>
                    {hasSubmitted && myAns && (
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, color: isCorrect ? '#059669' : '#dc2626' }}>
                        {isCorrect ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        {isCorrect ? 'Đúng' : 'Sai'}
                      </span>
                    )}
                  </div>

                  {/* Question text */}
                  <div style={{ padding: '12px 14px', fontSize: '0.875rem', color: '#1e293b', lineHeight: 1.6, borderBottom: '1px solid rgba(37,99,235,0.05)' }}>
                    <LatexText text={q.question} />
                  </div>

                  {/* Options */}
                  <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {Object.entries(q.options).map(([key, val]) => {
                      const optClass = getOptClass(q, key);
                      const optColor = OPT_COLORS[key] ?? '#2563eb';
                      const isAnswer = key === q.answer;
                      const isMyWrong = hasSubmitted && myAns?.answer === key && !isCorrect;
                      return (
                        <div key={key} className={optClass}
                          onClick={() => { if (!hasSubmitted && !detail.assignment.is_overdue) setAnswers(prev => ({ ...prev, [q.id]: key })); }}
                        >
                          <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 800, color: 'white', background: hasSubmitted ? (isAnswer ? '#059669' : isMyWrong ? '#dc2626' : optColor + '60') : (answers[q.id] === key ? optColor : optColor + '40') }}>
                            {key}
                          </span>
                          <span style={{ fontSize: '0.82rem', color: hasSubmitted ? (isAnswer ? '#059669' : isMyWrong ? '#dc2626' : '#64748b') : '#1e293b', fontWeight: (hasSubmitted && isAnswer) ? 700 : 400, flex: 1, lineHeight: 1.45 }}>
                            <LatexText text={val as string} />
                          </span>
                          {hasSubmitted && isAnswer && (
                            <span style={{ fontSize: '0.65rem', color: '#059669', fontWeight: 800, whiteSpace: 'nowrap', flexShrink: 0 }}>✓ Đáp án</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  {hasSubmitted && q.explanation && (
                    <div style={{ margin: '0 12px 12px', padding: '8px 12px', background: 'rgba(3,105,161,0.05)', borderRadius: 9, fontSize: '0.75rem', color: '#334155', borderLeft: '3px solid #0369a1', lineHeight: 1.5 }}>
                      <strong>Giải thích:</strong> <LatexText text={q.explanation ?? ''} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Submit button */}
          {!hasSubmitted && !detail.assignment.is_overdue && (
            <div style={{ position: 'sticky', bottom: 20, display: 'flex', justifyContent: 'center', marginTop: 8 }}>
              <button onClick={handleSubmit} disabled={submitting}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 32px', borderRadius: 14, background: submitting ? 'rgba(3,105,161,0.4)' : 'linear-gradient(135deg,#0369a1,#0ea5e9)', border: 'none', color: 'white', fontSize: '0.9rem', fontWeight: 800, cursor: submitting ? 'not-allowed' : 'pointer', boxShadow: '0 6px 20px rgba(3,105,161,0.3)', letterSpacing: '0.02em' }}
              >
                {submitting ? <Loader2 size={16} style={{ animation: 'sae-spin 1s linear infinite' }} /> : <Send size={16} />}
                {submitting ? 'Đang nộp...' : `Nộp bài (${Object.keys(answers).length}/${detail.questions.length} câu)`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentAssignmentExam;
