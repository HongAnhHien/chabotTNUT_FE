import { type FC, useEffect, useState } from 'react';
import {
  User, Mail, Shield, Calendar,
  Activity, BookOpen, Key, Clock, LogIn, Hash,
  GraduationCap,
} from 'lucide-react';
import AuthRepository from '@/infra/AuthRepository';
import type { IUserMe, IStudentProfileData } from '@/infra/api/interfaces/IUser';

function isStudentProfile(p: IUserMe['profile']): p is IStudentProfileData {
  return 'student_code' in p;
}

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

const CSS = `
  @keyframes prof-spin { to { transform: rotate(360deg); } }
  @keyframes prof-pulse { 0%,100%{opacity:.6} 50%{opacity:1} }
  .prof-skeleton {
    background: linear-gradient(90deg,#e0eaff 25%,#c7d9fe 50%,#e0eaff 75%);
    background-size: 200% 100%;
    animation: prof-pulse 1.4s ease infinite;
    border-radius: 8px;
  }
`;

// ── Skeleton ─────────────────────────────────────────
const Skeleton: FC<{ w?: string; h?: string }> = ({ w = '100%', h = '16px' }) => (
  <div className="prof-skeleton" style={{ width: w, height: h }} />
);

// ── Info Row ─────────────────────────────────────────
const InfoRow: FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 0', borderBottom: '1px solid rgba(37,99,235,0.08)' }}>
    <div style={{
      width: 36, height: 36, borderRadius: '10px', flexShrink: 0,
      background: 'rgba(37,99,235,0.08)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {icon}
    </div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500, marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: 600, wordBreak: 'break-all' }}>{value}</div>
    </div>
  </div>
);

