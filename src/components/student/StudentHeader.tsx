import { type FC } from 'react';
import { Bell, LogOut, Menu } from 'lucide-react';

interface Props {
  unreadCount?: number;
  onBellClick?: () => void;
  onLogout?: () => void;
  onMenuClick?: () => void;
}

const CSS = `
  .sv-hdr-search:focus-within { border-color: #93c5fd !important; background: white !important; }
  .sv-hdr-bell { transition: background .15s, border-color .15s; }
  .sv-hdr-bell:hover { background: #f1f5f9 !important; }
  .sv-hdr-logout { transition: all .15s; }
  .sv-hdr-logout:hover { background: rgba(220,38,38,0.07) !important; border-color: rgba(220,38,38,0.3) !important; }
  .sv-hdr-menu { transition: background .15s; }
  .sv-hdr-menu:hover { background: #f1f5f9 !important; }
`;

const StudentHeader: FC<Props> = ({ unreadCount = 0, onBellClick, onLogout, onMenuClick }) => (
  <div style={{
    height: 56, background: 'white',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex', alignItems: 'center',
    padding: '0 16px', gap: 10,
    position: 'sticky', top: 0, zIndex: 20, flexShrink: 0,
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
    <button
      className="sv-hdr-bell"
      onClick={onBellClick}
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
          fontSize: '0.6rem', fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 4px', border: '2px solid white',
        }}>{unreadCount}</span>
      )}
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

export default StudentHeader;
