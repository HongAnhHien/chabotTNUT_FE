import { type FC, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { ArrowLeft, GraduationCap, LayoutDashboard, Loader2, Menu, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

import ChatHistory from '@/views/dashboard/teacher/chatbot/ChatHistory';
import ChatContent from '@/views/dashboard/teacher/chatbot/ChatContent';
import ChatInput from '@/views/dashboard/teacher/chatbot/ChatInput';
import RatingCard from '@/views/dashboard/teacher/chatbot/RatingCard';
import type { ChatMessage } from '@/views/dashboard/teacher/chatbot/types';

import AdvisorApi from '@/infra/chat/advisor_api';
import type { IChatSession } from '@/infra/api/interfaces/IChat';
import { Button } from '@/components/ui/button';
import { storage } from '@/helper/storage';

const CSS = `
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Responsive sidebar ── */
.aai-sidebar {
  flex-shrink:0; width:240px; height:100%;
  position:absolute; left:-240px; z-index:45;
  transition:left .22s cubic-bezier(.34,1.2,.64,1);
}
.aai-sidebar.open { left:0; }
.aai-hamburger {
  display:flex; align-items:center; justify-content:center;
  width:34px; height:34px; border-radius:8px; flex-shrink:0;
  background:rgba(30,58,138,0.06); border:1px solid rgba(30,58,138,0.12);
  color:#1e3a8a; cursor:pointer;
}
@media (min-width:768px) {
  .aai-sidebar { position:relative !important; left:0 !important; z-index:1 !important; }
  .aai-hamburger { display:none !important; }
}
`;

interface Props {
  role: 'student' | 'teacher';
  homePath: string;
  chatBasePath: string; // e.g. "/student/chat/advisor"
}

const SUGGESTIONS: Record<Props['role'], string[]> = {
  // Đủ mọi việc chatbot CVHT làm được cho SV (khớp bộ công cụ dịch vụ CVHT)
  student: [
    '📊 Điểm & GPA tích luỹ của tôi?',
    '⚠️ Tôi có bị cảnh báo học vụ không?',
    '🎯 Tiến độ CTĐT: còn thiếu học phần nào?',
    '📚 Kỳ tới nên đăng ký môn gì?',
    '🔗 Môn tiên quyết của học phần…',
    '🗓️ TKB tuần này của tôi?',
    '📅 TKB cả học kỳ của tôi?',
    '📝 Lịch thi của tôi?',
    '🧾 Kỳ này tôi đã đăng ký môn nào?',
    '📖 Quy chế học lại, cải thiện điểm?',
    '🎓 Điều kiện tốt nghiệp của tôi?',
    '🧭 Tôi hợp với hướng nghề nào?',
  ],
  teacher: [
    '🗓️ Tuần này tôi dạy gì?',
    '👥 Danh sách sinh viên tôi cố vấn HK này?',
    '📝 Lịch thi cuối kỳ các lớp tôi phụ trách?',
  ],
};

const AdvisorChatPage: FC<Props> = ({ role, homePath, chatBasePath }) => {
  const navigate = useNavigate();
  const { sessionId: urlSessionId } = useParams<{ sessionId?: string }>();
  // Câu hỏi gửi sẵn từ Dashboard CVHT (?q=...) — tự mở cuộc trò chuyện và hỏi luôn
  const [searchParams] = useSearchParams();
  const [historyLoading, setHistoryLoading] = useState(false);
  const triedCreate = useRef(false);
  const [pendingQ, setPendingQ] = useState<string | null>(() => searchParams.get('q'));

  const [sessions,        setSessions]        = useState<IChatSession[]>([]);
  const [currentSession,  setCurrentSession]  = useState<IChatSession | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [creatingSession, setCreatingSession] = useState(false);

  const [messages,  setMessages]  = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);

  const [sidebarOpen,    setSidebarOpen]    = useState(false);
  const [refreshingToken, setRefreshingToken] = useState(false);

  // CSAT rating — derived, không cần effect: ẩn ngay khi dismiss (submit/skip) qua
  // dismissedSessionId, ẩn vĩnh viễn qua storage sau khi session đã "resolved".
  const [dismissedSessionId, setDismissedSessionId] = useState<string | null>(null);
  const showRating = !!currentSession
    && currentSession.id !== dismissedSessionId
    && messages.length >= 8
    && !storage.hasResolvedRating(currentSession.id);

  const mapHistory = (raw: { role: string; content: string; timestamp?: string }[]): ChatMessage[] =>
    raw.map((m, i) => ({
      id: `hist-${i}-${m.role}`,
      // Chuẩn hoá role: chỉ có 2 bên hội thoại, coi mọi giá trị không phải assistant/bot/ai là user
      // (phòng trường hợp backend trả role khác chuỗi 'assistant' đúng casing).
      role: /^(assistant|bot|ai)$/i.test(m.role) ? 'assistant' : 'user',
      content: m.content,
      timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
    }));

  // Endpoint chi tiết (GET .../sessions/{id}) trả title chính xác ngay lập tức
  // (BE tự suy title từ câu hỏi đầu nếu job đặt tên CVHT chưa chạy xong); endpoint
  // danh sách thì có thể trễ vài giây. Nên mỗi khi mở 1 session, đồng bộ lại title
  // đó vào cả currentSession lẫn sidebar để không phải chờ danh sách tự cập nhật.
  const applySessionDetail = (session: IChatSession | null) => {
    if (!session) return;
    setCurrentSession(session);
    setSessions(prev => prev.map(s => (s.id === session.id ? session : s)));
  };

  // ── Load sessions + auto-restore từ URL ─────────────
  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const r = await AdvisorApi.getSessions();
      const list = r.sessions ?? [];
      setSessions(list);
      if (urlSessionId) {
        const found = list.find(s => s.id === urlSessionId);
        if (found) {
          setCurrentSession(found);
          const hist = await AdvisorApi.getSessionHistory(found.id);
          setMessages(mapHistory(hist.messages ?? []));
          applySessionDetail(hist.session);
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

  // ── Create session (không cần chọn môn học) ──────────
  const handleNewChat = async () => {
    setCreatingSession(true);
    try {
      const r = await AdvisorApi.createSession();
      const allRes = await AdvisorApi.getSessions();
      setSessions(allRes.sessions ?? []);
      const sess = (allRes.sessions ?? []).find(s => s.id === r.session_id);
      if (sess) {
        handleSelectSession(sess);
      } else {
        const fake: IChatSession = { id: r.session_id, name: 'Cố vấn học tập' };
        navigate(`${chatBasePath}/${r.session_id}`, { replace: true });
        setCurrentSession(fake);
        setMessages([]);
      }
    } catch (err) {
      // Ưu tiên hiện thông báo BE trả về (VD 503: "Cổng thông tin phản hồi chậm…")
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Không thể tạo cuộc trò chuyện.');
    } finally {
      setCreatingSession(false);
    }
  };

  // ── Select session ───────────────────────────────────
  const handleSelectSession = async (sess: IChatSession) => {
    if (sess.id === currentSession?.id) return;
    navigate(`${chatBasePath}/${sess.id}`, { replace: true });
    setCurrentSession(sess);
    setSidebarOpen(false);
    setStreaming(false);
    setMessages([]);
    setHistoryLoading(true);
    try {
      const r = await AdvisorApi.getSessionHistory(sess.id);
      setMessages(mapHistory(r.messages ?? []));
      applySessionDetail(r.session);
    } catch {
      setMessages([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // ── Delete session ───────────────────────────────────
  const handleDeleteSession = async (id: string) => {
    if (!confirm('Xóa cuộc trò chuyện này?')) return;
    const prevSessions = sessions;
    const wasCurrent = currentSession?.id === id;

    setSessions(prev => prev.filter(s => s.id !== id));
    if (wasCurrent) {
      setCurrentSession(null);
      setMessages([]);
      navigate(chatBasePath, { replace: true });
    }

    try {
      const res = await AdvisorApi.deleteSession(id);
      if (!res.success) throw new Error(res.message ?? 'Xóa thất bại');
    } catch {
      toast.error('Không thể xóa cuộc trò chuyện. Vui lòng thử lại.');
      setSessions(prevSessions);
    }
  };

  // ── Refresh Portal token (khi hết hạn giữa chừng) ────
  const handleRefreshToken = async () => {
    if (!currentSession) return;
    setRefreshingToken(true);
    try {
      await AdvisorApi.refreshPortalToken(currentSession.id);
      toast.success('Đã làm mới token cổng thông tin.');
    } catch {
      toast.error('Không thể làm mới token. Vui lòng thử lại.');
    } finally {
      setRefreshingToken(false);
    }
  };

  // ── Send message (SSE) ───────────────────────────────
  const handleSend = async (text: string) => {
    if (!currentSession || streaming) return;

    const isFirstMessage = messages.length === 0;
    const userMsgId = `user-${Date.now()}`;
    const botMsgId  = `bot-${Date.now()}`;

    setMessages(prev => [
      ...prev,
      { id: userMsgId, role: 'user', content: text, timestamp: new Date() },
      { id: botMsgId,  role: 'assistant', content: '', timestamp: new Date(), isStreaming: true },
    ]);
    setStreaming(true);

    let accumulated = '';

    try {
      await AdvisorApi.streamChat(currentSession.id, text, {
        onChunk: chunk => {
          accumulated += chunk;
          setMessages(prev => prev.map(m =>
            m.id === botMsgId ? { ...m, content: accumulated } : m
          ));
        },
        onDone: data => {
          setMessages(prev => prev.map(m =>
            m.id === botMsgId ? { ...m, content: data.full_response, isStreaming: false, messageId: data.message_id } : m
          ));
          // Endpoint chi tiết trả title suy từ câu hỏi đầu ngay lập tức (endpoint danh
          // sách có thể trễ vài giây) — gọi lại để cập nhật tên ngay trên sidebar.
          if (isFirstMessage) {
            AdvisorApi.getSessionHistory(currentSession.id)
              .then(r => applySessionDetail(r.session))
              .catch(() => {});
          }
        },
        onError: err => {
          toast.error('Lỗi kết nối: ' + err.message);
          setMessages(prev => prev.map(m =>
            m.id === botMsgId ? { ...m, content: accumulated || 'Đã xảy ra lỗi.', isStreaming: false } : m
          ));
        },
      });
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

  useEffect(() => {
    if (!pendingQ || loadingSessions || creatingSession || historyLoading || streaming) return;
    if (!currentSession) {
      if (triedCreate.current) { setPendingQ(null); return; }
      triedCreate.current = true;
      void handleNewChat();
      return;
    }
    const q = pendingQ;
    setPendingQ(null);
    void handleSend(q);
  }, [pendingQ, loadingSessions, creatingSession, historyLoading, streaming, currentSession]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Feedback (like/dislike) ──────────────────────────
  const handleFeedback = async (msgId: string, messageId: string | undefined, value: 'like' | 'dislike') => {
    if (!messageId) return;
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, feedback: value } : m));
    try {
      await AdvisorApi.sendFeedback(messageId, value);
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
      await AdvisorApi.sendRating(score, currentSession.id);
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

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)}
            style={{ position: 'absolute', inset: 0, zIndex: 40, background: 'rgba(15,23,42,0.35)', backdropFilter: 'blur(2px)' }} />
        )}

        <div className={`aai-sidebar${sidebarOpen ? ' open' : ''}`}>
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
            contextLabel="Cố vấn"
          />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f4f6fb', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'white', borderBottom: '1px solid #eef0f5', flexShrink: 0 }}>
            <button className="aai-hamburger" onClick={() => setSidebarOpen(v => !v)} title="Danh sách chat">
              <Menu size={16} />
            </button>
            {currentSession ? (
              <>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#2563eb,#60a5fa)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(37,99,235,0.25)' }}>
                  <GraduationCap size={18} color="white" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>Chatbot cố vấn học tập</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Trực tuyến · Trả lời 24/7</span>
                  </div>
                </div>
                <button
                  onClick={handleRefreshToken}
                  disabled={refreshingToken}
                  title="Làm mới token cổng thông tin (nếu hết hạn giữa chừng)"
                  style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(37,99,235,0.2)', background: 'rgba(37,99,235,0.06)', color: '#2563eb', fontSize: '0.7rem', fontWeight: 700, cursor: refreshingToken ? 'not-allowed' : 'pointer' }}
                >
                  <RefreshCw size={12} style={refreshingToken ? { animation: 'spin 1s linear infinite' } : undefined} />
                  Làm mới token
                </button>
              </>
            ) : (
              <span style={{ flex: 1, fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8' }}>Chọn hoặc tạo cuộc trò chuyện</span>
            )}
            {role === 'student' && (
              <Button variant="outline" onClick={() => navigate('/student/cvht')} title="Dashboard cố vấn học tập: GPA, rủi ro, sổ tư vấn" style={{ flexShrink: 0 }}>
                <LayoutDashboard size={14} /> <span className="hidden sm:inline">Dashboard CVHT</span>
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate(homePath)} title="Về trang chủ" style={{ flexShrink: 0 }}>
              <ArrowLeft size={14} />
            </Button>
          </div>

          {currentSession ? (
            <>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <ChatContent
                  role={role}
                  messages={messages}
                  isStreaming={streaming}
                  sessionId={currentSession?.id}
                  onExamDismiss={() => {}}
                  onExamConfirm={() => {}}
                  onExamPreview={() => {}}
                  onFeedback={handleFeedback}
                />
              </div>
              {showRating && <RatingCard onSubmit={handleRatingSubmit} onSkip={handleRatingSkip} />}
              <ChatInput
                onSend={handleSend}
                isLoading={streaming}
                role="teacher"
                placeholder="Hỏi về điểm, thời khóa biểu, lịch thi, tư vấn ngành nghề…"
                suggestions={SUGGESTIONS[role]}
              />
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '2rem 1rem' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#2563eb,#60a5fa)', boxShadow: '0 4px 20px rgba(37,99,235,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {loadingSessions ? <Loader2 size={30} color="white" style={{ animation: 'spin 1s linear infinite' }} /> : <GraduationCap size={30} color="white" />}
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1e293b' }}>Chatbot cố vấn học tập</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', maxWidth: 320, lineHeight: 1.6 }}>
                Hỏi về <b style={{ color: '#2563eb' }}>điểm, thời khóa biểu, lịch thi, tư vấn ngành nghề</b> — dựa trên dữ liệu Cổng thông tin của bạn.
                <br />Cần hỏi kiến thức, giải bài theo môn? Hãy chuyển sang tab <b>“{role === 'teacher' ? 'Chatbot trợ giảng' : 'Chat môn học'}”</b>.
              </div>
              <button
                onClick={handleNewChat}
                disabled={creatingSession}
                style={{ marginTop: 4, padding: '10px 28px', borderRadius: 12, background: 'linear-gradient(135deg,#2563eb,#60a5fa)', border: 'none', color: 'white', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 2px 10px rgba(37,99,235,0.3)' }}
              >
                {creatingSession ? 'Đang tạo...' : '+ Cuộc trò chuyện mới'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvisorChatPage;
