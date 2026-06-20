import { type FC, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  BookOpen, ClipboardList, MessageCircle,
  Bell, User, LogOut, ChevronRight,
  GraduationCap, Sparkles, ArrowUpRight,
} from 'lucide-react';
import { useAuthStore } from '@/views/pages/stores/auth_store';
import logoTNUT from '@/assets/logo_tnut/logo_tnut.png';

const CSS = `
  @keyframes aspx-fade { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  @keyframes aspx-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
  @keyframes aspx-dot { 0%,100%{opacity:1} 50%{opacity:.3} }
  .aspx-card {
    background: rgba(255,255,255,0.75);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.95);
    border-radius: 20px;
    box-shadow: 0 4px 24px rgba(37,99,235,0.07);
    transition: transform .2s, box-shadow .2s;
    cursor: pointer;
    animation: aspx-fade .4s ease both;
  }
  .aspx-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 36px rgba(37,99,235,0.14);
  }
  .aspx-notif-item {
    padding: 12px 0;
    border-bottom: 1px solid rgba(37,99,235,0.07);
    cursor: pointer;
    transition: background .15s;
    border-radius: 10px;
  }
  .aspx-notif-item:hover { background: rgba(37,99,235,0.04); padding-left: 6px; }
  .aspx-notif-item:last-child { border-bottom: none; }
  .aspx-nav-btn {
    display:flex; align-items:center; justify-content:center;
    width:32px; height:32px; border-radius:8px;
    border:1px solid rgba(0,0,0,0.08); background:transparent;
    color:#64748b; cursor:pointer;
    transition: background .15s, color .15s;
  }
  .aspx-nav-btn:hover { background:rgba(0,0,0,0.05); color:#0f172a; }
  .aspx-nav-user {
    display:flex; align-items:center; gap:8px;
    padding:4px 10px 4px 4px; border-radius:999px;
    border:1px solid rgba(0,0,0,0.08); background:transparent;
    cursor:pointer; transition: background .15s;
  }
  .aspx-nav-user:hover { background:rgba(0,0,0,0.04); }
  .aspx-nav-logout {
    display:flex; align-items:center; gap:5px;
    padding:5px 10px; border-radius:8px;
    border:1px solid rgba(0,0,0,0.08); background:transparent;
    color:#64748b; font-size:.8rem; font-weight:500; cursor:pointer;
    transition: background .15s, color .15s;
  }
  .aspx-nav-logout:hover { background:rgba(220,38,38,0.06); color:#dc2626; border-color:rgba(220,38,38,0.2); }

  /* ── Responsive layouts ── */
  .aspx-hero   { padding: 2rem 1.5rem; }
  .aspx-main   { max-width:1200px; margin:0 auto; padding:1.5rem; display:grid; grid-template-columns:300px 1fr; gap:1.25rem; }
  .aspx-feat   { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; }
  .aspx-nav-title  { font-size:.825rem; font-weight:700; color:#0f172a; letter-spacing:-.01em; white-space:nowrap; }
  .aspx-nav-name   { font-size:.8rem; font-weight:500; color:#1e293b; max-width:140px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

  @media (max-width:1024px) {
    .aspx-main { grid-template-columns: 1fr; }
    .aspx-feat { grid-template-columns: repeat(2,1fr); }
  }
  @media (max-width:640px) {
    .aspx-hero  { padding: 1.25rem 1rem; }
    .aspx-main  { padding: 1rem; gap: .875rem; }
    .aspx-feat  { grid-template-columns: 1fr; }
    .aspx-nav-title { display: none; }
    .aspx-nav-name  { display: none; }
  }
`;

const NOTIFICATIONS = [
  { id: 1, tag: 'Thông báo', tagColor: '#2563eb', date: '17/06/2026', title: 'Lịch thi cuối kỳ học kỳ II năm học 2025–2026', unread: true },
  { id: 2, tag: 'Học vụ',    tagColor: '#059669', date: '15/06/2026', title: 'Đăng ký học phần học kỳ I năm học 2026–2027', unread: true },
  { id: 3, tag: 'Học bổng',  tagColor: '#d97706', date: '12/06/2026', title: 'Học bổng khuyến khích học tập học kỳ II', unread: false },
  { id: 4, tag: 'Sự kiện',   tagColor: '#7c3aed', date: '10/06/2026', title: 'Tuần sinh hoạt công dân đầu khóa 2026–2027', unread: false },
  { id: 5, tag: 'Thông báo', tagColor: '#2563eb', date: '05/06/2026', title: 'Thông báo lịch nghỉ hè năm học 2025–2026', unread: false },
];

