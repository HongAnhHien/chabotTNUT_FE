import { Plus, MessageSquare, Trash2, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { IChatSession } from '@/infra/api/interfaces/IChat';

interface Props {
  sessions: IChatSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  isLoading?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const fmtDate = (iso?: string) => {
  if (!iso) return '';
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(new Date(iso));
};

const ChatHistory = ({ sessions, currentSessionId, onSelectSession, onNewChat, onDeleteSession, isLoading = false, collapsed = false, onToggleCollapse }: Props) => (
  <aside style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', background: 'white', borderRight: '1px solid #e8edf3', overflow: 'hidden' }}>

    {/* New chat button + collapse toggle */}
    <div style={{ flexShrink: 0, padding: collapsed ? '14px 8px 10px' : '14px 12px 10px', display: 'flex', gap: 6, alignItems: 'center' }}>
      <button onClick={onNewChat} disabled={isLoading} title="Hội thoại mới" style={{
        flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
        padding: '10px', borderRadius: 10, background: 'linear-gradient(135deg,#2563eb,#3b82f6)',
        border: 'none', color: 'white', fontSize: '0.82rem', fontWeight: 700,
        cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1,
        boxShadow: '0 2px 10px rgba(37,99,235,0.28)', transition: 'opacity .15s',
      }}>
        {isLoading
          ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
          : <Plus size={14} />
        }
        {!collapsed && 'Hội thoại mới'}
      </button>
      {onToggleCollapse && (
        <button onClick={onToggleCollapse} title={collapsed ? 'Mở rộng danh sách' : 'Thu gọn danh sách'} style={{
          flexShrink: 0, width: 32, height: 32, borderRadius: 8,
          background: 'rgba(100,116,139,0.08)', border: '1px solid rgba(100,116,139,0.15)',
          color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      )}
    </div>

    {/* List */}
    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
      {isLoading && sessions.length === 0 ? (
        <div style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
          <Loader2 size={22} color="#3b82f6" style={{ margin: '0 auto 8px', display: 'block', animation: 'spin 1s linear infinite' }} />
          {!collapsed && <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Đang tải...</div>}
        </div>
      ) : sessions.length === 0 ? (
        <div style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(37,99,235,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
            <MessageSquare size={20} color="#bfdbfe" />
          </div>
          {!collapsed && (
            <>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>Chưa có cuộc trò chuyện</div>
              <div style={{ fontSize: '0.7rem', color: '#cbd5e1', marginTop: 3 }}>Nhấn "Hội thoại mới" để bắt đầu</div>
            </>
          )}
        </div>
      ) : (
        <div style={{ padding: collapsed ? '0 6px' : '0 8px' }}>
          {!collapsed && (
            <div style={{ padding: '8px 4px 4px', fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Gần đây
            </div>
          )}
          {sessions.map(s => {
            const active = s.id === currentSessionId;
            return (
              <div key={s.id} onClick={() => onSelectSession(s.id)} title={collapsed ? (s.name || 'Cuộc trò chuyện') : undefined} style={{
                position: 'relative', padding: '8px', cursor: 'pointer', borderRadius: 9, marginBottom: 1,
                background: active ? 'rgba(37,99,235,0.08)' : 'transparent', transition: 'background .12s',
                display: 'flex', justifyContent: collapsed ? 'center' : 'flex-start',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, width: collapsed ? 'auto' : '100%' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: active ? 'rgba(37,99,235,0.13)' : 'rgba(100,116,139,0.07)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <MessageSquare size={13} color={active ? '#2563eb' : '#94a3b8'} />
                  </div>
                  {!collapsed && (
                    <>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '0.78rem', fontWeight: active ? 700 : 500,
                          color: active ? '#1e3a8a' : '#334155',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {s.name || 'Cuộc trò chuyện'}
                        </div>
                        <div style={{ display: 'flex', gap: 5, marginTop: 1 }}>
                          {s.subject_id && (
                            <span style={{ fontSize: '0.7rem', color: '#3b82f6', fontWeight: 700, background: 'rgba(59,130,246,0.08)', borderRadius: 20, padding: '0 6px' }}>
                              {s.subject_id}
                            </span>
                          )}
                          {s.updated_at && <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{fmtDate(s.updated_at)}</span>}
                        </div>
                      </div>
                      <button onClick={e => { e.stopPropagation(); onDeleteSession(s.id); }} style={{
                        width: 22, height: 22, borderRadius: 6, background: 'none', border: 'none',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#94a3b8', flexShrink: 0, opacity: 0.5,
                      }} title="Xóa">
                        <Trash2 size={12} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>

    {/* Footer */}
    <div style={{
      flexShrink: 0, padding: collapsed ? '8px 0' : '8px 14px', borderTop: '1px solid rgba(30,58,138,0.07)',
      display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
      gap: 6, fontSize: '0.7rem', color: '#94a3b8',
    }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
      {!collapsed && `${sessions.length} lượt hỏi học kỳ này`}
    </div>
  </aside>
);

export default ChatHistory;
