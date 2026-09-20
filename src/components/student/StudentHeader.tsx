import { type FC, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Bell, LogOut, Menu, Compass } from 'lucide-react';
import NotificationPanel from '@/components/common/NotificationPanel';
import type { INotification } from '@/infra/api/interfaces/INotification';

interface Props {
  notifications?: INotification[];
  unreadCount?: number;
  notifLoading?: boolean;
  onMarkRead?: (id: string) => void;
  onMarkAllRead?: () => void;
  onNotificationClick?: (n: INotification) => void;
  onLogout?: () => void;
  onMenuClick?: () => void;
  isMobile?: boolean;
  notificationsPath?: string;
}

const CSS = `
  .sv-hdr-search:focus-within { border-color: #93c5fd !important; background: white !important; }
  .sv-hdr-bell { transition: background .15s, border-color .15s; }
  .sv-hdr-bell:hover { background: #f1f5f9 !important; }
  .sv-hdr-logout { transition: all .15s; }
  .sv-hdr-logout:hover { background: rgba(220,38,38,0.07) !important; border-color: rgba(220,38,38,0.3) !important; }
  .sv-hdr-atlas { transition: all .15s; }
  .sv-hdr-atlas:hover { background: rgba(37,99,235,0.11) !important; border-color: rgba(37,99,235,0.4) !important; }
  .sv-hdr-menu { transition: background .15s; }
  .sv-hdr-menu:hover { background: #f1f5f9 !important; }
`;

const StudentHeader: FC<Props> = ({
  notifications = [], unreadCount = 0, notifLoading = false,
  onMarkRead, onMarkAllRead, onNotificationClick,
  onLogout, onMenuClick, isMobile = false, notificationsPath,
}) => {
  const navigate = useNavigate();
  const [panelOpen, setPanelOpen] = useState(false);
  const bellWrapRef = useRef<HTMLDivElement>(null);

  const handleBellClick = () => {
    // Mobile: mở trang thông báo riêng thay vì dropdown panel (đỡ chật, dễ thao tác hơn)
    if (isMobile && notificationsPath) navigate(notificationsPath);
    else setPanelOpen(v => !v);
  };

  useEffect(() => {
    if (!panelOpen) return;
    const handler = (e: MouseEvent) => {
      if (!bellWrapRef.current?.contains(e.target as Node)) setPanelOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [panelOpen]);

  return (
  <div style={{
    height: 56, background: 'white',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex', alignItems: 'center',
    padding: '0 16px', gap: 10,
    position: 'sticky', top: 0, zIndex: 30, flexShrink: 0,
  }}>
    <style>{CSS}</style>

    {/* Hamburger — chỉ hiện khi onMenuClick được truyền (mobile) */}
    {onMenuClick && (
      <button
        className="sv-hdr-menu"
        onClick={onMenuClick}
        style={{
          width: 36, height: 36, borderRadius: 9,
          border: '1px solid #e2e8f0', background: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#475569', flexShrink: 0,
        }}
      >
        <Menu size={17} />
      </button>
    )}


    <div style={{ flex: 1 }} />

    {/* Bell */}
    <div ref={bellWrapRef} style={{ position: 'relative' }}>
      <button
        className="sv-hdr-bell"
        onClick={handleBellClick}
        style={{
          position: 'relative', width: 36, height: 36, borderRadius: 9,
          border: '1px solid #e2e8f0', background: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#475569', flexShrink: 0,
        }}
      >
        <Bell size={15} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -5, right: -5,
            minWidth: 17, height: 17, borderRadius: 99,
            background: '#ef4444', color: 'white',
            fontSize: '0.7rem', fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px', border: '2px solid white',
          }}>{unreadCount}</span>
        )}
      </button>

      {panelOpen && !isMobile && (
        <NotificationPanel
          notifications={notifications}
          unreadCount={unreadCount}
          loading={notifLoading}
          onMarkRead={id => onMarkRead?.(id)}
          onMarkAllRead={() => onMarkAllRead?.()}
          onItemClick={n => { onNotificationClick?.(n); setPanelOpen(false); }}
        />
      )}
    </div>

    {/* Về Atlas (trang chủ hệ sinh thái) */}
    <button
      className="sv-hdr-atlas"
      onClick={() => navigate('/atlas')}
      title="Về trang chủ Atlas TNUT"
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '7px 13px', borderRadius: 9,
        border: '1px solid rgba(37,99,235,0.22)',
        background: 'rgba(37,99,235,0.06)',
        color: '#2563eb', fontSize: '0.78rem', fontWeight: 600,
        cursor: 'pointer', flexShrink: 0,
      }}
    >
      <Compass size={14} />
      <span style={{ display: onMenuClick ? 'none' : 'inline' }}>Về Atlas</span>
    </button>

    {/* Logout */}
    <button
      className="sv-hdr-logout"
      onClick={onLogout}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '7px 13px', borderRadius: 9,
        border: '1px solid rgba(220,38,38,0.18)',
        background: 'rgba(220,38,38,0.04)',
        color: '#dc2626', fontSize: '0.78rem', fontWeight: 600,
        cursor: 'pointer', flexShrink: 0,
      }}
    >
      <LogOut size={13} />
      <span style={{ display: onMenuClick ? 'none' : 'inline' }}>Đăng xuất</span>
    </button>
  </div>
  );
};

export default StudentHeader;