const FEATURES = [
  {
    icon: BookOpen,
    label: 'Môn học của tôi',
    desc: 'Danh sách môn học đang học trong học kỳ hiện tại',
    path: '/student/subjects',
    gradient: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
    delay: '0s',
  },
  {
    icon: ClipboardList,
    label: 'Bài kiểm tra',
    desc: 'Làm bài kiểm tra được giao từ giáo viên',
    path: '/student/assignments',
    gradient: 'linear-gradient(135deg, #065f46, #059669)',
    delay: '.07s',
  },
  {
    icon: MessageCircle,
    label: 'Chatbot cố vấn học tập',
    desc: 'Trợ lý AI tư vấn học tập và giải đáp 24/7',
    path: '/student/chat',
    gradient: 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
    delay: '.14s',
  },
];

const StudentAspx: FC = () => {
  const navigate  = useNavigate();
  const notifRef  = useRef<HTMLDivElement>(null);
  const user      = useAuthStore(s => s.user);
  const logout    = useAuthStore(s => s.logout);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

   const [isScrolled, setIsScrolled] = useState(false);

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const unreadCount = NOTIFICATIONS.filter(n => n.unread).length;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #eef4ff 0%, #e0eaff 100%)',
      fontFamily: "'Be Vietnam Pro', system-ui, sans-serif",
    }}>
      <style>{CSS}</style>

      {/* ══ NAVBAR ══ */}
      <div  className={`
          sticky top-0 
          z-30 border-border border-b-none border-x backdrop-blur-md
          transition-[background-color,box-shadow] duration-300 ease-in-out 
          ${isScrolled ? "bg-background/40 shadow-md" : "bg-background"}
        `}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', gap: 12, height: 56 }}>
          {/* Brand */}
          <img src={logoTNUT} alt="TNUT" style={{ width: 30, height: 30, objectFit: 'contain', flexShrink: 0 }} />
          <div style={{ width: 1, height: 20, background: 'rgba(0,0,0,0.1)', flexShrink: 0 }} />
          <span className="aspx-nav-title">Cổng sinh viên</span>

          <div style={{ flex: 1 }} />

          {/* Bell */}
          <button className="aspx-nav-btn" style={{ position: 'relative' }} onClick={() => notifRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
            <Bell size={15} />
            {unreadCount > 0 && <span style={{ position: 'absolute', top: 7, right: 7, width: 5, height: 5, borderRadius: '50%', background: '#ef4444' }} />}
          </button>

          <div style={{ width: 1, height: 20, background: 'rgba(0,0,0,0.08)', flexShrink: 0 }} />

          {/* User pill */}
          {/* <button className="aspx-nav-user" onClick={() => navigate('/student/profile')}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#1e3a8a,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: 800, color: 'white', flexShrink: 0, boxShadow: '0 1px 4px rgba(37,99,235,0.3)' }}>
              {user?.name?.split(' ').map((w: string) => w[0]).slice(-2).join('').toUpperCase() ?? 'SV'}
            </div>
            <span className="aspx-nav-name">{user?.name ?? user?.username}</span>
          </button> */}

          {/* Logout */}
          <button className="aspx-nav-logout" onClick={handleLogout}>
            <LogOut size={13} />
            Đăng xuất
          </button>
        </div>
      </div>

      {/* ══ HERO BANNER ══ */}
      <div className="aspx-hero" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 60%, #3b82f6 100%)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 280, height: 280, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: -40, left: '40%', width: 200, height: 200, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)' }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Sparkles size={18} color="#93c5fd" />
            <span style={{ fontSize: '0.8rem', color: '#93c5fd', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Trợ lý học thuật AI
            </span>
          </div>
          <h1 style={{ margin: '0 0 6px', fontSize: '1.5rem', fontWeight: 800, color: 'white' }}>
            Chào mừng trở lại, {user?.name?.split(' ').pop() ?? 'Sinh viên'}! 👋
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'rgba(255,255,255,0.65)' }}>
            {user?.username} &nbsp;·&nbsp; {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* ══ MAIN CONTENT ══ */}
      <div className="aspx-main">

        {/* ── LEFT: THÔNG BÁO ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Panel */}
          <div ref={notifRef} style={{
            background: 'rgba(255,255,255,0.78)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.95)',
            borderRadius: 20,
            boxShadow: '0 4px 24px rgba(37,99,235,0.07)',
            overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{
              padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: '1px solid rgba(37,99,235,0.08)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bell size={16} color="#2563eb" />
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e3a8a' }}>Thông báo</span>
                {unreadCount > 0 && (
                  <span style={{
                    background: '#2563eb', color: 'white',
                    borderRadius: '20px', padding: '1px 7px',
                    fontSize: '0.7rem', fontWeight: 700,
                  }}>{unreadCount}</span>
                )}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#2563eb', cursor: 'pointer', fontWeight: 600 }}>Xem tất cả</span>
            </div>

            {/* List */}
            <div style={{ padding: '6px 12px' }}>
              {NOTIFICATIONS.map(n => (
                <div key={n.id} className="aspx-notif-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{
                      background: `${n.tagColor}18`, color: n.tagColor,
                      border: `1px solid ${n.tagColor}30`,
                      borderRadius: '20px', padding: '1px 8px',
                      fontSize: '0.65rem', fontWeight: 700,
                    }}>{n.tag}</span>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{n.date}</span>
                    {n.unread && (
                      <span style={{ marginLeft: 'auto', width: 7, height: 7, borderRadius: '50%', background: '#2563eb', flexShrink: 0 }} />
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#1e293b', lineHeight: 1.45, fontWeight: n.unread ? 600 : 400 }}>
                    {n.title}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick profile card */}
          <div
            onClick={() => navigate('/student/profile')}
            style={{
              background: 'rgba(255,255,255,0.78)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.95)',
              borderRadius: 20,
              boxShadow: '0 4px 24px rgba(37,99,235,0.07)',
              padding: '14px 16px',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 12,
              transition: 'transform .2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
          >
            <div style={{
              width: 42, height: 42, borderRadius: 12, flexShrink: 0,
              background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <User size={20} color="white" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e3a8a' }}>Hồ sơ sinh viên</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>Xem thông tin tài khoản</div>
            </div>
            <ArrowUpRight size={16} color="#2563eb" />
          </div>
        </div>

        {/* ── RIGHT: FEATURES ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Section title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <GraduationCap size={20} color="#2563eb" />
            <span style={{ fontWeight: 700, fontSize: '1rem', color: '#1e3a8a' }}>Học vụ & Công cụ</span>
          </div>

          {/* Feature cards */}
          <div className="aspx-feat">
            {FEATURES.map(({ icon: Icon, label, desc, path, gradient, delay }) => (
              <div
                key={path}
                className="aspx-card"
                style={{ animationDelay: delay, padding: '1.5rem' }}
                onClick={() => navigate(path)}
              >
                {/* Icon */}
                <div style={{
                  width: 52, height: 52, borderRadius: 16,
                  background: gradient,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '1rem',
                  boxShadow: '0 6px 18px rgba(37,99,235,0.22)',
                }}>
                  <Icon size={24} color="white" strokeWidth={1.8} />
                </div>

                {/* Text */}
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b', marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.55, marginBottom: '1.25rem' }}>{desc}</div>

                {/* CTA */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: '0.8rem', fontWeight: 700, color: '#2563eb',
                }}>
                  Truy cập <ChevronRight size={14} />
                </div>
              </div>
            ))}
          </div>

          {/* Coming soon placeholder */}
          <div style={{
            background: 'rgba(255,255,255,0.5)',
            backdropFilter: 'blur(12px)',
            border: '1px dashed rgba(37,99,235,0.25)',
            borderRadius: 20,
            padding: '1.5rem',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <Sparkles size={22} color="#2563eb" style={{ animation: 'aspx-pulse 2s ease infinite', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e3a8a' }}>Tính năng sắp ra mắt</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 3 }}>
                Lộ trình học tập cá nhân hóa, Theo dõi tiến độ, Nhắc nhở lịch thi — đang được phát triển.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ FOOTER ══ */}
      <div style={{
        borderTop: '1px solid rgba(37,99,235,0.1)',
        padding: '12px 1.5rem',
        textAlign: 'center',
        fontSize: '0.75rem', color: '#94a3b8',
      }}>
        © 2026 Trường Đại học Kỹ thuật Công nghiệp Thai Nguyen University of Technology
        &nbsp;·&nbsp; hotro@tnut.edu.vn &nbsp;·&nbsp; (0208) 384.6145
      </div>
    </div>
  );
};

export default StudentAspx;
