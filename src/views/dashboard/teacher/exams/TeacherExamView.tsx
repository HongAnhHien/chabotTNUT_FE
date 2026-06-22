import { type FC, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft, ClipboardList, Clock, BookOpen,
  CheckCircle, HelpCircle, ChevronDown, ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import ChatApi from '@/infra/chat/chat_api';
import type { ISavedExam, IExamQuestion, IExamChapter } from '@/infra/api/interfaces/IChat';

// ── CSS ─────────────────────────────────────────────────
const CSS = `
  @keyframes ev-fade { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ev-shimmer {
    0%{background-position:200% 0} 100%{background-position:-200% 0}
  }
  .ev-card {
    background: white; border-radius: 14px;
    border: 1px solid rgba(37,99,235,0.09);
    animation: ev-fade .3s ease both;
    overflow: hidden;
  }
  .ev-q-row {
    background: white; border-radius: 12px;
    border: 1px solid rgba(37,99,235,0.09);
    overflow: hidden;
    animation: ev-fade .3s ease both;
    transition: box-shadow .18s;
  }
  .ev-q-row:hover { box-shadow: 0 4px 16px rgba(37,99,235,0.08); }
  .ev-q-header {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 14px; cursor: pointer; user-select: none;
  }
  .ev-q-header:hover { background: rgba(37,99,235,0.02); }
  .ev-opt-row {
    display: flex; align-items: flex-start; gap: 8px;
    padding: 5px 0; font-size: 0.8rem; color: #334155;
  }
  .ev-opt-key {
    flex-shrink: 0; width: 22px; height: 22px; border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.7rem; font-weight: 800;
  }
  .ev-opt-key.correct { background: rgba(5,150,105,0.12); color: #059669; }
  .ev-opt-key.normal  { background: rgba(37,99,235,0.07); color: #2563eb; }
  .ev-skeleton {
    border-radius: 12px;
    background: linear-gradient(90deg,#f0f4ff 25%,#e8f0fe 50%,#f0f4ff 75%);
    background-size: 200% 100%;
    animation: ev-shimmer 1.4s ease infinite;
  }
`;

// ── Helpers ──────────────────────────────────────────────
type FullExam = ISavedExam & {
  questions?: IExamQuestion[];
  session_id?: string | null;
};

const optionKeys = ['A', 'B', 'C', 'D'];

// ── Question card ────────────────────────────────────────
const QuestionCard: FC<{ q: IExamQuestion; idx: number; delay: number }> = ({ q, idx, delay }) => {
  const [open, setOpen] = useState(false);
  const opts = q.options ?? {};
  const answer = (q.answer ?? '').toUpperCase();

  return (
    <div className="ev-q-row" style={{ animationDelay: `${delay}s` }}>
      <div className="ev-q-header" onClick={() => setOpen(v => !v)}>
        <div style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 8, background: 'rgba(37,99,235,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 900, color: '#2563eb' }}>
          {idx}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b', lineHeight: 1.4 }}>
            {q.question ?? '—'}
          </div>
          {q.chapter_title && (
            <span style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 500 }}>{q.chapter_title}</span>
          )}
        </div>
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
            {optionKeys.map(k => {
              const text = opts[k] ?? opts[k.toLowerCase()];
              if (!text) return null;
              const isCorrect = k === answer;
              return (
                <div key={k} className="ev-opt-row">
                  <div className={`ev-opt-key ${isCorrect ? 'correct' : 'normal'}`}>{k}</div>
                  <span style={{ flex: 1, color: isCorrect ? '#059669' : '#334155', fontWeight: isCorrect ? 700 : 400 }}>
                    {text}
                  </span>
                  {isCorrect && <CheckCircle size={13} color="#059669" style={{ flexShrink: 0, marginTop: 2 }} />}
                </div>
              );
            })}
          </div>

          {/* Explanation */}
          {q.explanation && (
            <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 8, background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.12)', fontSize: '0.76rem', color: '#92400e', lineHeight: 1.5 }}>
              <strong>Giải thích:</strong> {q.explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Chapter group ────────────────────────────────────────
const ChapterGroup: FC<{ chapter: IExamChapter; questions: IExamQuestion[]; baseIdx: number }> = ({ chapter, questions, baseIdx }) => (
  <div style={{ marginBottom: 18 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, padding: '7px 12px', borderRadius: 10, background: 'linear-gradient(135deg,rgba(30,58,138,0.07),rgba(37,99,235,0.04))', border: '1px solid rgba(37,99,235,0.1)' }}>
      <BookOpen size={13} color="#1e3a8a" />
      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e3a8a' }}>{chapter.title}</span>
      <span style={{ fontSize: '0.65rem', color: '#64748b', marginLeft: 'auto' }}>{questions.length} câu</span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {questions.map((q, i) => (
        <QuestionCard key={q.id ?? i} q={q} idx={baseIdx + i} delay={i * 0.03} />
      ))}
    </div>
  </div>
);

// ── Main page ────────────────────────────────────────────
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

  // Group questions by chapter
  const grouped = chapters.length > 0
    ? chapters.map(ch => ({
        chapter: ch,
        qs: questions.filter(q => q.chapter_id === ch.id),
      }))
    : [{ chapter: null as IExamChapter | null, qs: questions }];

  let globalIdx = 1;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#f0f4ff 0%,#e8f0fe 40%,#eff6ff 100%)' }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e3a8a)', position: 'sticky', top: 0, zIndex: 20, boxShadow: '0 2px 16px rgba(15,23,42,0.2)' }}>
        <div style={{ maxWidth: 820, margin: '0 auto', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', color: 'white', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
          >
            <ArrowLeft size={13} /> Quay lại
          </button>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <ClipboardList size={15} color="#93c5fd" />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {loading ? 'Đang tải...' : (exam?.ten_mon ?? 'Đề kiểm tra')}
              </div>
              {exam?.ma_mon && (
                <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>{exam.ma_mon}</div>
              )}
            </div>
          </div>

          {exam && (
            <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
              {exam.time_limit && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.68rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                  <Clock size={11} /> {exam.time_limit} phút
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.68rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                <HelpCircle size={11} /> {questions.length} câu
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '20px 16px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="ev-skeleton" style={{ height: 58, animationDelay: `${i*0.07}s` }} />
            ))}
          </div>
        ) : !exam ? (
          <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
            <ClipboardList size={48} color="#bfdbfe" style={{ margin: '0 auto 12px', display: 'block' }} />
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>Không tìm thấy đề kiểm tra</div>
          </div>
        ) : (
          <>
            {/* Info bar */}
            <div className="ev-card" style={{ marginBottom: 18, padding: '14px 16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                {[
                  { label: 'Số câu hỏi', value: questions.length, color: '#1e3a8a' },
                  { label: 'Thời gian',   value: exam.time_limit ? `${exam.time_limit} phút` : '—', color: '#7c3aed' },
                  { label: 'Chương',      value: chapters.length || '—', color: '#059669' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, marginTop: 3 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Questions */}
            {grouped.map(({ chapter, qs }) => {
              const startIdx = globalIdx;
              globalIdx += qs.length;
              return chapter ? (
                <ChapterGroup key={chapter.id} chapter={chapter} questions={qs} baseIdx={startIdx} />
              ) : (
                <div key="no-chapter" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {qs.map((q, i) => (
                    <QuestionCard key={q.id ?? i} q={q} idx={startIdx + i} delay={i * 0.03} />
                  ))}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

export default TeacherExamView;