// ── Main ─────────────────────────────────────────────
const StudentProfile: FC = () => {
  const [user, setUser]           = useState<IUserMe | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const studentProfile = user?.profile && isStudentProfile(user.profile) ? user.profile : null;

  const fetchProfile = () => {
    setLoading(true);
    setError(null);
    AuthRepository.getMe()
      .then(res => setUser(res.data))
      .catch(() => setError('Không thể tải thông tin. Vui lòng thử lại.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProfile(); }, []);

  const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.82)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.95)',
    borderRadius: '20px',
    boxShadow: '0 8px 32px rgba(37,99,235,0.08)',
    padding: '1.5rem',
  };

  return (
    <div style={{
      minHeight: '100%', background: '#eef4ff',
      fontFamily: "'Be Vietnam Pro', system-ui, sans-serif",
      padding: '1.5rem',
    }}>
      <style>{CSS}</style>

      <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* ── HEADER CARD ── */}
        <div style={{
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(37,99,235,0.14)',
        }}>
          {/* Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 55%, #3b82f6 100%)',
            padding: '2rem 2rem 0',
            position: 'relative',
          }}>
            {/* Decorative rings */}
            <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)' }} />
            <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.14)' }} />

            {/* Avatar + name */}
           <div className='flex justify-between items-end gap-5'>
             <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-end', gap: '1.25rem' }}>
              <div style={{
                width: 88, height: 88, borderRadius: '22px', flexShrink: 0,
                background: 'linear-gradient(145deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1))',
                border: '3px solid rgba(255,255,255,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.75rem', fontWeight: 800, color: 'white',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                marginBottom: '8px',
              }}>
                {loading ? <User size={32} color="rgba(255,255,255,0.6)" /> : initials(user?.name ?? 'U')}
              </div>
              <div style={{ paddingBottom: '1rem', color: 'white' }}>
                {loading
                  ? <><Skeleton w="160px" h="22px" /><div style={{ marginTop: 8 }}><Skeleton w="200px" h="14px" /></div></>
                  : <>
                      <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, lineHeight: 1.2 }}>{user?.name}</h1>
                      <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'rgba(255,255,255,0.72)' }}>{user?.email}</p>
                    </>
                }
              </div>
            </div>
           <div>

           {/* nut đi đến dang Student.aspx */}

           </div>
           </div>
          </div>

          {/* White bottom with role badge + stats */}
          <div style={{ background: 'white', padding: '1rem 2rem 1.5rem' }}>
            {loading ? (
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <Skeleton w="80px" h="24px" />
                <Skeleton w="100px" h="24px" />
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '1.25rem' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  background: user?.role === 'admin' ? 'rgba(220,38,38,0.08)' : 'rgba(37,99,235,0.08)',
                  color: user?.role === 'admin' ? '#dc2626' : '#2563eb',
                  border: `1px solid ${user?.role === 'admin' ? 'rgba(220,38,38,0.2)' : 'rgba(37,99,235,0.2)'}`,
                  borderRadius: '20px', padding: '4px 12px', fontSize: '0.78rem', fontWeight: 700,
                }}>
                  <Shield size={12} />
                  {user?.role === 'student' ? 'Sinh viên' : user?.role === 'admin' ? 'Quản trị viên' : user?.role}
                </span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  background: 'rgba(16,185,129,0.08)', color: '#059669',
                  border: '1px solid rgba(16,185,129,0.2)',
                  borderRadius: '20px', padding: '4px 12px', fontSize: '0.78rem', fontWeight: 700,
                }}>
                  <Activity size={12} /> Đang hoạt động
                </span>
              </div>
            )}

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
              {[
                { label: 'Lần đăng nhập', value: loading ? null : String(user?.login_count ?? 0), icon: <LogIn size={16} color="#2563eb" /> },
                { label: 'Đăng nhập đầu',  value: loading ? null : fmtDateShort(user?.first_login_at), icon: <Calendar size={16} color="#2563eb" /> },
                { label: 'Đăng nhập cuối', value: loading ? null : fmtDateShort(user?.last_login_at),  icon: <Clock size={16} color="#2563eb" /> },
              ].map(({ label, value, icon }) => (
                <div key={label} style={{
                  background: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.1)',
                  borderRadius: '14px', padding: '0.875rem',
                  display: 'flex', flexDirection: 'column', gap: '6px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {icon}
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                  </div>
                  {value === null
                    ? <Skeleton w="80%" h="18px" />
                    : <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e3a8a' }}>{value}</span>
                  }
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div style={{
            background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)',
            borderRadius: '14px', padding: '1rem 1.25rem',
            color: '#dc2626', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <Activity size={16} /> {error}
          </div>
        )}

        {/* ── TWO-COLUMN CARDS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

          {/* Personal info */}
          <div style={card}>
            <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 700, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={17} color="#2563eb" /> Thông tin cá nhân
            </h3>
            <p style={{ margin: '0 0 1rem', fontSize: '0.78rem', color: '#94a3b8' }}>Thông tin tài khoản hệ thống</p>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1,2,3,4].map(i => <div key={i} style={{ display: 'flex', gap: 12 }}><Skeleton w="36px" h="36px" /><div style={{ flex: 1 }}><Skeleton w="60%" h="12px" /><div style={{ marginTop: 6 }}><Skeleton w="80%" h="16px" /></div></div></div>)}
              </div>
            ) : (
              <div>
                <InfoRow icon={<Hash size={15} color="#2563eb" />}     label="Mã ID"          value={user?.id ?? '—'} />
                <InfoRow icon={<User size={15} color="#2563eb" />}     label="Tên đăng nhập"  value={user?.username ?? '—'} />
                <InfoRow icon={<Mail size={15} color="#2563eb" />}     label="Email"          value={user?.email ?? '—'} />
                <InfoRow icon={<Shield size={15} color="#2563eb" />}   label="Vai trò"        value={user?.role === 'student' ? 'Sinh viên' : user?.role === 'admin' ? 'Quản trị viên' : (user?.role ?? '—')} />
                <InfoRow icon={<Calendar size={15} color="#2563eb" />} label="Ngày tạo tài khoản" value={fmtDate(user?.created_at)} />
              </div>
            )}
          </div>

          {/* Student profile */}
          <div style={card}>
            <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 700, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GraduationCap size={17} color="#2563eb" /> Hồ sơ sinh viên
            </h3>
            <p style={{ margin: '0 0 1rem', fontSize: '0.78rem', color: '#94a3b8' }}>Thông tin học vụ từ cổng thông tin</p>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1,2,3,4].map(i => <div key={i} style={{ display: 'flex', gap: 12 }}><Skeleton w="36px" h="36px" /><div style={{ flex: 1 }}><Skeleton w="60%" h="12px" /><div style={{ marginTop: 6 }}><Skeleton w="80%" h="16px" /></div></div></div>)}
              </div>
            ) : (
              <div>
                <InfoRow icon={<BookOpen size={15} color="#2563eb" />} label="Mã sinh viên"   value={studentProfile?.student_code ?? '—'} />
                <InfoRow icon={<Hash size={15} color="#2563eb" />}     label="Portal ID"      value={studentProfile?.portal_id ?? '—'} />
                <InfoRow icon={<Activity size={15} color="#2563eb" />} label="Hoạt động cuối" value={fmtDate(studentProfile?.last_active)} />
                <InfoRow icon={<Calendar size={15} color="#2563eb" />} label="Ngày tạo hồ sơ" value={fmtDate(studentProfile?.created_at)} />
                <InfoRow icon={<Clock size={15} color="#2563eb" />}    label="Cập nhật lần cuối" value={fmtDate(studentProfile?.updated_at)} />
              </div>
            )}
          </div>
        </div>

        {/* ── PORTAL ACCESS CARD ── */}
        <div style={{
          ...card,
          background: 'linear-gradient(135deg, rgba(30,58,138,0.06) 0%, rgba(37,99,235,0.04) 100%)',
          border: '1px solid rgba(37,99,235,0.14)',
        }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key size={17} color="#2563eb" /> Thông tin cổng thông tin TNUT
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{
              background: 'white', borderRadius: '14px', padding: '1rem',
              border: '1px solid rgba(37,99,235,0.1)',
            }}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                Portal Code
              </div>
              {loading
                ? <Skeleton w="70%" h="18px" />
                : <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e3a8a', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {user?.portal_code ?? '—'}
                  </div>
              }
            </div>

            <div style={{
              background: 'white', borderRadius: '14px', padding: '1rem',
              border: '1px solid rgba(37,99,235,0.1)',
            }}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                Hết hạn portal
              </div>
              {loading
                ? <Skeleton w="70%" h="18px" />
                : (() => {
                    const expires = user?.portal_expires_at;
                    const expired = expires ? new Date(expires) < new Date() : false;
                    return (
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: expired ? '#dc2626' : '#059669' }}>
                        {fmtDate(expires)}
                        {expired && <span style={{ marginLeft: 6, fontSize: '0.72rem', background: 'rgba(220,38,38,0.1)', padding: '2px 8px', borderRadius: '20px' }}>Hết hạn</span>}
                      </div>
                    );
                  })()
              }
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StudentProfile;
