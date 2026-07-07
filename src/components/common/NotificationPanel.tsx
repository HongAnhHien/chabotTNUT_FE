import { type FC } from 'react';
import { ClipboardList, Bell, Clock, Calendar, Loader2, CheckCheck } from 'lucide-react';
import type { INotification, NotificationType } from '@/infra/api/interfaces/INotification';

const TYPE_META: Record<NotificationType, { icon: typeof Bell; color: string; bg: string }> = {
  assignment_assigned:          { icon: ClipboardList, color: '#2563eb', bg: '#eff5ff' },
  assignment_reminder:          { icon: Bell,           color: '#b45309', bg: '#fffbeb' },
  assignment_due_soon:          { icon: Clock,          color: '#dc2626', bg: '#fef2f2' },
  assignment_due_soon_teacher:  { icon: Clock,          color: '#dc2626', bg: '#fef2f2' },
  exam_schedule_reminder:       { icon: Calendar,       color: '#7c3aed', bg: '#f5f3ff' },
};

const timeAgo = (iso: string) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1)  return 'Vừa xong';
  if (min < 60) return `${min} phút trước`;
  const hr = Math.floor(min / 60);
  if (hr < 24)  return `${hr} giờ trước`;
  const day = Math.floor(hr / 24);
  if (day < 7)  return `${day} ngày trước`;
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso));
};

interface Props {
  notifications: INotification[];
  unreadCount:   number;
  loading:       boolean;
  onMarkRead:    (id: string) => void;
  onMarkAllRead: () => void;
  onItemClick?:  (n: INotification) => void;
}

const CSS = `@keyframes np-spin { to { transform: rotate(360deg); } }`;

const NotificationPanel: FC<Props> = ({ notifications, unreadCount, loading, onMarkRead, onMarkAllRead, onItemClick }) => {
  return (
    <div style={{
      position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 31,
      width: 360, maxWidth: 'calc(100vw - 24px)', background: '#fff',
      border: '1px solid #e7ecf3', borderRadius: 14,
      boxShadow: '0 12px 34px rgba(15,23,42,.14)', overflow: 'hidden',
      fontFamily: "'Be Vietnam Pro',system-ui,sans-serif",
    }}>
      <style>{CSS}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderBottom: '1px solid #f1f5f9' }}>
        <span style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>Thông báo</span>
        {unreadCount > 0 && (
          <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', background: '#ef4444', borderRadius: 999, padding: '1px 7px' }}>{unreadCount}</span>
        )}
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', padding: 0 }}
          >
            <CheckCheck size={13} /> Đọc tất cả
          </button>
        )}
      </div>

      <div style={{ maxHeight: 380, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: '28px 0', textAlign: 'center' }}>
            <Loader2 size={20} color="#94a3b8" style={{ animation: 'np-spin 1s linear infinite' }} />
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
            Không có thông báo nào.
          </div>
        ) : notifications.map(n => {
          const meta = TYPE_META[n.type] ?? { icon: Bell, color: '#64748b', bg: '#f1f5f9' };
          const Icon = meta.icon;
          const unread = !n.read_at;
          return (
            <div
              key={n.id}
              onClick={() => { if (unread) onMarkRead(n.id); onItemClick?.(n); }}
              style={{
                display: 'flex', gap: 10, padding: '11px 14px',
                borderBottom: '1px solid #f8fafc', cursor: 'pointer',
                background: unread ? '#f8fbff' : '#fff', transition: 'background .12s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = unread ? '#eff5ff' : '#f8fafc'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = unread ? '#f8fbff' : '#fff'; }}
            >
              <span style={{ width: 32, height: 32, borderRadius: 9, background: meta.bg, color: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={15} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: unread ? 700 : 600, color: '#0f172a', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</span>
                  {unread && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2563eb', flexShrink: 0 }} />}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.body}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{timeAgo(n.created_at)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NotificationPanel;
