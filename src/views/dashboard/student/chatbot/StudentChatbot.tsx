import { type FC, useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, BookOpen, X, Loader2, Menu, AlertCircle, CalendarCheck } from 'lucide-react';
import toast from 'react-hot-toast';

import ChatHistory from '@/views/dashboard/teacher/chatbot/ChatHistory';
import ChatContent from '@/views/dashboard/teacher/chatbot/ChatContent';
import ChatInput from '@/views/dashboard/teacher/chatbot/ChatInput';
import RatingCard from '@/views/dashboard/teacher/chatbot/RatingCard';
import StudyProgressPanel from '@/views/dashboard/student/chatbot/StudyProgressPanel';
import type { ChatMessage } from '@/views/dashboard/teacher/chatbot/types';

import ChatApi from '@/infra/chat/chat_api';
import StudentApi, { type ISubjectMastery } from '@/infra/student/student_api';
import StudentTools from '@/views/dashboard/student/chatbot/StudentTools';
import LectureSummary from '@/views/dashboard/student/chatbot/LectureSummary';
import LuyenTapApi from '@/infra/luyentap/luyentap_api';
import { batDauLuyenTap } from '@/views/dashboard/student/subjects/StudentLuyenTapPanel';
import type { ILuyenTapBuoi, ILuyenTapNhacResponse } from '@/infra/api/interfaces/ILuyenTap';
import type { IChatSession } from '@/infra/api/interfaces/IChat';
import type { IStudentSubject, IStudentExamStatusResponse } from '@/infra/api/interfaces/IStudent';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/views/pages/stores/auth_store';
import { storage } from '@/helper/storage';

// ── Extract assignment link embedded in content ───────
const ASGN_URL_RE = /(https?:\/\/\S+\/student\/assignments\/[a-zA-Z0-9]+)/;

const extractAsgnLink = (content: string): { link: string; cleaned: string } | null => {
  const match = content.match(ASGN_URL_RE);
  if (!match) return null;
  const link = match[1];
  const cleaned = content
    .replace(/\n+[^\n]*https?:\/\/\S+\/student\/assignments\/[a-zA-Z0-9]+[^\n]*$/, '')
    .trim();
  return { link, cleaned };
};

// ── Ý định "tạo đề ôn tập" khi SV tự gõ (chỉ dùng cho môn có lịch luyện tập hằng tuần) ──
const Y_DINH_LUYEN_TAP = /((tạo|ra|cho|làm|lấy|gửi|soạn)\s+(cho\s+)?(em|mình|tôi|tớ)?\s*(một|vài|ít|mấy|\d+)?\s*(bộ\s+)?(đề|bài|câu hỏi|câu)\s*(ôn|luyện|trắc nghiệm|kiểm tra|thi thử))|ôn luyện|luyện tập|kiểm tra thử|thi thử|làm bài ôn|đề ôn/i;
const HOI_KIEN_THUC = /(là gì|giải thích|tại sao|vì sao|như thế nào|thế nào là|khác nhau|so sánh|nghĩa là|\?$)/i;
const laYDinhLuyenTap = (t: string) => Y_DINH_LUYEN_TAP.test(t) && !HOI_KIEN_THUC.test(t.trim());

// ── CSS ───────────────────────────────────────────────
const CSS = `
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes fadeIn { from{opacity:0} to{opacity:1} }
@keyframes slideInLeft { from { transform: translateX(-100%); opacity:0 } to { transform: translateX(0); opacity:1 } }
.sai-subject-card { padding:10px 12px;border-radius:10px;border:1.5px solid rgba(37,99,235,0.1);background:white;cursor:pointer;transition:border .15s,background .15s; }
.sai-subject-card:hover { border-color:rgba(37,99,235,0.35);background:rgba(37,99,235,0.03); }
.sai-subject-card.selected { border-color:#2563eb;background:rgba(37,99,235,0.05); }

/* ── Responsive sidebar ── */
.sai-sidebar {
  flex-shrink:0; width:240px; height:100%;
  position:absolute; left:-240px; z-index:45;
  transition:left .22s cubic-bezier(.34,1.2,.64,1);
}
.sai-sidebar.open { left:0; }
.sai-hamburger {
  display:flex; align-items:center; justify-content:center;
  width:34px; height:34px; border-radius:8px; flex-shrink:0;
  background:rgba(30,58,138,0.06); border:1px solid rgba(30,58,138,0.12);
  color:#1e3a8a; cursor:pointer;
}
@media (min-width:768px) {
  .sai-sidebar { position:relative !important; left:0 !important; z-index:1 !important; }
  .sai-hamburger { display:none !important; }
}
`;

