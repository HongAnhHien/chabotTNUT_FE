import { Plus, MessageSquare, Trash2, Loader2, Bot } from 'lucide-react';
import type { IChatSession } from '@/infra/api/interfaces/IChat';
import logoTNUT from '@/assets/logo_tnut/logo_tnut.png';

interface Props {
  sessions: IChatSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  isLoading?: boolean;
}

const fmtDate = (iso?: string) => {
  if (!iso) return '';
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(new Date(iso));
};

const ChatHistory = ({ sessions, currentSessionId, onSelectSession, onNewChat, onDeleteSession, isLoading = false }: Props) => (
  <aside style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'white', borderRight: '1px solid rgba(30,58,138,0.1)' }}>

    {/* Header */}
    <div style={{ flexShrink: 0, padding: '14px 14px 12px', background: 'linear-gradient(135deg,#1e3a8a,#2563eb)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
        <img src={logoTNUT} alt="TNUT" style={{ width: 30, height: 30, objectFit: 'contain', flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'white', lineHeight: 1.2 }}>TAI - TNUT</div>
          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.75)' }}>Trợ lý AI giảng viên</div>
        </div>
      </div>
      <button
        onClick={onNewChat}
        disabled={isLoading}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 0', borderRadius: 9, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', fontSize: '0.8rem', fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1 }}
      >
        {isLoading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={13} />}
        Cuộc trò chuyện mới
      </button>
    </div>

    {/* List */}
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {isLoading && sessions.length === 0 ? (
        <div style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
          <Loader2 size={24} color="#3b82f6" style={{ margin: '0 auto 8px', display: 'block', animation: 'spin 1s linear infinite' }} />
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Đang tải...</div>
        </div>
      ) : sessions.length === 0 ? (
        <div style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(37,99,235,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
            <MessageSquare size={20} color="#bfdbfe" />
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>Chưa có cuộc trò chuyện</div>
          <div style={{ fontSize: '0.68rem', color: '#cbd5e1', marginTop: 3 }}>Nhấn nút "+" để bắt đầu</div>
        </div>
      ) : (
        <div style={{ padding: '6px 0' }}>
          {sessions.map(s => {
            const active = s.id === currentSessionId;
            return (
              <div
                key={s.id}
                onClick={() => onSelectSession(s.id)}
                style={{ position: 'relative', padding: '8px 10px', cursor: 'pointer', background: active ? 'rgba(37,99,235,0.07)' : 'transparent', borderLeft: `3px solid ${active ? '#2563eb' : 'transparent'}`, transition: 'background .12s' }}
              >
                {/* bot icon + name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: active ? 'rgba(37,99,235,0.12)' : 'rgba(100,116,139,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Bot size={13} color={active ? '#2563eb' : '#94a3b8'} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: active ? 700 : 500, color: active ? '#1e3a8a' : '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.name || 'Cuộc trò chuyện'}
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                      {s.subject_id && <span style={{ fontSize: '0.6rem', color: '#3b82f6', fontWeight: 700, background: 'rgba(59,130,246,0.08)', borderRadius: 20, padding: '0 5px' }}>{s.subject_id}</span>}
                      {s.updated_at && <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>{fmtDate(s.updated_at)}</span>}
                    </div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); onDeleteSession(s.id); }}
                    style={{ width: 22, height: 22, borderRadius: 6, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', flexShrink: 0, opacity: 0.6 }}
                    title="Xóa"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>

    {/* Footer */}
    <div style={{ flexShrink: 0, padding: '8px 12px', borderTop: '1px solid rgba(30,58,138,0.07)', fontSize: '0.65rem', color: '#94a3b8', textAlign: 'center' }}>
      {sessions.length} cuộc trò chuyện
    </div>
  </aside>
);

export default ChatHistory;
