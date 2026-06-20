import { type FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft, User, Mail, Shield, Calendar,
  Activity, Key, Clock, LogIn, Hash,
  GraduationCap, RefreshCw, LogOut, Briefcase,
} from 'lucide-react';
import AuthRepository from '@/infra/AuthRepository';
import { useAuthStore } from '@/views/pages/stores/auth_store';
import type { IUserMe, ITeacherProfileData } from '@/infra/api/interfaces/IUser';

// ── helpers ──────────────────────────────────────────
function fmtDate(iso: string | undefined): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}

function fmtDateShort(iso: string | undefined): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(new Date(iso));
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).filter(Boolean).slice(-2).join('').toUpperCase();
}

function isTeacherProfile(p: IUserMe['profile']): p is ITeacherProfileData {
  return 'teacher_code' in p;
}

const CSS = `
  @keyframes tp-spin  { to { transform: rotate(360deg); } }
  @keyframes tp-pulse { 0%,100%{opacity:.6} 50%{opacity:1} }
  .tp-skeleton {
    background: linear-gradient(90deg,#e0eaff 25%,#c7d9fe 50%,#e0eaff 75%);
    background-size: 200% 100%;
    animation: tp-pulse 1.4s ease infinite;
    border-radius: 8px;
  }
`;

// ── Sub-components ─────────────────────────────────────
const Sk: FC<{ w?: string; h?: string }> = ({ w = '100%', h = '16px' }) => (
  <div className="tp-skeleton" style={{ width: w, height: h }} />
);

const InfoRow: FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(37,99,235,0.08)' }}>
    <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: 'rgba(37,99,235,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {icon}
    </div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: 600, wordBreak: 'break-all' }}>{value}</div>
    </div>
  </div>
);