// ── Subject picker modal ──────────────────────────────
interface SubjectPickerProps {
  subjects: IStudentSubject[];
  loading: boolean;
  onSelect: (maMon: string) => void;
  onClose: () => void;
}

const SubjectPicker: FC<SubjectPickerProps> = ({ subjects, loading, onSelect, onClose }) => (
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
        ) : subjects.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', fontSize: '0.82rem', color: '#94a3b8' }}>Không có môn học nào.</div>
        ) : subjects.map(subject => (
          <div key={subject.ma_mon} className="sai-subject-card" onClick={() => onSelect(subject.ma_mon)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(37,99,235,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <BookOpen size={16} color="#2563eb" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>{subject.ten_mon}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                  <span style={{ fontSize: '0.7rem', color: '#2563eb', fontWeight: 700, background: 'rgba(37,99,235,0.07)', borderRadius: 20, padding: '1px 7px' }}>{subject.ma_mon}</span>
                  {subject.so_tc !== '0' && <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 600 }}>{subject.so_tc} TC</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </>
);

// Màu nhấn tím cho chế độ "Chat môn học" — khác hẳn xanh dương của "Cố vấn học tập"
// để danh sách hội thoại và nút tạo mới nhìn phát biết ngay đang ở khu vực nào.
const SUBJECT_ACCENT = {
  from: '#6d28d9', to: '#8b5cf6', solid: '#6d28d9',
  soft: 'rgba(109,40,217,0.08)', softer: 'rgba(109,40,217,0.14)',
  shadow: 'rgba(109,40,217,0.28)', badgeText: '#7c3aed',
  badgeBg: 'rgba(124,58,237,0.09)', emptyIcon: '#ddd6fe',
};

// ── Main component ────────────────────────────────────
const StudentChatbot: FC = () => {
  const navigate = useNavigate();
  const { sessionId: urlSessionId } = useParams<{ sessionId?: string }>();

  // Sessions
  const [sessions,        setSessions]        = useState<IChatSession[]>([]);
  const [currentSession,  setCurrentSession]  = useState<IChatSession | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // Messages
  const [messages,  setMessages]  = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);

  // Subject picker
  const [showPicker,      setShowPicker]      = useState(false);
  const [subjects,        setSubjects]        = useState<IStudentSubject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);

  // Sidebar mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Exam status
  const user = useAuthStore(s => s.user);
  const [examStatus, setExamStatus] = useState<IStudentExamStatusResponse | null>(null);
  // Nhắc luyện tập hằng tuần: các buổi đang mở mà SV chưa có điểm
  const [nhacLT, setNhacLT] = useState<ILuyenTapNhacResponse['data']>(null);
  const [moLT, setMoLT] = useState(false);

  // CSAT rating — derived, không cần effect: ẩn ngay khi dismiss (submit/skip) qua
  // dismissedSessionId, ẩn vĩnh viễn qua storage sau khi session đã "resolved".
  const [dismissedSessionId, setDismissedSessionId] = useState<string | null>(null);
  const showRating = !!currentSession
    && currentSession.id !== dismissedSessionId
    && messages.length >= 8
    && !storage.hasResolvedRating(currentSession.id);

  // ── Helper: map history, extract any embedded assignment links ──
  const mapHistory = (raw: { role: 'user' | 'assistant'; content: string; timestamp?: string }[]): ChatMessage[] => {
    return raw.map((m, i) => {
      if (m.role === 'assistant') {
        const extracted = extractAsgnLink(m.content);
        if (extracted) {
          return {
            id: `hist-${i}-${m.role}`,
            role: m.role,
            content: extracted.cleaned,
            timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
            intent: 'luyen_tap_tao_de',
            assignmentLink: extracted.link,
          };
        }
      }
      return {
        id: `hist-${i}-${m.role}`,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
      };
    });
  };

  // ── Load sessions + auto-restore từ URL ─────────────
  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const r = await ChatApi.getSessions();
      const list = r.sessions ?? [];
      setSessions(list);
      if (urlSessionId) {
        const found = list.find(s => s.id === urlSessionId);
        if (found) {
          setCurrentSession(found);
          const hist = await ChatApi.getSessionHistory(found.id);
          setMessages(mapHistory(hist.messages ?? []));
        }
      }
    } catch {
      // silently fail
    } finally {
      setLoadingSessions(false);
    }
  }, [urlSessionId]);

  useEffect(() => {
    void Promise.resolve().then(loadSessions);
  }, [loadSessions]);

  // ── Load subjects for picker ─────────────────────────
  const loadSubjects = useCallback(async () => {
    setLoadingSubjects(true);
    try {
      const semRes = await StudentApi.getSemesters();
      const hocKy  = semRes.data.hoc_ky_hien_tai;
      const subRes = await StudentApi.getSubjectsBySemester(hocKy);
      setSubjects(subRes.data);
    } catch {
      setSubjects([]);
    } finally {
      setLoadingSubjects(false);
    }
  }, []);

  // Nạp danh sách môn ngay khi vào trang để panel "Mức thành thạo" có dữ liệu.
  useEffect(() => { loadSubjects(); }, [loadSubjects]);

  useEffect(() => {
    const maMon = currentSession?.subject_id;
    setNhacLT(null);
    if (!maMon) return;
    let alive = true;
    LuyenTapApi.getNhac(maMon).then(r => { if (alive) setNhacLT(r.data); }).catch(() => {});
    return () => { alive = false; };
  }, [currentSession?.subject_id]);

  // Mức thành thạo để hiện % ở header môn.
  const [masteryMap, setMasteryMap] = useState<Record<string, ISubjectMastery>>({});
  useEffect(() => { StudentApi.getSubjectMastery().then(r => setMasteryMap(r.data ?? {})).catch(() => {}); }, []);

  const handleNewChat = () => {
    if (subjects.length === 0) loadSubjects();
    setShowPicker(true);
  };

  // ── Create session ───────────────────────────────────
  const handlePickSubject = async (maMon: string) => {
    setShowPicker(false);
    setCreatingSession(true);
    try {
      const r = await ChatApi.createSession(maMon);
      const allRes = await ChatApi.getSessions();
      setSessions(allRes.sessions ?? []);
      const sess = (allRes.sessions ?? []).find(s => s.id === r.session_id);
      if (sess) {
        handleSelectSession(sess);
      } else {
        const fake: IChatSession = { id: r.session_id, name: maMon, subject_id: maMon };
        navigate(`/student/chat/${r.session_id}`, { replace: true });
        setCurrentSession(fake);
        setMessages([]);
      }
    } catch {
      toast.error('Không thể tạo cuộc trò chuyện.');
    } finally {
      setCreatingSession(false);
    }
  };

  // ── Fetch exam status for current subject ───────────
  const fetchExamStatus = useCallback(async (maMon: string) => {
    const userId = user?.username;
    if (!userId || !maMon) return;
    try {
      const r = await StudentApi.getExamStatus(userId, maMon);
      setExamStatus(r);
    } catch {
      setExamStatus(null);
    }
  }, [user?.username]);

  // ── Select session ───────────────────────────────────
  const handleSelectSession = async (sess: IChatSession) => {
    if (sess.id === currentSession?.id) return;
    navigate(`/student/chat/${sess.id}`, { replace: true });
    setCurrentSession(sess);
    setSidebarOpen(false);
    setStreaming(false);
    setMessages([]);
    setExamStatus(null);
    try {
      const r = await ChatApi.getSessionHistory(sess.id);
      setMessages(mapHistory(r.messages ?? []));
    } catch {
      setMessages([]);
    }
    if (sess.subject_id) void fetchExamStatus(sess.subject_id);
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
      navigate('/student/chat', { replace: true });
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
  /**
   * Mở đề luyện tập mới của môn: ưu tiên buổi đang mở chưa làm; `onThem` = khi đã luyện đủ thì mở lại
   * buổi đang mở gần nhất (hoặc buổi đã qua gần nhất) để ôn thêm — lượt sau hạn không tính điểm.
   */
  const chonBuoiLuyenTap = async (onThem: boolean, chuong?: number): Promise<ILuyenTapBuoi | undefined> => {
    // SV nêu "chương N" → chọn buổi đã mở thuộc chương đó (ưu tiên buổi chưa có điểm)
    if (chuong && currentSession?.subject_id) {
      try {
        const cua = (await LuyenTapApi.getStudent(currentSession.subject_id)).data.buoi
          .filter(x => x.trang_thai !== 'chua_mo' && x.chuong.includes(chuong));
        const b = cua.find(x => x.diem == null && x.trang_thai === 'dang_mo') ?? cua.find(x => x.trang_thai === 'dang_mo') ?? cua[cua.length - 1];
        if (b) return b;
      } catch { /* rơi về cách chọn mặc định */ }
    }
    let b: ILuyenTapBuoi | undefined = nhacLT?.can_lam[0];
    if (!b && onThem && currentSession?.subject_id) {
      try {
        const gan = [...(await LuyenTapApi.getStudent(currentSession.subject_id)).data.buoi].reverse();
        b = gan.find(x => x.trang_thai === 'dang_mo') ?? gan.find(x => x.trang_thai === 'qua_han');
      } catch { /* bỏ qua — báo ở nơi gọi */ }
    }
    return b;
  };

  const moLuyenTap = async (onThem = false) => {
    const b = await chonBuoiLuyenTap(onThem);
    if (!b) { toast(onThem ? 'Môn này chưa có buổi luyện tập nào đang mở.' : 'Tuần này bạn đã luyện đủ các buổi đang mở. 👏'); return; }
    setMoLT(true);
    await batDauLuyenTap(b.id, navigate);
    setMoLT(false);
  };

  /** SV tự gõ "tạo đề ôn tập…" ở môn có lịch luyện tập → tạo lượt luyện tập, trả lời ngay trong khung chat kèm thẻ Làm bài. */
  const traLoiLuyenTap = async (text: string) => {
    const t0 = Date.now();
    setMessages(prev => [...prev, { id: `user-${t0}`, role: 'user', content: text, timestamp: new Date() }]);
    const soChuong = Number(text.match(/chương\s*(\d+)/i)?.[1]) || undefined;
    const b = await chonBuoiLuyenTap(true, soChuong);
    let content: string;
    let link: string | undefined;
    if (!b) {
      content = soChuong
        ? `Các buổi luyện tập của Chương ${soChuong} chưa mở. Em có thể hỏi mình về nội dung chương này trong lúc chờ nhé!`
        : 'Môn này hiện chưa có buổi luyện tập nào đang mở. Em có thể hỏi mình về nội dung bài học trong lúc chờ nhé!';
    } else {
      try {
        const asgId = await LuyenTapApi.batDau(b.id);
        link = `${window.location.origin}/student/assignments/${asgId}`;
        const chuaLam = nhacLT?.can_lam.some(x => x.id === b.id);
        content = `Mình đã tạo đề luyện tập **${b.ma_buoi} — ${b.ten}**: ${b.so_cau} câu rút từ ngân hàng câu hỏi của môn, `
          + `làm trong ${b.thoi_gian} phút, máy chấm ngay và giải thích từng phương án. `
          + (chuaLam
            ? 'Điểm cao nhất nộp trước hạn được tính vào cột luyện tập.'
            : 'Em đã luyện đủ các buổi đang mở — lượt này để ôn thêm (điểm cao nhất vẫn được giữ).')
          + '\n\nBấm **Làm bài** bên dưới để bắt đầu. Muốn chọn buổi khác, em mở khung "Luyện tập hằng tuần" ở trang môn học.';
      } catch (e: unknown) {
        content = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Mình chưa mở được đề luyện tập, em thử lại sau nhé.';
      }
    }
    setMessages(prev => [...prev, { id: `bot-${t0}`, role: 'assistant', content, timestamp: new Date(), intent: 'luyen_tap_tao_de', assignmentLink: link }]);
  };

  const handleSend = async (text: string) => {
    if (!currentSession || streaming) return;
    if (text.startsWith('🗓️ Luyện tập tuần này')) { void moLuyenTap(); return; }
    // Môn đã có lịch luyện tập hằng tuần → "Tạo câu hỏi ôn tập" rút đề từ ngân hàng câu hỏi của môn
    // (máy chấm + giải thích + tính điểm luyện tập). Môn chưa có lịch vẫn hỏi chatbot như cũ.
    if (text === '📝 Tạo câu hỏi ôn tập' && nhacLT) { void moLuyenTap(true); return; }
    if (nhacLT && laYDinhLuyenTap(text)) { void traLoiLuyenTap(text); return; }

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
            // Case 1: URL embedded in the content text
            let finalContent = accumulated;
            let embeddedLink: string | undefined;
            if (done.intent === 'luyen_tap_tao_de') {
              const ex = extractAsgnLink(accumulated);
              if (ex) { embeddedLink = ex.link; finalContent = ex.cleaned; }
            }
            setMessages(prev => prev.map(m =>
              m.id === botMsgId
                ? { ...m, content: finalContent, isStreaming: false, intent: done.intent, messageId: done.message_id, ...(embeddedLink ? { assignmentLink: embeddedLink } : {}) }
                : m
            ));
          },
          onAssignmentLink: link => {
            // Case 2: URL in a separate assignment_link field
            setMessages(prev => prev.map(m =>
              m.id === botMsgId ? { ...m, assignmentLink: link } : m
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

  // ── Feedback (like/dislike) ──────────────────────────
  const handleFeedback = async (msgId: string, messageId: string | undefined, value: 'like' | 'dislike') => {
    if (!messageId) return;
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, feedback: value } : m));
    try {
      await ChatApi.sendFeedback(messageId, value);
    } catch {
      toast.error('Không thể gửi phản hồi.');
    }
  };

  // ── Rating CSAT ───────────────────────────────────────
  const handleRatingSubmit = async (score: number) => {
    if (!currentSession) return;
    setDismissedSessionId(currentSession.id);
    storage.markRatingResolved(currentSession.id);
    try {
      await ChatApi.sendRating(score, currentSession.id);
    } catch {
      toast.error('Không thể gửi đánh giá.');
    }
  };

  const handleRatingSkip = () => {
    if (!currentSession) return;
    setDismissedSessionId(currentSession.id);
    storage.markRatingResolved(currentSession.id);
  };

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

        {/* ── Sidebar ── */}
        <div className={`sai-sidebar${sidebarOpen ? ' open' : ''}`} style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
              accent={SUBJECT_ACCENT}
              contextLabel="Môn học"
            />
          </div>
          <StudentTools subjects={subjects} mastery={masteryMap} onNewChat={handleNewChat} />
        </div>

        {/* ── Chat area ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f4f6fb', minWidth: 0 }}>
          {/* Topbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'white', borderBottom: '1px solid #eef0f5', flexShrink: 0 }}>
            <button className="sai-hamburger" onClick={() => setSidebarOpen(v => !v)} title="Danh sách chat">
              <Menu size={16} />
            </button>
            {currentSession ? (
              <>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#6d28d9,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(109,40,217,0.25)' }}>
                  <BookOpen size={18} color="white" />
                </div>
                {(() => {
                  const maSub = currentSession.subject_id ?? '';
                  const sub = subjects.find(s => s.ma_mon === maSub);
                  const info = masteryMap[maSub];
                  const pct = info?.mastery ?? null;
                  const tenMon = sub?.ten_mon || currentSession.name || 'Trợ giảng AI học tập';
                  return (
                    <>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tenMon}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Trực tuyến · Trả lời 24/7{maSub ? ` · ${maSub}` : ''}</span>
                        </div>
                      </div>
                      {pct != null ? (
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0e8f63', background: 'rgba(14,143,99,0.1)', padding: '4px 11px', borderRadius: 20, flexShrink: 0, whiteSpace: 'nowrap' }}>
                          {pct}% thành thạo
                        </span>
                      ) : maSub && (
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', background: 'rgba(148,163,184,0.12)', padding: '4px 10px', borderRadius: 20, flexShrink: 0, whiteSpace: 'nowrap' }}>
                          chưa có mức thạo
                        </span>
                      )}
                    </>
                  );
                })()}
              </>
            ) : (
              <span style={{ flex: 1, fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8' }}>Chọn hoặc tạo cuộc trò chuyện</span>
            )}
            <Button variant="outline" onClick={() => navigate('/student/dashboard')} title="Về trang chủ" style={{ flexShrink: 0 }}>
              <ArrowLeft size={14} />
            </Button>
          </div>

          {/* ── Exam status banner ── */}
          {examStatus && examStatus.status === 'not_started' && examStatus.link && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: 'rgba(245,158,11,0.08)', borderBottom: '1px solid rgba(245,158,11,0.2)', flexShrink: 0 }}>
              <AlertCircle size={15} color="#d97706" style={{ flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: '0.78rem', color: '#92400e', fontWeight: 600 }}>
                Bạn còn bài kiểm tra chưa hoàn thành từ lần trước
              </span>
              <a
                href={(() => { try { return new URL(examStatus.link!).pathname; } catch { return examStatus.link!; } })()}
                style={{ flexShrink: 0, padding: '5px 14px', borderRadius: 8, background: 'linear-gradient(135deg,#d97706,#f59e0b)', color: 'white', fontWeight: 700, fontSize: '0.75rem', textDecoration: 'none', whiteSpace: 'nowrap' }}
              >
                Làm bài ngay
              </a>
            </div>
          )}

          {/* ── Nhắc luyện tập hằng tuần ── */}
          {currentSession && nhacLT && nhacLT.can_lam.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: 'rgba(37,99,235,0.06)', borderBottom: '1px solid rgba(37,99,235,0.16)', flexShrink: 0, flexWrap: 'wrap' }}>
              <CalendarCheck size={15} color="#2563eb" style={{ flexShrink: 0 }} />
              <span style={{ flex: 1, minWidth: 200, fontSize: '0.78rem', color: '#1e3a8a', fontWeight: 600 }}>
                Luyện tập tuần này: còn {nhacLT.can_lam.length} buổi chưa làm ({nhacLT.can_lam.slice(0, 4).map(b => b.ma_buoi).join(', ')}
                {nhacLT.can_lam.length > 4 ? '…' : ''}) — mỗi buổi 10 câu, tính vào cột điểm luyện tập.
                {nhacLT.tong_ket.diem_tb != null && <span style={{ color: '#64748b', fontWeight: 500 }}> TB hiện tại {nhacLT.tong_ket.diem_tb}/10.</span>}
              </span>
              <button onClick={() => void moLuyenTap()} disabled={moLT}
                style={{ flexShrink: 0, padding: '5px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#1d4ed8,#2563eb)', color: 'white', fontWeight: 700, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                {moLT ? 'Đang mở…' : `Luyện ${nhacLT.can_lam[0].ma_buoi} ngay`}
              </button>
            </div>
          )}

          {currentSession ? (
            <>
              {messages.length === 0 && !streaming ? (
                /* Màn chào mừng: cửa sổ "Học cùng gia sư AI" + lời chào — cuộn chung */
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  <LectureSummary
                    maMon={currentSession.subject_id}
                    subjectName={subjects.find(s => s.ma_mon === currentSession.subject_id)?.ten_mon}
                  />
                  <div style={{ height: 250 }}>
                    <ChatContent role="student" messages={messages} isStreaming={streaming} sessionId={currentSession?.id}
                      onExamDismiss={() => {}} onExamConfirm={() => Promise.resolve()} onExamPreview={() => {}} onFeedback={handleFeedback} />
                  </div>
                </div>
              ) : (
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <ChatContent
                  role="student"
                  messages={messages}
                  isStreaming={streaming}
                  sessionId={currentSession?.id}
                  onExamDismiss={() => {}}
                  onExamConfirm={() => Promise.resolve()}
                  onExamPreview={() => {}}
                  onFeedback={handleFeedback}
                />
              </div>
              )}
              {showRating && <RatingCard onSubmit={handleRatingSubmit} onSkip={handleRatingSkip} />}
              <ChatInput
                onSend={handleSend}
                isLoading={streaming}
                suggestions={[
                  ...(nhacLT && nhacLT.can_lam.length > 0 ? [`🗓️ Luyện tập tuần này (${nhacLT.can_lam[0].ma_buoi})`] : []),
                  '📚 Tóm tắt chương 1', '📝 Tạo câu hỏi ôn tập', '🎯 Gợi ý lộ trình ôn thi',
                ]}
              />
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '2rem 1rem' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#6d28d9,#8b5cf6)', boxShadow: '0 4px 20px rgba(109,40,217,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={30} color="white" />
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1e293b' }}>Chatbot trợ giảng môn học</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', maxWidth: 320, lineHeight: 1.6 }}>
                Hỏi <b style={{ color: '#6d28d9' }}>kiến thức, giải bài, luyện tập</b> theo từng môn học — trả lời dựa trên học liệu của môn.
                <br />Cần hỏi về điểm, thời khóa biểu, lịch thi? Hãy chuyển sang tab <b>“Cố vấn học tập”</b>.
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

        {/* ── Panel tiến độ học tập (cá nhân hoá) — hiện khi đang trong 1 cuộc trò chuyện ── */}
        {currentSession && <StudyProgressPanel subjects={subjects} />}
      </div>

      {/* ── Subject picker modal ── */}
      {showPicker && (
        <SubjectPicker
          subjects={subjects}
          loading={loadingSubjects}
          onSelect={handlePickSubject}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
};

export default StudentChatbot;
