import { type FC, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  LayoutDashboard, Users, FileSearch, KeyRound,
  ChevronLeft, ChevronRight, X,
} from 'lucide-react';
import logoTNUT from '@/assets/logo_tnut/logo_tnut.png';

interface Props {
  userName?: string;
  userCode?: string;
  userInitials?: string;
  userAvatar?: string;
  // Desktop drawer
  collapsed?: boolean;
  onToggle?: () => void;
  // Mobile overlay drawer
  isMobile?: boolean;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const NAV_SECTIONS = [
  {
    label: 'Tổng quan',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    ],
  },
  {
    label: 'Quản lý',
    items: [
      { icon: Users, label: 'Tài khoản', path: '/admin/dashboard/manage-users' },
    ],
  },
  {
    label: 'Dữ liệu & AI',
    items: [
      { icon: FileSearch, label: 'Nhật ký xử lý', path: '/admin/dashboard/parse-logs' },
      { icon: KeyRound,   label: 'API key LlamaParse', path: '/admin/dashboard/api-settings' },
    ],
  },
];

const ACCENT    = '#2F6B3F';
const ACCENT_BG = 'rgba(47,107,63,0.08)';

const CSS = `
  .av3-item { position:relative; transition:background .14s,color .14s; }
  .av3-item:hover:not([data-active="true"]) { background:#f4f8f5 !important; color:#1e293b !important; }
  .av3-toggle { transition:background .14s; }
  .av3-toggle:hover { background:#eef4ef !important; }
  .av3-close { transition:background .14s; }
  .av3-close:hover { background:#eef4ef !important; }
`;

