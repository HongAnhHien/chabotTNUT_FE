import { type FC } from 'react';
import { ArrowLeft, BookOpen, Hash, Clock, Send } from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import type { IExamChapter } from '@/infra/api/interfaces/IChat';
import { EXAM_TYPE_LABEL, fmtDate } from '../helpers';
import type { ExamDetail } from '../types';

// ── LaTeX ──────────────────────────────────────────────
const _renderKatex = (src: string, display: boolean) => {
  try { return katex.renderToString(src, { throwOnError: false, displayMode: display, output: 'html' }); }
  catch { return src; }
};
const _parseLatex = (text: string) => {
  const chunks: Array<{ t: 'text' | 'inline' | 'display'; c: string }> = [];
  const re = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;
  let last = 0, m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) chunks.push({ t: 'text', c: text.slice(last, m.index) });
    const raw = m[0];
    if (raw.startsWith('$$')) chunks.push({ t: 'display', c: raw.slice(2, -2) });
    else chunks.push({ t: 'inline', c: raw.slice(1, -1) });
    last = m.index + raw.length;
  }
  if (last < text.length) chunks.push({ t: 'text', c: text.slice(last) });
  return chunks;
};
const LT: FC<{ text: string }> = ({ text }) => (
  <span>
    {_parseLatex(text ?? '').map((c, i) =>
      c.t === 'text'
        ? <span key={i}>{c.c}</span>
        : <span key={i} dangerouslySetInnerHTML={{ __html: _renderKatex(c.c, c.t === 'display') }} />
    )}
  </span>
);

const OPT_LETTERS = ['A', 'B', 'C', 'D'];

interface Props {
  exam: ExamDetail | null;
  loading: boolean;
  onBack: () => void;
  onAssign?: () => void;
}

