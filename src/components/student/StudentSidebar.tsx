import { type FC, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  LayoutDashboard, BookOpen, MessageCircle, GraduationCap,
  ChevronLeft, ChevronRight,
  ChevronRight as ArrowRight, X, CalendarDays,
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
      { icon: LayoutDashboard, label: 'Dashboard', path: '/student/dashboard' },
      { icon: GraduationCap,   label: 'Cố vấn học tập', path: '/student/cvht' },
    ],
  },
  {
    label: 'Học tập',
    items: [
      { icon: BookOpen,      label: 'Môn học',      path: '/student/subjects' },
      { icon: MessageCircle, label: 'Chatbot AI',   path: '/student/chat' },
      { icon: CalendarDays,  label: 'Lịch học',     path: '/student/schedule' },
    ],
  },
];

const ACCENT    = '#2563eb';
const ACCENT_BG = 'rgba(37,99,235,0.07)';

const CSS = `
  .sv3-item { position:relative; transition:background .14s,color .14s; }
  .sv3-item:hover:not([data-active="true"]) { background:#f8fafc !important; color:#1e293b !important; }
  .sv3-toggle { transition:background .14s; }
  .sv3-toggle:hover { background:#f1f5f9 !important; }
  .sv3-profile-card { transition:background .14s; }
  .sv3-profile-card:hover { background:#f0f6ff !important; }
  .sv3-close { transition:background .14s; }
  .sv3-close:hover { background:#f1f5f9 !important; }
`;

const StudentSidebar: FC<Props> = ({
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
    : <span style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '-0.02em' }}>{userInitials ?? 'SV'}</span>;

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
                <div style={{ fontSize: '0.73rem', fontWeight: 800, color: '#1e3a8a', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                  TNUT Learning
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 2, whiteSpace: 'nowrap' }}>
                  Cổng sinh viên · Trợ lý AI
                </div>
              </div>
              {isMobile && (
                <button className="sv3-close" onClick={onMobileClose} style={{
                  width: 32, height: 32, borderRadius: 8, border: 'none',
                  background: 'transparent', color: '#94a3b8',
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
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 8px 5px',
                }}>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8',
                    letterSpacing: '0.07em', textTransform: 'uppercase', whiteSpace: 'nowrap',
                  }}>{label}</span>
                  <div style={{ flex: 1, height: 1, background: '#f0f4f8' }} />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {items.map(({ icon: Icon, label: itemLabel, path, soon }: { icon: React.ElementType; label: string; path: string; soon?: boolean }) => {
                  const isActive = !soon && (pathname === path ||
                    (path !== '/student/dashboard' && pathname.startsWith(path)));
                  return (
                    <button key={path} className={soon ? '' : 'sv3-item'} data-active={isActive}
                      onClick={soon ? undefined : () => navigate(path)}
                      title={!showExpanded ? itemLabel : undefined}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center',
                        justifyContent: showExpanded ? 'flex-start' : 'center',
                        gap: 10, padding: showExpanded ? '8px 10px' : '10px 0',
                        borderRadius: 9, border: 'none',
                        cursor: soon ? 'default' : 'pointer',
                        background: isActive ? ACCENT_BG : 'transparent',
                        color: isActive ? ACCENT : soon ? '#c1cbd6' : '#64748b',
                        fontSize: '0.8rem', fontWeight: isActive ? 600 : 400,
                        opacity: soon ? 0.7 : 1,
                      }}>
                      {isActive && showExpanded && (
                        <div style={{
                          position: 'absolute', left: 0, top: '20%', bottom: '20%',
                          width: 3, borderRadius: '0 2px 2px 0', background: ACCENT,
                        }} />
                      )}
                      <Icon size={17} strokeWidth={isActive ? 2.2 : 1.6} style={{ flexShrink: 0 }} />
                      {showExpanded && <span style={{ flex: 1, textAlign: 'left' }}>{itemLabel}</span>}
                      {showExpanded && soon && (
                        <span style={{
                          fontSize: '0.7rem', fontWeight: 700, flexShrink: 0,
                          color: '#f59e0b', background: 'rgba(245,158,11,0.1)',
                          padding: '2px 5px', borderRadius: 4, letterSpacing: '0.04em',
                        }}>Sắp ra</span>
                      )}
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
            <button className="sv3-toggle" onClick={onToggle}
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
          borderTop: '1px solid #f0f4f8', flexShrink: 0, background: '#fafbfd',
        }}>
          {showExpanded ? (
            <div>
              <button className="sv3-profile-card" onClick={() => navigate('/student/profile')}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 8px', borderRadius: 10, background: '#fff',
                  border: '1px solid #e2eaf3', marginBottom: 8, cursor: 'pointer', textAlign: 'left',
                }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: 'linear-gradient(135deg,#1d4ed8,#60a5fa)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', overflow: 'hidden', boxShadow: '0 2px 6px rgba(37,99,235,0.2)',
                }}>{avatar}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.8rem', fontWeight: 700, color: '#1e293b',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{userName ?? 'Sinh viên'}</div>
                  {userCode && (
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 1, fontWeight: 500 }}>{userCode}</div>
                  )}
                </div>
                <ArrowRight size={13} color="#cbd5e1" style={{ flexShrink: 0 }} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div onClick={() => navigate('/student/profile')} title={userName ?? 'Sinh viên'}
                style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: 'linear-gradient(135deg,#1d4ed8,#60a5fa)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', overflow: 'hidden', cursor: 'pointer',
                }}>{avatar}</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default StudentSidebar;