const AdminSidebar: FC<Props> = ({
  userName, userCode, userInitials, userAvatar,
  collapsed = false, onToggle,
  isMobile = false, mobileOpen = false, onMobileClose,
}) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Đóng sidebar khi navigate trên mobile
  useEffect(() => {
    if (isMobile && mobileOpen) onMobileClose?.();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const avatar = userAvatar
    ? <img src={userAvatar} alt={userName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
    : <span style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '-0.02em' }}>{userInitials ?? 'AD'}</span>;

  const sidebarStyle: React.CSSProperties = isMobile ? {
    position: 'fixed', left: 0, top: 0,
    width: 260, height: '100vh', zIndex: 1000,
    transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
    transition: 'transform 0.26s cubic-bezier(.4,0,.2,1)',
    boxShadow: mobileOpen ? '8px 0 32px rgba(0,0,0,0.12)' : 'none',
    background: '#fff', borderRight: '1px solid #e8edf3',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
  } : {
    width: collapsed ? 64 : 240,
    flexShrink: 0, height: '100vh', position: 'sticky', top: 0,
    background: '#fff', borderRight: '1px solid #e8edf3',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    transition: 'width 0.24s cubic-bezier(.4,0,.2,1)', zIndex: 10,
  };

  const showExpanded = isMobile || !collapsed;

  return (
    <>
      {/* Backdrop mobile */}
      {isMobile && mobileOpen && (
        <div onClick={onMobileClose} style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(1px)',
        }} />
      )}

      <div style={sidebarStyle}>
        <style>{CSS}</style>

        {/* ── Brand ───────────────────────────────── */}
        <div style={{
          height: 68, padding: showExpanded ? '0 14px' : '0',
          display: 'flex', alignItems: 'center', gap: 10,
          justifyContent: showExpanded ? 'flex-start' : 'center',
          flexShrink: 0, borderBottom: '1px solid #f0f4f8',
        }}>
          {showExpanded ? (
            <>
              <img src={logoTNUT} alt="TNUT" style={{ height: 44, width: 'auto', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1e4429', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                  TNUT Learning
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 2, whiteSpace: 'nowrap' }}>
                  Cổng quản trị
                </div>
              </div>
              {isMobile && (
                <button className="av3-close" onClick={onMobileClose} style={{
                  width: 32, height: 32, borderRadius: 8, border: 'none',
                  background: 'transparent', color: '#64748b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', flexShrink: 0,
                }}><X size={16} /></button>
              )}
            </>
          ) : (
            <img src={logoTNUT} alt="TNUT" style={{ width: 38, height: 38, objectFit: 'contain' }} />
          )}
        </div>

        {/* ── Nav ─────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: showExpanded ? '10px 10px' : '10px 8px' }}>
          {NAV_SECTIONS.map(({ label, items }) => (
            <div key={label} style={{ marginBottom: 6 }}>

              {/* Section header */}
              {showExpanded && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 8px 5px' }}>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8',
                    letterSpacing: '0.07em', textTransform: 'uppercase', whiteSpace: 'nowrap',
                  }}>{label}</span>
                  <div style={{ flex: 1, height: 1, background: '#f0f4f8' }} />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {items.map(({ icon: Icon, label: itemLabel, path }) => {
                  const isActive = pathname === path ||
                    (path !== '/admin/dashboard' && pathname.startsWith(path));
                  return (
                    <button key={path} className="av3-item" data-active={isActive}
                      onClick={() => navigate(path)}
                      title={!showExpanded ? itemLabel : undefined}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center',
                        justifyContent: showExpanded ? 'flex-start' : 'center',
                        gap: 10, padding: showExpanded ? '8px 10px' : '10px 0',
                        borderRadius: 9, border: 'none',
                        cursor: 'pointer',
                        background: isActive ? ACCENT_BG : 'transparent',
                        color: isActive ? ACCENT : '#64748b',
                        fontSize: '0.8rem', fontWeight: isActive ? 600 : 400,
                      }}>
                      {isActive && showExpanded && (
                        <div style={{
                          position: 'absolute', left: 0, top: '20%', bottom: '20%',
                          width: 3, borderRadius: '0 2px 2px 0', background: ACCENT,
                        }} />
                      )}
                      <Icon size={17} strokeWidth={isActive ? 2.2 : 1.6} style={{ flexShrink: 0 }} />
                      {showExpanded && <span style={{ flex: 1, textAlign: 'left' }}>{itemLabel}</span>}
                      {showExpanded && isActive && (
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT, opacity: 0.6 }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ── Collapse toggle — desktop only ───────── */}
        {!isMobile && onToggle && (
          <div style={{ padding: collapsed ? '6px 8px' : '6px 10px', borderTop: '1px solid #f0f4f8', flexShrink: 0 }}>
            <button className="av3-toggle" onClick={onToggle}
              title={collapsed ? 'Mở rộng' : 'Thu gọn'}
              style={{
                width: '100%', display: 'flex', alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'space-between',
                padding: '7px 8px', borderRadius: 8, border: 'none',
                cursor: 'pointer', background: 'transparent', color: '#94a3b8', fontSize: '0.7rem',
              }}>
              {!collapsed && <span>Thu gọn</span>}
              {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          </div>
        )}

        {/* ── User footer ─────────────────────────── */}
        <div style={{
          padding: showExpanded ? '10px 12px' : '10px 8px',
          borderTop: '1px solid #f0f4f8', flexShrink: 0, background: '#fafcfa',
        }}>
          {showExpanded ? (
            <div>
              <div
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 8px', borderRadius: 10, background: '#fff',
                  border: '1px solid #e2ebe4', marginBottom: 8, textAlign: 'left',
                }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: 'linear-gradient(135deg,#2F6B3F,#3d7a50)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', overflow: 'hidden', boxShadow: '0 2px 6px rgba(47,107,63,0.22)',
                }}>{avatar}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.8rem', fontWeight: 700, color: '#1e293b',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{userName ?? 'Quản trị viên'}</div>
                  {userCode && <div style={{ marginTop: 2 }}><span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>{userCode}</span></div>}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div title={userName ?? 'Quản trị viên'}
                style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: 'linear-gradient(135deg,#2F6B3F,#3d7a50)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', overflow: 'hidden',
                }}>{avatar}</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