const ExamDetailView: FC<Props> = ({ exam, loading, onBack, onAssign }) => {
  const isConfirmed = exam?.status === 'confirmed';

  const metaItems = exam ? [
    { label: 'Mã môn',    value: exam.ma_mon ?? '—',                           icon: '⌘' },
    { label: 'Số câu',    value: String(exam.question_count ?? '—'),            icon: '≡' },
    { label: 'Thời gian', value: exam.time_limit ? `${exam.time_limit} phút` : '—', icon: '◷' },
    { label: 'Loại đề',   value: EXAM_TYPE_LABEL[exam.exam_type ?? ''] ?? (exam.exam_type ?? '—'), icon: '▤' },
    { label: 'Ngày tạo',  value: fmtDate(exam.created_at),                     icon: '▦' },
  ] : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* Sub header */}
      <div className="ex-sub-header">
        {/* Left: back + divider + title */}
        <div className="ex-sub-left">
          <button onClick={onBack} className="ex-btn outline-gray" style={{ height: 40, padding: '0 15px', flexShrink: 0 }}>
            <ArrowLeft size={16} /> Đề kiểm tra
          </button>
          <div className="ex-sub-divider" />
          <div className="ex-sub-left-text">
            <div className="ex-sub-title">
              {loading ? '...' : (exam?.ten_mon ?? exam?.ma_mon ?? '—')}
            </div>
          </div>
        </div>
        {/* Right: buttons */}
        {onAssign && (
          <div className="ex-sub-right">
            <button onClick={onAssign} className="ex-btn primary" style={{ height: 40, padding: '0 17px' }}>
              <Send size={15} /> Giao bài
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="ex-main-pad" style={{ flex: 1 }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[1, 2, 3].map(i => <div key={i} className="ex-skeleton" style={{ height: 120, animationDelay: `${i * 0.1}s` }} />)}
          </div>
        ) : !exam ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#94a3b8', fontSize: '0.9rem' }}>Không tìm thấy đề.</div>
        ) : (
          <div style={{ animation: 'ex-fade .25s ease' }}>
            <div className="ex-detail-grid">
              {/* Info rail */}
              <div className="ex-detail-rail" style={{ position: 'sticky', top: 24, alignSelf: 'start', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Meta card */}
                <div style={{ background: '#fff', border: '1px solid #e7ecf3', borderRadius: 18, overflow: 'hidden' }}>
                  <div style={{ padding: 22, background: 'linear-gradient(135deg,#eff5ff,#dce9ff)' }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: '#fff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(37,99,235,.15)', marginBottom: 14 }}>
                      <Hash size={26} />
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>
                      {exam.ten_mon || exam.ma_mon || '—'}
                    </div>
                    <div style={{ marginTop: 9, display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                      {exam.exam_type && (
                        <span style={{ fontSize: 11.5, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: '#fff', color: '#2563eb' }}>
                          {EXAM_TYPE_LABEL[exam.exam_type] ?? exam.exam_type}
                        </span>
                      )}
                      {isConfirmed && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: '#ecfdf3', color: '#16a34a' }}>
                          ✓ Đã xác nhận
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ padding: '8px 22px 18px' }}>
                    {metaItems.map(({ label, value, icon }) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '11px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9, fontSize: 13, color: '#64748b', fontWeight: 500 }}>
                          <span style={{ color: '#94a3b8' }}>{icon}</span>{label}
                        </span>
                        <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chapters card */}
                {(exam.chapters ?? []).length > 0 && (
                  <div style={{ background: '#fff', border: '1px solid #e7ecf3', borderRadius: 18, padding: '16px 18px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: .5, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 9 }}>Chương</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                      {(exam.chapters as IExamChapter[]).map(ch => (
                        <div key={ch.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                          <BookOpen size={16} color="#2563eb" style={{ flexShrink: 0, marginTop: 2 }} />
                          <span style={{ fontSize: 13.5, fontWeight: 700, color: '#1d4ed8', lineHeight: 1.4 }}>{ch.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Questions */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Danh sách câu hỏi</div>
                  {exam.question_count != null && (
                    <span style={{ fontSize: 12.5, fontWeight: 700, padding: '3px 11px', borderRadius: 999, background: '#eff5ff', color: '#2563eb' }}>
                      {exam.question_count} câu
                    </span>
                  )}
                  <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: '#16a34a', fontWeight: 600 }}>
                    <span style={{ width: 16, height: 16, borderRadius: 5, background: '#16a34a', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 800 }}>✓</span>
                    Đáp án đúng
                  </span>
                </div>

                {(exam.questions ?? []).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8', fontSize: 13.5 }}>
                    <Clock size={36} color="#e2e8f0" style={{ display: 'block', margin: '0 auto 10px' }} />
                    Chưa có câu hỏi
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {(exam.questions ?? []).map((q, i) => (
                      <div key={i} style={{ background: '#fff', border: '1px solid #e7ecf3', borderRadius: 16, padding: '18px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 13, marginBottom: 14 }}>
                          <span style={{ width: 32, height: 32, borderRadius: 10, background: '#2563eb', color: '#fff', fontSize: 13.5, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {i + 1}
                          </span>
                          <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', lineHeight: 1.55, paddingTop: 4 }}>
                            <LT text={q.question ?? ''} />
                          </div>
                        </div>
                        {q.options && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, paddingLeft: 45 }}>
                            {Object.entries(q.options).map(([key, val], idx) => {
                              const correct = key === q.answer;
                              const letter = OPT_LETTERS[idx] ?? key;
                              return (
                                <div key={key} style={{
                                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 15px',
                                  borderRadius: 12, border: `1px solid ${correct ? '#bbf7d0' : '#eef2f7'}`,
                                  background: correct ? '#f0fdf4' : '#f8fafc',
                                }}>
                                  <span style={{ width: 27, height: 27, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 800, color: '#fff', background: correct ? '#16a34a' : '#94a3b8' }}>
                                    {letter}
                                  </span>
                                  <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: correct ? 700 : 500, color: correct ? '#166534' : '#334155', lineHeight: 1.45 }}>
                                    <LT text={val as string} />
                                  </span>
                                  {correct && (
                                    <span style={{ marginLeft: 'auto', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: '#16a34a' }}>
                                      Đúng ✓
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {q.explanation && (
                          <div style={{ paddingLeft: 45, marginTop: 8, fontSize: 13, color: '#64748b', fontStyle: 'italic' }}>
                            💡 <LT text={q.explanation} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamDetailView;
