import { type FC, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {  ArrowLeft, BookOpen, X, RotateCcw, CheckCircle, Loader2,  ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';

import ChatHistory from './ChatHistory';
import ChatContent from './ChatContent';
import ChatInput from './ChatInput';
import type { ChatMessage } from './types';


import ChatApi from '@/infra/chat/chat_api';
import TeacherApi from '@/infra/teacher/teacher_api';
import type { IChatSession, IExamDetail, IExamQuestion as IQ } from '@/infra/api/interfaces/IChat';
import type { ITeacherSubjectWithClasses } from '@/infra/api/interfaces/ITeacher';
import { Button } from '@/components/ui/button';

// ── CSS ───────────────────────────────────────────────
const CSS = `
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes blink { 50% { opacity:0 } }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
@keyframes slideInLeft { from { transform: translateX(-100%); opacity:0 } to { transform: translateX(0); opacity:1 } }
@keyframes fadeIn { from{opacity:0} to{opacity:1} }
.tai-nav-btn { display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;border:1px solid rgba(0,0,0,0.08);background:transparent;color:#64748b;cursor:pointer;transition:background .15s,color .15s; }
.tai-nav-btn:hover { background:rgba(0,0,0,0.05);color:#0f172a; }
.tai-nav-logout { display:flex;align-items:center;gap:5px;padding:5px 10px;border-radius:8px;border:1px solid rgba(0,0,0,0.08);background:transparent;color:#64748b;font-size:.78rem;font-weight:500;cursor:pointer;transition:background .15s,color .15s; }
.tai-nav-logout:hover { background:rgba(220,38,38,0.06);color:#dc2626;border-color:rgba(220,38,38,0.2); }
.tai-subject-card { padding:10px 12px;border-radius:10px;border:1.5px solid rgba(37,99,235,0.1);background:white;cursor:pointer;transition:border .15s,background .15s; }
.tai-subject-card:hover { border-color:rgba(37,99,235,0.35);background:rgba(37,99,235,0.03); }
.tai-subject-card.selected { border-color:#2563eb;background:rgba(37,99,235,0.05); }
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
  exam: IExamDetail;
  sessionId: string;
  subjectId: string;
  onClose: () => void;
  onConfirmed: () => void;
}

const OPTION_COLORS: Record<string, { bg: string; color: string }> = {
  A: { bg: 'rgba(37,99,235,0.07)',  color: '#2563eb' },
  B: { bg: 'rgba(124,58,237,0.07)', color: '#7c3aed' },
  C: { bg: 'rgba(5,150,105,0.07)',  color: '#059669' },
  D: { bg: 'rgba(217,119,6,0.07)',  color: '#d97706' },
};

const toEditable = (qs: IQ[]): EditableQ[] =>
  qs.map(q => ({
    id: q.id,
    chapter_title: q.chapter_title,
    question: q.question ?? '',
    options: q.options,
    answer: q.answer,
  }));

const ExamPreviewDrawer: FC<ExamPreviewProps> = ({ exam, sessionId, subjectId, onClose, onConfirmed }) => {
  const [timeLimit,  setTimeLimit]  = useState<string>(String(exam.time_limit ?? ''));
  const [editableQs, setEditableQs] = useState<EditableQ[]>(toEditable(exam.questions ?? []));
  const [confirming, setConfirming] = useState(false);

  const reset = () => {
    setTimeLimit(String(exam.time_limit ?? ''));
    setEditableQs(toEditable(exam.questions ?? []));
  };

  const handleConfirm = async () => {
    if (!exam.exam_id) return;
    setConfirming(true);
    try {
      const r = await ChatApi.confirmExam(exam.ma_mon ?? subjectId, {
        exam_id:        exam.exam_id,
        session_id:     exam.session_id ?? sessionId,
        time_limit:     timeLimit ? Number(timeLimit) : null,
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

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(15,23,42,0.3)', backdropFilter: 'blur(3px)', animation: 'fadeIn .2s ease both' }} />

      {/* Panel — left side */}
      <div style={{
        position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 201,
        width: 'min(580px, 100vw)', background: '#f8faff',
        display: 'flex', flexDirection: 'column',
        animation: 'slideInLeft .28s cubic-bezier(.34,1.2,.64,1) both',
        boxShadow: '4px 0 32px rgba(15,23,42,0.15)',
      }}>
        {/* Header */}
        <div style={{ padding: '14px 18px 12px', background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                <ClipboardList size={13} color="#93c5fd" />
                <span style={{ fontSize: '0.63rem', color: '#93c5fd', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Preview đề kiểm tra</span>
              </div>
              <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'white' }}>{exam.ten_mon || subjectId}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.12)', borderRadius: 20, padding: '1px 8px' }}>{exam.ma_mon ?? subjectId}</span>
                <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.12)', borderRadius: 20, padding: '1px 8px' }}>{editableQs.length} câu</span>
                {timeLimit && <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.12)', borderRadius: 20, padding: '1px 8px' }}>{timeLimit} phút</span>}
              </div>
            </div>
            <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Editable fields */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Time limit */}
          <div style={{ background: 'white', borderRadius: 10, border: '1px solid rgba(37,99,235,0.1)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap' }}>Thời gian (phút)</label>
            <input
              type="number" value={timeLimit} onChange={e => setTimeLimit(e.target.value)}
              style={{ flex: 1, padding: '5px 8px', borderRadius: 7, border: '1.5px solid rgba(37,99,235,0.15)', fontSize: '0.82rem', outline: 'none', color: '#1e293b', maxWidth: 100 }}
            />
          </div>

          {/* Chapters */}
          {(exam.chapters ?? []).length > 0 && (
            <div style={{ background: 'white', borderRadius: 10, border: '1px solid rgba(37,99,235,0.1)', padding: '10px 14px' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', marginBottom: 6 }}>Chương</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {(exam.chapters ?? []).map(ch => (
                  <span key={ch.id} style={{ fontSize: '0.72rem', fontWeight: 600, color: '#1e3a8a', background: 'rgba(30,58,138,0.06)', borderRadius: 20, padding: '2px 10px', border: '1px solid rgba(30,58,138,0.1)' }}>{ch.title}</span>
                ))}
              </div>
            </div>
          )}

          {/* Questions */}
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: 8 }}>Câu hỏi — có thể chỉnh sửa toàn bộ nội dung</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {editableQs.map((q, i) => (
                <div key={i} style={{ background: 'white', borderRadius: 11, border: '1px solid rgba(37,99,235,0.1)', overflow: 'hidden' }}>
                  {/* Question header */}
                  <div style={{ padding: '6px 12px', background: 'linear-gradient(135deg,rgba(30,58,138,0.06),rgba(37,99,235,0.04))', borderBottom: '1px solid rgba(37,99,235,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#1e3a8a' }}>Câu {i + 1}</span>
                    {q.chapter_title && <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>{q.chapter_title}</span>}
                  </div>

                  {/* Editable question text */}
                  <div style={{ padding: '2px 12px 0', borderBottom: '1px solid rgba(37,99,235,0.06)' }}>
                    <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#94a3b8', paddingTop: 7, marginBottom: 3 }}>NỘI DUNG CÂU HỎI</div>
                    <textarea
                      value={q.question}
                      onChange={e => setEditableQs(prev => prev.map((x, j) => j === i ? { ...x, question: e.target.value } : x))}
                      rows={3}
                      style={{ width: '100%', padding: '4px 0 8px', border: 'none', outline: 'none', fontSize: '0.82rem', color: '#1e293b', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.55, background: 'transparent' }}
                    />
                  </div>

                  {/* Options — fully editable + click to set answer */}
                  {q.options && Object.keys(q.options).length > 0 && (
                    <div style={{ padding: '8px 12px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#94a3b8', marginBottom: 2 }}>ĐÁP ÁN — click vào ký hiệu để chọn đáp án đúng</div>
                      {Object.entries(q.options).map(([key, val]) => {
                        const isAnswer = key === q.answer;
                        const col = OPTION_COLORS[key] ?? OPTION_COLORS.A;
                        return (
                          <div key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, padding: '5px 8px', borderRadius: 8, background: isAnswer ? 'rgba(5,150,105,0.07)' : col.bg, border: `1.5px solid ${isAnswer ? 'rgba(5,150,105,0.3)' : 'rgba(37,99,235,0.07)'}`, transition: 'all .12s' }}>
                            {/* Click to set answer */}
                            <button
                              onClick={() => setEditableQs(prev => prev.map((x, j) => j === i ? { ...x, answer: key } : x))}
                              title={isAnswer ? 'Đang là đáp án đúng' : 'Chọn làm đáp án đúng'}
                              style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '50%', background: isAnswer ? '#059669' : col.color, color: 'white', fontSize: '0.65rem', fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .12s' }}
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
                              style={{ flex: 1, border: 'none', outline: 'none', fontSize: '0.8rem', color: isAnswer ? '#059669' : '#334155', fontWeight: isAnswer ? 600 : 400, background: 'transparent', fontFamily: 'inherit', padding: '1px 0' }}
                            />
                            {isAnswer && (
                              <span style={{ fontSize: '0.6rem', color: '#059669', fontWeight: 800, whiteSpace: 'nowrap', alignSelf: 'center' }}>Đáp án đúng</span>
                            )}
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

        {/* Footer actions */}
        <div style={{ flexShrink: 0, padding: '10px 14px', borderTop: '1px solid rgba(37,99,235,0.08)', background: 'white', display: 'flex', gap: 8 }}>
          <button
            onClick={reset}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', borderRadius: 10, background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.15)', color: '#2563eb', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
          >
            <RotateCcw size={13} /> Reset
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirming}
            style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', borderRadius: 10, background: 'linear-gradient(135deg,#059669,#10b981)', border: 'none', color: 'white', fontSize: '0.82rem', fontWeight: 700, cursor: confirming ? 'not-allowed' : 'pointer', opacity: confirming ? 0.8 : 1 }}
          >
            {confirming ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={13} />}
            {confirming ? 'Đang lưu...' : 'Xác nhận & Lưu'}
          </button>
        </div>
      </div>
    </>
  );
};

// ── Subject picker modal ──────────────────────────────
interface SubjectPickerProps {
  courses: ITeacherSubjectWithClasses[];
  loading: boolean;
  onSelect: (maMon: string) => void;
  onClose: () => void;
}

const SubjectPicker: FC<SubjectPickerProps> = ({ courses, loading, onSelect, onClose }) => (
  <>
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', animation: 'fadeIn .18s ease both' }} />
    <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 301, width: 'min(480px,92vw)', background: 'white', borderRadius: 18, boxShadow: '0 20px 60px rgba(15,23,42,0.25)', animation: 'fadeIn .22s ease both', display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}>
      <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid rgba(37,99,235,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e293b' }}>Chọn môn học</div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>Chat sẽ gắn với môn học này</div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
            <X size={13} />
          </button>
        </div>
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

// ── Main component ────────────────────────────────────
const TeacherAITutors: FC = () => {
  const navigate    = useNavigate();

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

  // Sidebar mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Preview drawer
  const [previewExam,     setPreviewExam]     = useState<IExamDetail | null>(null);
  const [previewMsgId,    setPreviewMsgId]    = useState<string | null>(null);
  const [previewSubject,  setPreviewSubject]  = useState('');
  const [previewSession,  setPreviewSession]  = useState('');
  const [loadingPreview,  setLoadingPreview]  = useState(false);


  // ── Load sessions ────────────────────────────────────
  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const r = await ChatApi.getSessions();
      setSessions(r.sessions ?? []);
    } catch {
      // silently fail
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  // ── Load courses for picker ──────────────────────────
  const loadCourses = useCallback(async () => {
    setLoadingCrs(true);
    try {
      const semRes = await TeacherApi.getSemesters();
      const hocKy  = semRes.data.hoc_ky_hien_tai;
      const crsRes = await TeacherApi.getSemesterCourses(hocKy);
      setCourses(crsRes.data);
    } catch {
      setCourses([]);
    } finally {
      setLoadingCrs(false);
    }
  }, []);

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
    setCurrentSession(sess);
    setSidebarOpen(false);
    setStreaming(false);
    setMessages([]);
    try {
      const r = await ChatApi.getSessionHistory(sess.id);
      const msgs: ChatMessage[] = [];
      (r.messages ?? []).forEach((m, i) => {
        msgs.push({
          id: `hist-${i}-${m.role}`,
          role: m.role,
          content: m.content,
          timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
        });
      });
      setMessages(msgs);
    } catch {
      setMessages([]);
    }
  };

  // ── Delete session ───────────────────────────────────
  const handleDeleteSession = async (id: string) => {
    if (!confirm('Xóa cuộc trò chuyện này?')) return;
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentSession?.id === id) {
      setCurrentSession(null);
      setMessages([]);
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
            const isExam = done.intent === 'exam_generate';
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
        time_limit:     exam.time_limit,
        question_count: exam.question_count,
        chapters:       exam.chapters,
        questions:      exam.questions,
      });
      if (r.success) {
        toast.success('Đã lưu đề kiểm tra!');
        setMessages(prev => prev.map(m =>
          m.id === msgId && m.examMeta ? { ...m, isStreaming: false, examMeta: { ...m.examMeta, confirmed: true } } : m
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
    setLoadingPreview(true);
    try {
      const r = await ChatApi.getExam(msg.examMeta.examId);
      if (r.exam) {
        setPreviewExam(r.exam);
        setPreviewMsgId(msgId);
        setPreviewSubject(msg.examMeta.subjectId);
        setPreviewSession(msg.examMeta.sessionId);
      } else {
        // Fallback: open with minimal data so user can still confirm
        setPreviewExam({ exam_id: msg.examMeta.examId });
        setPreviewMsgId(msgId);
        setPreviewSubject(msg.examMeta.subjectId);
        setPreviewSession(msg.examMeta.sessionId);
      }
    } catch {
      toast.error('Không thể tải chi tiết đề.');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handlePreviewConfirmed = () => {
    if (previewMsgId) {
      setMessages(prev => prev.map(m =>
        m.id === previewMsgId && m.examMeta ? { ...m, examMeta: { ...m.examMeta, confirmed: true } } : m
      ));
    }
    setPreviewExam(null);
    setPreviewMsgId(null);
    // Gửi "xác nhận" vào chat để bot phản hồi
    handleSend('xác nhận');
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Be Vietnam Pro',system-ui,sans-serif", background: '#f0f4ff', overflow: 'hidden' }}>
      <style>{CSS}</style>

      {/* ── BODY ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)} style={{ position: 'absolute', inset: 0, zIndex: 40, background: 'rgba(15,23,42,0.3)', backdropFilter: 'blur(2px)' }} />
        )}

        {/* ── Sidebar ── */}
        <div style={{
          flexShrink: 0,
          width: 240,
          height: '100%',
          position: 'absolute',
          zIndex: 45,
          left: sidebarOpen ? 0 : -240,
          transition: 'left .22s cubic-bezier(.34,1.2,.64,1)',
          // Desktop: always visible
          ...(typeof window !== 'undefined' && window.innerWidth >= 768 ? { position: 'relative' as const, left: 0, zIndex: 1 } : {}),
        }}>
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
          />
        </div>

        {/* ── Chat area ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f0f4ff' }}>
          {/* Mobile hamburger */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'white', borderBottom: '1px solid rgba(37,99,235,0.07)' }}>
           <Button  variant={'default'} onClick={() => navigate('/teacher/dashboard')} title="Về trang chủ">
          <ArrowLeft size={14} />   Quay lại
          </Button>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#1e293b' }}>
              {currentSession ? (currentSession.name || currentSession.subject_id || 'Chat') : 'Chọn hoặc tạo cuộc trò chuyện'}
            </span>
          </div>

          {currentSession ? (
            <>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <ChatContent
                  messages={messages}
                  isStreaming={streaming}
                  onExamDismiss={handleExamDismiss}
                  onExamConfirm={handleExamConfirm}
                  onExamPreview={handleExamPreview}
                />
              </div>
              <ChatInput onSend={handleSend} isLoading={streaming} />
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'white', boxShadow: '0 4px 20px rgba(37,99,235,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={28} color="#2563eb" />
              </div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#1e293b' }}>Chào mừng đến TAI-TNUT</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', maxWidth: 300 }}>
                Chọn cuộc trò chuyện bên trái hoặc tạo mới để bắt đầu
              </div>
              <button
                onClick={handleNewChat}
                disabled={creatingSession}
                style={{ marginTop: 8, padding: '10px 24px', borderRadius: 12, background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', border: 'none', color: 'white', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                {creatingSession ? 'Đang tạo...' : '+ Cuộc trò chuyện mới'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Loading preview ── */}
      {loadingPreview && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.25)', backdropFilter: 'blur(3px)' }}>
          <div style={{ background: 'white', borderRadius: 16, padding: '24px 32px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
            <Loader2 size={20} color="#2563eb" style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontWeight: 600, color: '#1e293b' }}>Đang tải đề kiểm tra...</span>
          </div>
        </div>
      )}

      {/* ── Subject picker modal ── */}
      {showPicker && (
        <SubjectPicker
          courses={courses}
          loading={loadingCrs}
          onSelect={handlePickSubject}
          onClose={() => setShowPicker(false)}
        />
      )}

      {/* ── Exam preview drawer ── */}
      {previewExam && (
        <ExamPreviewDrawer
          exam={previewExam}
          sessionId={previewSession}
          subjectId={previewSubject}
          onClose={() => { setPreviewExam(null); setPreviewMsgId(null); }}
          onConfirmed={handlePreviewConfirmed}
        />
      )}
    </div>
  );
};

export default TeacherAITutors;