// ── Main ─────────────────────────────────────────────
const TeacherProfile: FC = () => {
  const navigate = useNavigate();
  const logout   = useAuthStore(s => s.logout);
  const [user, setUser]             = useState<IUserMe | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const fetchProfile = () => {
    setLoading(true);
    setError(null);
    AuthRepository.getMe()
      .then(res => setUser(res.data))
      .catch(() => setError('Không thể tải thông tin. Vui lòng thử lại.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const teacherProfile = user?.profile && isTeacherProfile(user.profile) ? user.profile : null;

  const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.82)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.95)',
    borderRadius: 20,
    boxShadow: '0 8px 32px rgba(37,99,235,0.08)',
    padding: '1.5rem',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#eef4ff', fontFamily: "'Be Vietnam Pro',system-ui,sans-serif", padding: '1.5rem' }}>
      <style>{CSS}</style>

      {/* ── Top bar ── */}
      <div style={{ maxWidth: 900, margin: '0 auto 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => navigate(-1)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: '#1e3a8a' }}
          >
            <ArrowLeft size={16} /> Quay lại
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={fetchProfile}
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 10, padding: '8px 14px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontWeight: 600, color: '#2563eb' }}
            >
              <RefreshCw size={15} style={{ animation: loading ? 'tp-spin 0.8s linear infinite' : 'none' }} />
              Làm mới
            </button>
            <button
              onClick={handleLogout}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: '#dc2626' }}
            >
              <LogOut size={15} />
              Đăng xuất
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* ── HEADER CARD ── */}
        <div style={{ borderRadius: 24, overflow: 'hidden', boxShadow: '0 12px 40px rgba(37,99,235,0.14)' }}>
          {/* Banner */}
          <div style={{ background: 'linear-gradient(135deg,#1e3a8a 0%,#1d4ed8 55%,#3b82f6 100%)', padding: '2rem 2rem 0', position: 'relative' }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)' }} />
            <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.14)' }} />

            <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.25rem' }}>
                {/* Avatar */}
                <div style={{ width: 88, height: 88, borderRadius: 22, flexShrink: 0, background: 'linear-gradient(145deg,rgba(255,255,255,0.3),rgba(255,255,255,0.1))', border: '3px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', fontWeight: 800, color: 'white', backdropFilter: 'blur(8px)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', marginBottom: 8 }}>
                  {loading ? <User size={32} color="rgba(255,255,255,0.6)" /> : initials(user?.name ?? 'GV')}
                </div>
                <div style={{ paddingBottom: '1rem', color: 'white' }}>
                  {loading
                    ? <><Sk w="160px" h="22px" /><div style={{ marginTop: 8 }}><Sk w="200px" h="14px" /></div></>
                    : <>
                        <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, lineHeight: 1.2 }}>{user?.name}</h1>
                        <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'rgba(255,255,255,0.72)' }}>{user?.email}</p>
                      </>
                  }
                </div>
              </div>

              {/* Go to dashboard button */}
              <button
                onClick={() => navigate('/teacher/dashboard')}
                style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.35)', borderRadius: 12, padding: '8px 16px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, color: 'white' }}
              >
                <Briefcase size={14} /> Trang giảng viên
              </button>
            </div>
          </div>

          {/* White bottom */}
          <div style={{ background: 'white', padding: '1rem 2rem 1.5rem' }}>
            {loading ? (
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <Sk w="90px" h="24px" />
                <Sk w="110px" h="24px" />
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '1.25rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(37,99,235,0.08)', color: '#2563eb', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 20, padding: '4px 12px', fontSize: '0.78rem', fontWeight: 700 }}>
                  <GraduationCap size={12} /> Giảng viên
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(16,185,129,0.08)', color: '#059669', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 20, padding: '4px 12px', fontSize: '0.78rem', fontWeight: 700 }}>
                  <Activity size={12} /> Đang hoạt động
                </span>
                {user?.username && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(124,58,237,0.08)', color: '#7c3aed', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 20, padding: '4px 12px', fontSize: '0.78rem', fontWeight: 700 }}>
                    <Hash size={12} /> {user.username}
                  </span>
                )}
              </div>
            )}

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
              {[
                { label: 'Lần đăng nhập', value: loading ? null : String(user?.login_count ?? 0),           icon: <LogIn size={16} color="#2563eb" /> },
                { label: 'Đăng nhập đầu',  value: loading ? null : fmtDateShort(user?.first_login_at),       icon: <Calendar size={16} color="#2563eb" /> },
                { label: 'Đăng nhập cuối', value: loading ? null : fmtDateShort(user?.last_login_at),        icon: <Clock size={16} color="#2563eb" /> },
              ].map(({ label, value, icon }) => (
                <div key={label} style={{ background: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.1)', borderRadius: 14, padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {icon}
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                  </div>
                  {value === null ? <Sk w="80%" h="18px" /> : <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e3a8a' }}>{value}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 14, padding: '1rem 1.25rem', color: '#dc2626', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Activity size={16} /> {error}
          </div>
        )}

        {/* ── TWO-COLUMN CARDS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

          {/* Personal info */}
          <div style={card}>
            <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 700, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <User size={17} color="#2563eb" /> Thông tin cá nhân
            </h3>
            <p style={{ margin: '0 0 1rem', fontSize: '0.78rem', color: '#94a3b8' }}>Thông tin tài khoản hệ thống</p>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1,2,3,4,5].map(i => (
                  <div key={i} style={{ display: 'flex', gap: 12 }}>
                    <Sk w="36px" h="36px" />
                    <div style={{ flex: 1 }}><Sk w="60%" h="12px" /><div style={{ marginTop: 6 }}><Sk w="80%" h="16px" /></div></div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <InfoRow icon={<Hash size={15} color="#2563eb" />}     label="Mã ID"          value={user?.id ?? '—'} />
                <InfoRow icon={<User size={15} color="#2563eb" />}     label="Tên đăng nhập"  value={user?.username ?? '—'} />
                <InfoRow icon={<Mail size={15} color="#2563eb" />}     label="Email"          value={user?.email ?? '—'} />
                <InfoRow icon={<Shield size={15} color="#2563eb" />}   label="Vai trò"        value="Giảng viên" />
                <InfoRow icon={<Calendar size={15} color="#2563eb" />} label="Ngày tạo TK"    value={fmtDate(user?.created_at)} />
              </div>
            )}
          </div>

          {/* Teacher profile */}
          <div style={card}>
            <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 700, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <GraduationCap size={17} color="#2563eb" /> Hồ sơ giảng viên
            </h3>
            <p style={{ margin: '0 0 1rem', fontSize: '0.78rem', color: '#94a3b8' }}>Thông tin từ cổng thông tin TNUT</p>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ display: 'flex', gap: 12 }}>
                    <Sk w="36px" h="36px" />
                    <div style={{ flex: 1 }}><Sk w="60%" h="12px" /><div style={{ marginTop: 6 }}><Sk w="80%" h="16px" /></div></div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <InfoRow icon={<Briefcase size={15} color="#2563eb" />} label="Mã giảng viên" value={teacherProfile?.teacher_code ?? '—'} />
                <InfoRow icon={<Hash size={15} color="#2563eb" />}       label="Portal ID"     value={teacherProfile?.portal_id ?? '—'} />
                <InfoRow icon={<Calendar size={15} color="#2563eb" />}   label="Ngày tạo hồ sơ" value={fmtDate(teacherProfile?.created_at)} />
                <InfoRow icon={<Clock size={15} color="#2563eb" />}      label="Cập nhật cuối"  value={fmtDate(teacherProfile?.updated_at)} />
              </div>
            )}
          </div>
        </div>

        {/* ── PORTAL ACCESS CARD ── */}
        <div style={{ ...card, background: 'linear-gradient(135deg,rgba(30,58,138,0.06),rgba(37,99,235,0.04))', border: '1px solid rgba(37,99,235,0.14)' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Key size={17} color="#2563eb" /> Thông tin cổng thông tin TNUT
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {[
              {
                label: 'Portal Code',
                content: loading
                  ? <Sk w="70%" h="18px" />
                  : <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e3a8a', fontFamily: 'monospace', wordBreak: 'break-all' }}>{user?.portal_code ?? '—'}</div>,
              },
              {
                label: 'Hết hạn portal',
                content: loading
                  ? <Sk w="70%" h="18px" />
                  : (() => {
                      const expires = user?.portal_expires_at;
                      const expired = expires ? new Date(expires) < new Date() : false;
                      return (
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: expired ? '#dc2626' : '#059669' }}>
                          {fmtDate(expires)}
                          {expired && <span style={{ marginLeft: 6, fontSize: '0.72rem', background: 'rgba(220,38,38,0.1)', padding: '2px 8px', borderRadius: 20 }}>Hết hạn</span>}
                        </div>
                      );
                    })(),
              },
            ].map(({ label, content }) => (
              <div key={label} style={{ background: 'white', borderRadius: 14, padding: '1rem', border: '1px solid rgba(37,99,235,0.1)' }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</div>
                {content}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default TeacherProfile;
