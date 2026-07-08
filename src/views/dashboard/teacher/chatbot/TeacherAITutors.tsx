import { type FC, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { BookOpen, X, RotateCcw, CheckCircle, Loader2, ClipboardList, Menu, ChevronUp, ChevronDown, GripVertical, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

import ChatHistory from './ChatHistory';
import ChatContent from './ChatContent';
import ChatInput from './ChatInput';
import type { ChatMessage } from './types';


import ChatApi from '@/infra/chat/chat_api';
import TeacherApi from '@/infra/teacher/teacher_api';
import type { IChatSession, IExamDetail, IExamQuestion as IQ, IChatHistoryMessage } from '@/infra/api/interfaces/IChat';
import type { ITeacherSubjectWithClasses, ISemester } from '@/infra/api/interfaces/ITeacher';

// ── CSS ───────────────────────────────────────────────
const CSS = `
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes blink { 50% { opacity:0 } }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
@keyframes slideInRight { from { transform: translateX(100%); opacity:0 } to { transform: translateX(0); opacity:1 } }
@keyframes slideOutRight { from { transform: translateX(0); opacity:1 } to { transform: translateX(100%); opacity:0 } }
@keyframes fadeIn { from{opacity:0} to{opacity:1} }
@keyframes fadeOut { from{opacity:1} to{opacity:0} }
.tai-nav-btn { display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;border:1px solid rgba(0,0,0,0.08);background:transparent;color:#64748b;cursor:pointer;transition:background .15s,color .15s; }
.tai-nav-btn:hover { background:rgba(0,0,0,0.05);color:#0f172a; }
.tai-nav-logout { display:flex;align-items:center;gap:5px;padding:5px 10px;border-radius:8px;border:1px solid rgba(0,0,0,0.08);background:transparent;color:#64748b;font-size:.78rem;font-weight:500;cursor:pointer;transition:background .15s,color .15s; }
.tai-nav-logout:hover { background:rgba(220,38,38,0.06);color:#dc2626;border-color:rgba(220,38,38,0.2); }
.tai-subject-card { padding:10px 12px;border-radius:10px;border:1.5px solid rgba(37,99,235,0.1);background:white;cursor:pointer;transition:border .15s,background .15s; }
.tai-subject-card:hover { border-color:rgba(37,99,235,0.35);background:rgba(37,99,235,0.03); }
.tai-subject-card.selected { border-color:#2563eb;background:rgba(37,99,235,0.05); }

/* ── Responsive sidebar ── */
.tai-sidebar {
  flex-shrink:0; width:240px; height:100%;
  position:absolute; left:-240px; z-index:45;
  transition:left .22s cubic-bezier(.34,1.2,.64,1), width .2s ease;
}
.tai-sidebar.open { left:0; }
.tai-sidebar.collapsed { width:96px; left:-96px; }
.tai-sidebar.collapsed.open { left:0; }
.tai-hamburger {
  display:flex; align-items:center; justify-content:center;
  width:34px; height:34px; border-radius:8px; flex-shrink:0;
  background:rgba(30,58,138,0.06); border:1px solid rgba(30,58,138,0.12);
  color:#1e3a8a; cursor:pointer;
}
@media (min-width:768px) {
  .tai-sidebar { position:relative !important; left:0 !important; z-index:1 !important; }
  .tai-hamburger { display:none !important; }
}
`;

// ── Exam preview drawer ───────────────────────────────
interface EditableQ {
  id?: number;
  chapter_title?: string;
  question: string;
  options?: Record<string, string>;
  answer?: string;
}

interface ExamPreviewProps {
  exam: IExamDetail | null;
  loading: boolean;
  closing: boolean;
  sessionId: string;
  subjectId: string;
  onClose: () => void;
  onConfirmed: () => void;
}

const TIME_LIMIT_OPTIONS = [15, 30] as const;

const toEditable = (qs: IQ[]): EditableQ[] =>
  qs.map(q => ({
    id: q.id,
    chapter_title: q.chapter_title,
    question: q.question ?? '',
    options: q.options,
    answer: q.answer,
  }));

const ExamPreviewDrawer: FC<ExamPreviewProps> = ({ exam, loading, closing, sessionId, subjectId, onClose, onConfirmed }) => {
  const [timeLimit,  setTimeLimit]  = useState<15 | 30>(exam?.time_limit === 15 ? 15 : 30);
  const [editableQs, setEditableQs] = useState<EditableQ[]>(toEditable(exam?.questions ?? []));
  const [confirming, setConfirming] = useState(false);

  // Dữ liệu đề đến sau (drawer đã mở sẵn trong lúc chờ) — đồng bộ lại state chỉnh sửa ngay trong render
  // khi `exam` đổi từ null sang dữ liệu thật, thay vì dùng effect (tránh set-state-in-effect).
  const [syncedExam, setSyncedExam] = useState(exam);
  if (exam !== syncedExam) {
    setSyncedExam(exam);
    if (exam) {
      setTimeLimit(exam.time_limit === 15 ? 15 : 30);
      setEditableQs(toEditable(exam.questions ?? []));
    }
  }

  const reset = () => {
    if (!exam) return;
    setTimeLimit(exam.time_limit === 15 ? 15 : 30);
    setEditableQs(toEditable(exam.questions ?? []));
  };

  // Di chuyển nội dung 1 đáp án tới vị trí bất kỳ (kéo-thả hoặc nút mũi tên) —
  // nhãn A/B/C/D giữ nguyên vị trí cố định, chỉ nội dung + đáp án đúng đi theo.
  const reorderOption = (qIndex: number, fromKey: string, toKey: string) => {
    if (fromKey === toKey) return;
    setEditableQs(prev => prev.map((q, j) => {
      if (j !== qIndex || !q.options) return q;
      const keys = Object.keys(q.options);
      const values = keys.map(k => q.options![k]);
      const fromIdx = keys.indexOf(fromKey);
      const toIdx = keys.indexOf(toKey);
      if (fromIdx === -1 || toIdx === -1) return q;
      const answerIdx = q.answer ? keys.indexOf(q.answer) : -1;

      const newValues = [...values];
      const [moved] = newValues.splice(fromIdx, 1);
      newValues.splice(toIdx, 0, moved);

      const newOptions: Record<string, string> = {};
      keys.forEach((k, idx) => { newOptions[k] = newValues[idx]; });

      let newAnswer = q.answer;
      if (answerIdx !== -1) {
        // Theo dõi đáp án đúng theo vị trí gốc di chuyển cùng nội dung
        const order = keys.map((_, idx) => idx);
        const [movedIdx] = order.splice(fromIdx, 1);
        order.splice(toIdx, 0, movedIdx);
        newAnswer = keys[order.indexOf(answerIdx)];
      }
      return { ...q, options: newOptions, answer: newAnswer };
    }));
  };

  const moveOption = (qIndex: number, fromKey: string, dir: -1 | 1) => {
    const q = editableQs[qIndex];
    if (!q.options) return;
    const keys = Object.keys(q.options);
    const fromIdx = keys.indexOf(fromKey);
    const toIdx = fromIdx + dir;
    if (toIdx < 0 || toIdx >= keys.length) return;
    reorderOption(qIndex, fromKey, keys[toIdx]);
  };

  const [dragOpt, setDragOpt] = useState<{ qIndex: number; key: string } | null>(null);

  const handleConfirm = async () => {
    if (!exam?.exam_id) return;
    setConfirming(true);
    try {
      const r = await ChatApi.confirmExam(exam.ma_mon ?? subjectId, {
        exam_id:        exam.exam_id,
        session_id:     exam.session_id ?? sessionId,
        exam_type:      exam.exam_type,
        time_limit:     timeLimit,
        question_count: editableQs.length,
        chapters:       exam.chapters,
        questions:      editableQs.map((q, i) => ({
          ...((exam.questions ?? [])[i] ?? {}),
          question: q.question,
          options:  q.options,
          answer:   q.answer,
        })),
      });
      if (r.success) {
        toast.success('Đã lưu đề kiểm tra!');
        onConfirmed();
        onClose();
      } else {
        toast.error(r.message ?? 'Lưu thất bại.');
      }
    } catch {
      toast.error('Lưu thất bại. Vui lòng thử lại.');
    } finally {
      setConfirming(false);
    }
  };

  const isLoading = loading || !exam;

  return (
    <div style={{
      flexShrink: 0, width: 'min(480px, 100vw)', height: '100%', background: '#f7f8fa',
      display: 'flex', flexDirection: 'column',
      animation: `${closing ? 'slideOutRight .24s ease both' : 'slideInRight .28s cubic-bezier(.34,1.2,.64,1) both'}`,
      boxShadow: '-4px 0 32px rgba(15,23,42,0.15)',
      borderLeft: '1px solid #e2e8f0',
    }}>
        {/* Header */}
        <div style={{ padding: '14px 18px 12px', background: '#2968ED', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                <ClipboardList size={13} color="white" />
                <span style={{ fontSize: '0.63rem', color: 'white', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Preview đề kiểm tra</span>
              </div>
              <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'white' }}>{isLoading ? 'Đang tải đề...' : (exam.ten_mon || subjectId)}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: '0.65rem', color: 'white', background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '1px 8px' }}>{exam?.ma_mon ?? subjectId}</span>
                {!isLoading && <span style={{ fontSize: '0.65rem', color: 'white', background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '1px 8px' }}>{editableQs.length} câu</span>}
                {!isLoading && <span style={{ fontSize: '0.65rem', color: 'white', background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '1px 8px' }}>{timeLimit} phút</span>}
              </div>
            </div>
            <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Loading state — chờ dữ liệu đề */}
        {isLoading && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <Loader2 size={26} color="#2968ED" style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>Đang tải đề kiểm tra...</span>
          </div>
        )}

        {/* Editable fields */}
        {!isLoading && exam && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Time limit — chỉ 2 lựa chọn */}
          <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap' }}>Thời gian làm bài</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {TIME_LIMIT_OPTIONS.map(t => (
                <button
                  key={t}
                  onClick={() => setTimeLimit(t)}
                  style={{
                    padding: '6px 14px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                    border: `1.5px solid ${timeLimit === t ? '#334155' : '#e2e8f0'}`,
                    background: timeLimit === t ? '#334155' : 'white',
                    color: timeLimit === t ? 'white' : '#64748b',
                  }}
                >
                  {t} phút
                </button>
              ))}
            </div>
          </div>

          {/* Chapters */}
          {(exam.chapters ?? []).length > 0 && (
            <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', padding: '10px 14px' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', marginBottom: 6 }}>Chương</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {(exam.chapters ?? []).map(ch => (
                  <span key={ch.id} style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', background: '#f1f5f9', borderRadius: 20, padding: '2px 10px', border: '1px solid #e2e8f0' }}>{ch.title}</span>
                ))}
              </div>
            </div>
          )}

          {/* Questions */}
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: 8 }}>Câu hỏi — có thể chỉnh sửa toàn bộ nội dung</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {editableQs.map((q, i) => (
                <div key={i} style={{ background: 'white', borderRadius: 11, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  {/* Question header */}
                  <div style={{ padding: '6px 12px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#334155' }}>Câu {i + 1}</span>
                    {q.chapter_title && <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>{q.chapter_title}</span>}
                  </div>

                  {/* Editable question text */}
                  <div style={{ padding: '2px 12px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#94a3b8', paddingTop: 7, marginBottom: 3 }}>NỘI DUNG CÂU HỎI</div>
                    <textarea
                      value={q.question}
                      onChange={e => setEditableQs(prev => prev.map((x, j) => j === i ? { ...x, question: e.target.value } : x))}
                      rows={3}
                      style={{ width: '100%', padding: '4px 0 8px', border: 'none', outline: 'none', fontSize: '0.82rem', color: '#1e293b', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.55, background: 'transparent' }}
                    />
                  </div>

                  {/* Options — fully editable + click to set answer + đổi vị trí */}
                  {q.options && Object.keys(q.options).length > 0 && (
                    <div style={{ padding: '8px 12px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#94a3b8', marginBottom: 2 }}>ĐÁP ÁN — kéo thả (hoặc dùng mũi tên) để đổi vị trí, click ký hiệu để chọn đáp án đúng</div>
                      {Object.entries(q.options).map(([key, val], optIdx, arr) => {
                        const isAnswer = key === q.answer;
                        const isDragging = dragOpt?.qIndex === i && dragOpt.key === key;
                        return (
                          <div
                            key={key}
                            draggable
                            onDragStart={() => setDragOpt({ qIndex: i, key })}
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => {
                              e.preventDefault();
                              if (dragOpt && dragOpt.qIndex === i) reorderOption(i, dragOpt.key, key);
                              setDragOpt(null);
                            }}
                            onDragEnd={() => setDragOpt(null)}
                            style={{ display: 'flex', alignItems: 'flex-start', gap: 7, padding: '5px 8px', borderRadius: 8, background: isAnswer ? '#f0fdf4' : '#f8fafc', border: `1.5px solid ${isAnswer ? '#bbf7d0' : '#eef2f7'}`, opacity: isDragging ? 0.4 : 1, transition: 'opacity .12s' }}
                          >
                            {/* Drag handle */}
                            <span
                              title="Kéo để đổi vị trí"
                              style={{ flexShrink: 0, width: 14, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', cursor: 'grab', touchAction: 'none' }}
                            >
                              <GripVertical size={13} />
                            </span>
                            {/* Click to set answer */}
                            <button
                              onClick={() => setEditableQs(prev => prev.map((x, j) => j === i ? { ...x, answer: key } : x))}
                              title={isAnswer ? 'Đang là đáp án đúng' : 'Chọn làm đáp án đúng'}
                              style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '50%', background: isAnswer ? '#16a34a' : '#94a3b8', color: 'white', fontSize: '0.65rem', fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .12s' }}
                            >
                              {isAnswer ? '✓' : key}
                            </button>
                            {/* Editable option text */}
                            <input
                              value={val}
                              onChange={e => setEditableQs(prev => prev.map((x, j) => {
                                if (j !== i || !x.options) return x;
                                return { ...x, options: { ...x.options, [key]: e.target.value } };
                              }))}
                              style={{ flex: 1, border: 'none', outline: 'none', fontSize: '0.8rem', color: isAnswer ? '#15803d' : '#334155', fontWeight: isAnswer ? 600 : 400, background: 'transparent', fontFamily: 'inherit', padding: '1px 0' }}
                            />
                            {isAnswer && (
                              <span style={{ fontSize: '0.6rem', color: '#15803d', fontWeight: 800, whiteSpace: 'nowrap', alignSelf: 'center' }}>Đáp án đúng</span>
                            )}
                            {/* Move up/down */}
                            <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                              <button
                                onClick={() => moveOption(i, key, -1)}
                                disabled={optIdx === 0}
                                title="Di chuyển lên"
                                style={{ width: 18, height: 15, border: 'none', background: 'none', color: optIdx === 0 ? '#e2e8f0' : '#64748b', cursor: optIdx === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                              >
                                <ChevronUp size={13} />
                              </button>
                              <button
                                onClick={() => moveOption(i, key, 1)}
                                disabled={optIdx === arr.length - 1}
                                title="Di chuyển xuống"
                                style={{ width: 18, height: 15, border: 'none', background: 'none', color: optIdx === arr.length - 1 ? '#e2e8f0' : '#64748b', cursor: optIdx === arr.length - 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                              >
                                <ChevronDown size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        )}

        {/* Footer actions */}
        <div style={{ flexShrink: 0, padding: '10px 14px', borderTop: '1px solid #e2e8f0', background: 'white', display: 'flex', gap: 8 }}>
          <button
            onClick={reset}
            disabled={isLoading}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', borderRadius: 10, background: 'white', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.82rem', fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.6 : 1 }}
          >
            <RotateCcw size={13} /> Reset
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirming || isLoading}
            style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', borderRadius: 10, background: '#16a34a', border: 'none', color: 'white', fontSize: '0.82rem', fontWeight: 700, cursor: (confirming || isLoading) ? 'not-allowed' : 'pointer', opacity: (confirming || isLoading) ? 0.6 : 1 }}
          >
            {confirming ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={13} />}
            {confirming ? 'Đang lưu...' : 'Xác nhận & Lưu'}
          </button>
        </div>
    </div>
  );
};

// ── Subject picker modal ──────────────────────────────
interface SubjectPickerProps {
  courses: ITeacherSubjectWithClasses[];
  loading: boolean;
  onSelect: (maMon: string) => void;
  onClose: () => void;
  semesters: ISemester[];
  currentHocKy: number | null;
  selectedHocKy: number | null;
  onSelectSemester: (hocKy: number) => void;
}

const SubjectPicker: FC<SubjectPickerProps> = ({ courses, loading, onSelect, onClose, semesters, currentHocKy, selectedHocKy, onSelectSemester }) => {
  const [semDropOpen, setSemDropOpen] = useState(false);
  const semDropRef = useRef<HTMLDivElement>(null);
  const selectedSem = semesters.find(s => s.hoc_ky === selectedHocKy);

  useEffect(() => {
    if (!semDropOpen) return;
    const handler = (e: MouseEvent) => {
      if (!semDropRef.current?.contains(e.target as Node)) setSemDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [semDropOpen]);

  return (
  <>
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', animation: 'fadeIn .18s ease both' }} />
    <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 301, width: 'min(480px,92vw)', background: 'white', borderRadius: 18, boxShadow: '0 20px 60px rgba(15,23,42,0.25)', animation: 'fadeIn .22s ease both', display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}>
      <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid rgba(37,99,235,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e293b' }}>Chọn môn học</div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>Chat sẽ gắn với môn học này</div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', flexShrink: 0 }}>
            <X size={13} />
          </button>
        </div>

        {/* Semester dropdown — hiện khi có danh sách học kỳ (kể cả khi API không trả kỳ hiện tại) */}
        {semesters.length > 0 && (
          <div ref={semDropRef} style={{ position: 'relative', marginTop: 10 }}>
            <button
              onClick={() => setSemDropOpen(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 12px', borderRadius: 20, background: 'white', border: '1.5px solid rgba(37,99,235,0.18)', cursor: 'pointer' }}
            >
              <Calendar size={12} color="#2563eb" />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap' }}>
                {selectedSem?.ten_hoc_ky ?? 'Chọn học kỳ'}
              </span>
              {selectedSem && selectedSem.hoc_ky === currentHocKy && (
                <span style={{ fontSize: '0.58rem', fontWeight: 700, color: '#059669', background: 'rgba(5,150,105,0.1)', borderRadius: 20, padding: '2px 7px', whiteSpace: 'nowrap' }}>
                  Hiện tại
                </span>
              )}
              <ChevronDown size={12} color="#64748b" style={{ transition: 'transform .2s', transform: semDropOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            </button>

            {semDropOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 310, minWidth: 220, background: 'white', borderRadius: 12, boxShadow: '0 8px 30px rgba(30,58,138,0.15)', maxHeight: 220, overflowY: 'auto', padding: 4 }}>
                {semesters.map(s => (
                  <button
                    key={s.hoc_ky}
                    onClick={() => { onSelectSemester(s.hoc_ky); setSemDropOpen(false); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '8px 12px', background: s.hoc_ky === selectedHocKy ? 'rgba(37,99,235,0.05)' : 'none', border: 'none', borderRadius: 8, cursor: 'pointer', textAlign: 'left' }}
                  >
                    <div style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: s.hoc_ky === selectedHocKy ? '#2563eb' : s.hoc_ky === currentHocKy ? '#22c55e' : '#e2e8f0' }} />
                    <span style={{ flex: 1, fontSize: '0.78rem', fontWeight: s.hoc_ky === selectedHocKy ? 700 : 500, color: s.hoc_ky === selectedHocKy ? '#1e3a8a' : '#334155' }}>
                      {s.ten_hoc_ky}
                    </span>
                    {s.hoc_ky === currentHocKy && (
                      <span style={{ fontSize: '0.58rem', fontWeight: 700, color: '#059669', background: 'rgba(5,150,105,0.09)', borderRadius: 20, padding: '1px 7px' }}>
                        Hiện tại
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 7 }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <Loader2 size={24} color="#2563eb" style={{ margin: '0 auto', display: 'block', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : courses.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', fontSize: '0.82rem', color: '#94a3b8' }}>Không có môn học nào.</div>
        ) : courses.map(({ subject }) => (
          <div key={subject.ma_mon} className="tai-subject-card" onClick={() => onSelect(subject.ma_mon)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(37,99,235,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <BookOpen size={16} color="#2563eb" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>{subject.ten_mon}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                  <span style={{ fontSize: '0.65rem', color: '#2563eb', fontWeight: 700, background: 'rgba(37,99,235,0.07)', borderRadius: 20, padding: '1px 7px' }}>{subject.ma_mon}</span>
                  {subject.so_tc !== '0' && <span style={{ fontSize: '0.65rem', color: '#059669', fontWeight: 600 }}>{subject.so_tc} TC</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </>
  );
};

// ── Main component ────────────────────────────────────
const TeacherAITutors: FC = () => {
  const navigate             = useNavigate();
  const { sessionId: urlSessionId } = useParams<{ sessionId?: string }>();

  // Sessions
  const [sessions,         setSessions]         = useState<IChatSession[]>([]);
  const [currentSession,   setCurrentSession]   = useState<IChatSession | null>(null);
  const [loadingSessions,  setLoadingSessions]  = useState(true);

  // Messages
  const [messages,  setMessages]  = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);

  // Subject picker
  const [showPicker,  setShowPicker]  = useState(false);
  const [courses,     setCourses]     = useState<ITeacherSubjectWithClasses[]>([]);
  const [loadingCrs,  setLoadingCrs]  = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);

  // Semester (dùng khi chọn môn học cho chat mới) — hoc_ky_hien_tai có thể null từ API
  const [semesters,     setSemesters]     = useState<ISemester[]>([]);
  const [currentHocKy,  setCurrentHocKy]  = useState<number | null>(null);
  const [selectedHocKy, setSelectedHocKy] = useState<number | null>(null);

  // Sidebar mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Preview drawer
  const [previewExam,     setPreviewExam]     = useState<IExamDetail | null>(null);
  const [previewMsgId,    setPreviewMsgId]    = useState<string | null>(null);
  const [previewSubject,  setPreviewSubject]  = useState('');
  const [previewSession,  setPreviewSession]  = useState('');
  const [loadingPreview,  setLoadingPreview]  = useState(false);
  const [previewVisible,  setPreviewVisible]  = useState(false);
  const [previewClosing,  setPreviewClosing]  = useState(false);


  // Dựng lại 1 message từ lịch sử — khôi phục examMeta nếu backend có trả intent/exam_id,
  // để nút Xác nhận/Xem đề không bị mất khi reload trang hoặc chuyển qua lại giữa các session.
  const toChatMessage = useCallback((m: IChatHistoryMessage, i: number, sess: IChatSession): ChatMessage => {
    const isExam = m.role === 'assistant' && (m.intent === 'exam_generate' || m.intent === 'exam_edit');
    return {
      id: `hist-${i}-${m.role}`,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
      examMeta: isExam && m.exam_id
        ? {
            examId: m.exam_id,
            sessionId: sess.id,
            subjectId: sess.subject_id ?? '',
            confirmed: !!m.saved_exam_id,
            savedExamId: m.saved_exam_id,
          }
        : undefined,
    };
  }, []);

  // ── Load sessions + auto-restore từ URL ─────────────
  // Không set loadingSessions(true) ở đây: state đã khởi tạo true cho lần load đầu (mount effect),
  // còn lần gọi lại sau khi tạo session mới đã có creatingSession phủ trạng thái loading rồi —
  // tránh gọi setState đồng bộ ngay trong effect (react-hooks/set-state-in-effect).
  const loadSessions = useCallback(async () => {
    try {
      const r = await ChatApi.getSessions();
      const list = r.sessions ?? [];
      setSessions(list);
      // Restore session từ URL (reload trang / back từ exam)
      if (urlSessionId) {
        const found = list.find(s => s.id === urlSessionId);
        if (found) {
          setCurrentSession(found);
          const hist = await ChatApi.getSessionHistory(found.id);
          const msgs: ChatMessage[] = (hist.messages ?? []).map((m, i) => toChatMessage(m, i, found));
          setMessages(msgs);
        }
      }
    } catch {
      // silently fail
    } finally {
      setLoadingSessions(false);
    }
  }, [urlSessionId, toChatMessage]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSessions();
  }, [loadSessions]);

  // ── Load courses for picker ──────────────────────────
  // hoc_ky_hien_tai có thể null (API không xác định được kỳ hiện tại) → fallback
  // sang kỳ đầu tiên trong ds_hoc_ky, đồng thời hiện dropdown chọn kỳ trong SubjectPicker.
  const loadCoursesForSemester = useCallback(async (hocKy: number) => {
    setLoadingCrs(true);
    try {
      const crsRes = await TeacherApi.getSemesterCourses(hocKy);
      setCourses(crsRes.data);
    } catch {
      setCourses([]);
    } finally {
      setLoadingCrs(false);
    }
  }, []);

  const loadCourses = useCallback(async () => {
    setLoadingCrs(true);
    try {
      const semRes = await TeacherApi.getSemesters();
      const list    = semRes.data.ds_hoc_ky;
      const current = semRes.data.hoc_ky_hien_tai;
      const initialHocKy = current ?? list[0]?.hoc_ky ?? null;

      setSemesters(list);
      setCurrentHocKy(current);
      setSelectedHocKy(initialHocKy);

      if (initialHocKy) {
        const crsRes = await TeacherApi.getSemesterCourses(initialHocKy);
        setCourses(crsRes.data);
      } else {
        setCourses([]);
      }
    } catch {
      setCourses([]);
    } finally {
      setLoadingCrs(false);
    }
  }, []);

  const handleSelectSemester = (hocKy: number) => {
    setSelectedHocKy(hocKy);
    loadCoursesForSemester(hocKy);
  };

  const handleNewChat = () => {
    if (courses.length === 0) loadCourses();
    setShowPicker(true);
  };

  // ── Create session ───────────────────────────────────
  const handlePickSubject = async (maMon: string) => {
    setShowPicker(false);
    setCreatingSession(true);
    try {
      const r = await ChatApi.createSession(maMon);
      await loadSessions();
      // Find and select the new session
      const allRes = await ChatApi.getSessions();
      const sess = (allRes.sessions ?? []).find(s => s.id === r.session_id);
      if (sess) {
        handleSelectSession(sess);
      } else {
        // Fallback: create a fake session object
        const fake: IChatSession = { id: r.session_id, name: maMon, subject_id: maMon };
        navigate(`/teacher/chat/${r.session_id}`, { replace: true });
        setCurrentSession(fake);
        setMessages([]);
      }
    } catch {
      toast.error('Không thể tạo cuộc trò chuyện.');
    } finally {
      setCreatingSession(false);
    }
  };

  // ── Select session ───────────────────────────────────
  const handleSelectSession = async (sess: IChatSession) => {
    if (sess.id === currentSession?.id) return;
    navigate(`/teacher/chat/${sess.id}`, { replace: true });
    setCurrentSession(sess);
    setSidebarOpen(false);
    setStreaming(false);
    setMessages([]);
    try {
      const r = await ChatApi.getSessionHistory(sess.id);
      const msgs: ChatMessage[] = (r.messages ?? []).map((m, i) => toChatMessage(m, i, sess));
      setMessages(msgs);
    } catch {
      setMessages([]);
    }
  };

  // ── Delete session ───────────────────────────────────
  const handleDeleteSession = async (id: string) => {
    if (!confirm('Xóa cuộc trò chuyện này?')) return;
    const prevSessions = sessions;
    const wasCurrent = currentSession?.id === id;

    // Optimistic update — rollback nếu API lỗi
    setSessions(prev => prev.filter(s => s.id !== id));
    if (wasCurrent) {
      setCurrentSession(null);
      setMessages([]);
      navigate('/teacher/chat', { replace: true });
    }

    try {
      const res = await ChatApi.deleteSession(id);
      if (!res.success) throw new Error(res.message ?? 'Xóa thất bại');
    } catch {
      toast.error('Không thể xóa cuộc trò chuyện. Vui lòng thử lại.');
      setSessions(prevSessions);
    }
  };

  // ── Send message (SSE) ───────────────────────────────
  const handleSend = async (text: string) => {
    if (!currentSession || streaming) return;

    const userMsgId = `user-${Date.now()}`;
    const botMsgId  = `bot-${Date.now()}`;
    const subjectId = currentSession.subject_id ?? '';

    setMessages(prev => [
      ...prev,
      { id: userMsgId, role: 'user', content: text, timestamp: new Date() },
      { id: botMsgId,  role: 'assistant', content: '', timestamp: new Date(), isStreaming: true },
    ]);
    setStreaming(true);

    let accumulated = '';

    try {
      await ChatApi.streamChat(
        currentSession.id,
        subjectId,
        text,
        {
          onChunk: chunk => {
            accumulated += chunk;
            setMessages(prev => prev.map(m =>
              m.id === botMsgId ? { ...m, content: accumulated } : m
            ));
          },
          onDone: done => {
            const isExam = done.intent === 'exam_generate' || done.intent === 'exam_edit';
            const examId = done.exam_id;
            setMessages(prev => prev.map(m =>
              m.id === botMsgId
                ? {
                    ...m,
                    content: accumulated,
                    isStreaming: false,
                    examMeta: isExam && examId
                      ? { examId, sessionId: currentSession.id, subjectId }
                      : undefined,
                  }
                : m
            ));
          },
          onError: err => {
            toast.error('Lỗi kết nối: ' + err.message);
            setMessages(prev => prev.map(m =>
              m.id === botMsgId ? { ...m, content: accumulated || 'Đã xảy ra lỗi.', isStreaming: false } : m
            ));
          },
        }
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể kết nối đến chatbot.';
      toast.error(msg);
      setMessages(prev => prev.map(m =>
        m.id === botMsgId ? { ...m, content: accumulated || 'Đã xảy ra lỗi.', isStreaming: false } : m
      ));
    } finally {
      setStreaming(false);
    }
  };

  // ── Exam actions ─────────────────────────────────────
  const handleExamDismiss = (msgId: string) => {
    setMessages(prev => prev.map(m =>
      m.id === msgId && m.examMeta ? { ...m, examMeta: { ...m.examMeta, dismissed: true } } : m
    ));
  };

  const handleExamConfirm = async (msgId: string) => {
    const msg = messages.find(m => m.id === msgId);
    if (!msg?.examMeta) return;
    // Mark loading state on the message
    setMessages(prev => prev.map(m =>
      m.id === msgId ? { ...m, isStreaming: true } : m
    ));
    try {
      // Must fetch exam detail first to get session_id and ma_mon from the server
      const examRes = await ChatApi.getExam(msg.examMeta.examId);
      if (!examRes.exam) { toast.error('Không tìm thấy đề kiểm tra.'); return; }
      const exam = examRes.exam;

      const r = await ChatApi.confirmExam(exam.ma_mon ?? msg.examMeta.subjectId, {
        exam_id:        exam.exam_id!,
        session_id:     exam.session_id ?? msg.examMeta.sessionId,
        exam_type:      exam.exam_type,
        time_limit:     exam.time_limit,
        question_count: exam.question_count,
        chapters:       exam.chapters,
        questions:      exam.questions,
      });
      if (r.success) {
        toast.success('Đã lưu đề kiểm tra!');
        const savedId = r.data?.id;
        setMessages(prev => prev.map(m =>
          m.id === msgId && m.examMeta ? { ...m, isStreaming: false, examMeta: { ...m.examMeta, confirmed: true, savedExamId: savedId } } : m
        ));
        // Gửi "xác nhận" vào chat để bot phản hồi
        handleSend('xác nhận');
      } else {
        toast.error(r.message ?? 'Lưu thất bại.');
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isStreaming: false } : m));
      }
    } catch {
      toast.error('Lưu thất bại. Vui lòng thử lại.');
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isStreaming: false } : m));
    }
  };

  const handleExamPreview = async (msgId: string) => {
    const msg = messages.find(m => m.id === msgId);
    if (!msg?.examMeta) return;
    // Mở drawer ngay lập tức, loading sẽ hiện bên trong khi chờ dữ liệu
    setPreviewMsgId(msgId);
    setPreviewSubject(msg.examMeta.subjectId);
    setPreviewSession(msg.examMeta.sessionId);
    setPreviewExam(null);
    setPreviewClosing(false);
    setPreviewVisible(true);
    setLoadingPreview(true);
    try {
      const r = await ChatApi.getExam(msg.examMeta.examId);
      // Fallback: nếu API không trả đề, vẫn mở với dữ liệu tối thiểu để xác nhận được
      setPreviewExam(r.exam ?? { exam_id: msg.examMeta.examId });
    } catch {
      toast.error('Không thể tải chi tiết đề.');
      setPreviewExam({ exam_id: msg.examMeta.examId });
    } finally {
      setLoadingPreview(false);
    }
  };

  const closePreview = () => {
    setPreviewClosing(true);
    setTimeout(() => {
      setPreviewVisible(false);
      setPreviewClosing(false);
      setPreviewExam(null);
      setPreviewMsgId(null);
    }, 240);
  };

  const handlePreviewConfirmed = () => {
    if (previewMsgId) {
      setMessages(prev => prev.map(m =>
        m.id === previewMsgId && m.examMeta ? { ...m, examMeta: { ...m.examMeta, confirmed: true } } : m
      ));
    }
    closePreview();
    // Gửi "xác nhận" vào chat để bot phản hồi
    handleSend('xác nhận');
  };

  const currentSubjectLabel = (() => {
    if (!currentSession?.subject_id) return '';
    const subject = courses.find(c => c.subject.ma_mon === currentSession.subject_id)?.subject;
    return subject ? `${subject.ten_mon} (${subject.ma_mon})` : currentSession.subject_id;
  })();

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', fontFamily: "'Be Vietnam Pro',system-ui,sans-serif", background: '#f0f4ff', overflow: 'hidden' }}>
      <style>{CSS}</style>

      {/* ── BODY ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)}
            style={{ position: 'absolute', inset: 0, zIndex: 40, background: 'rgba(15,23,42,0.35)', backdropFilter: 'blur(2px)' }} />
        )}

        {/* Dim overlay over sidebar + chat area while exam preview drawer is open */}
        {previewVisible && (
          <div
            onClick={closePreview}
            style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 'min(480px, 100vw)', zIndex: 30, background: 'rgba(15,23,42,0.3)', backdropFilter: 'blur(1.5px)', animation: `${previewClosing ? 'fadeOut' : 'fadeIn'} .22s ease both` }}
          />
        )}

        {/* ── Sidebar ── */}
        <div className={`tai-sidebar${sidebarOpen ? ' open' : ''}${sidebarCollapsed && !isMobile ? ' collapsed' : ''}`}>
          <ChatHistory
            sessions={sessions}
            currentSessionId={currentSession?.id ?? ''}
            onSelectSession={id => {
              const sess = sessions.find(s => s.id === id);
              if (sess) handleSelectSession(sess);
            }}
            onNewChat={handleNewChat}
            onDeleteSession={handleDeleteSession}
            isLoading={loadingSessions || creatingSession}
            collapsed={sidebarCollapsed && !isMobile}
            onToggleCollapse={isMobile ? undefined : () => setSidebarCollapsed(v => !v)}
          />
        </div>

        {/* ── Chat area ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f4f6fb', minWidth: 0, position: 'relative' }}>
          {/* Topbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'white', borderBottom: '1px solid #eef0f5', flexShrink: 0 }}>
            <button className="tai-hamburger" onClick={() => setSidebarOpen(v => !v)} title="Danh sách chat">
              <Menu size={16} />
            </button>
            {currentSession ? (
              <>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#6d28d9,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(109,40,217,0.25)' }}>
                  <BookOpen size={18} color="white" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {currentSession.name || 'Cuộc trò chuyện'}
                  </div>
                  {currentSubjectLabel && (
                    <div style={{ fontSize: '0.65rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                      {currentSubjectLabel}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <span style={{ flex: 1, fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8' }}>Chọn hoặc tạo cuộc trò chuyện</span>
            )}
          </div>

          {currentSession ? (
            <>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <ChatContent
                  messages={messages}
                  isStreaming={streaming}
                  sessionId={currentSession?.id}
                  onExamDismiss={handleExamDismiss}
                  onExamConfirm={handleExamConfirm}
                  onExamPreview={handleExamPreview}
                />
              </div>
              <ChatInput
                onSend={handleSend}
                isLoading={streaming}
                placeholder="Nhập câu hỏi hoặc yêu cầu tạo đề kiểm tra..."
                suggestions={['📝 Tạo đề kiểm tra 15 câu', '📚 Tóm tắt chương học', '❓ Gợi ý câu hỏi hay']}
              />
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '2rem 1rem' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#6d28d9,#8b5cf6)', boxShadow: '0 4px 20px rgba(109,40,217,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={30} color="white" />
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1e293b' }}>Chatbot hỗ trợ giảng dạy</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', maxWidth: 300, lineHeight: 1.6 }}>
                Chọn cuộc trò chuyện hoặc tạo mới để bắt đầu hỏi bài và tạo đề kiểm tra
              </div>
              <button
                onClick={handleNewChat}
                disabled={creatingSession}
                style={{ marginTop: 4, padding: '10px 28px', borderRadius: 12, background: 'linear-gradient(135deg,#6d28d9,#8b5cf6)', border: 'none', color: 'white', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 2px 10px rgba(109,40,217,0.3)' }}
              >
                {creatingSession ? 'Đang tạo...' : '+ Cuộc trò chuyện mới'}
              </button>
            </div>
          )}
        </div>

        {/* ── Exam preview drawer — pushes chat area left ── */}
        {previewVisible && (
          <ExamPreviewDrawer
            exam={previewExam}
            loading={loadingPreview}
            closing={previewClosing}
            sessionId={previewSession}
            subjectId={previewSubject}
            onClose={closePreview}
            onConfirmed={handlePreviewConfirmed}
          />
        )}
      </div>

      {/* ── Subject picker modal ── */}
      {showPicker && (
        <SubjectPicker
          courses={courses}
          loading={loadingCrs}
          onSelect={handlePickSubject}
          onClose={() => setShowPicker(false)}
          semesters={semesters}
          currentHocKy={currentHocKy}
          selectedHocKy={selectedHocKy}
          onSelectSemester={handleSelectSemester}
        />
      )}
    </div>
  );
};

export default TeacherAITutors;
