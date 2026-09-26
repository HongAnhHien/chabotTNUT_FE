import { type FC, useEffect, useState } from 'react';
import {
  User, Shield, Calendar,
  Activity, BookOpen, Clock, LogIn, Hash,
  GraduationCap, Building2, Award, Layers, MapPin, School,
} from 'lucide-react';
import AuthRepository from '@/infra/AuthRepository';
import type { IUserMe, IStudentProfileData, IAcademicInfo } from '@/infra/api/interfaces/IUser';

function isStudentProfile(p: IUserMe['profile']): p is IStudentProfileData {
  return 'student_code' in p;
}

// ── helpers ──────────────────────────────────────────
function fmtDateShort(iso: string | undefined): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(new Date(iso));
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).filter(Boolean).slice(-2).join('').toUpperCase();
}

/** Giá trị học vụ: null/‘’ → hiển thị "Chưa xác định" (không bịa). */
function orUnknown(v: string | number | null | undefined): string {
  if (v === null || v === undefined || v === '') return 'Chưa xác định';
  return String(v);
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

// ── Academic tile (ô học vụ nổi bật) ─────────────────
const AcaTile: FC<{ icon: React.ReactNode; label: string; value: string | number | null | undefined; strong?: boolean }> = ({ icon, label, value, strong }) => {
  const unknown = value === null || value === undefined || value === '';
  return (
    <div style={{
      background: 'white', border: '1px solid rgba(37,99,235,0.12)', borderRadius: '14px',
      padding: '0.85rem 0.95rem', display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon}
        <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
      </div>
      <span style={{
        fontSize: strong ? '1.02rem' : '0.92rem',
        fontWeight: strong ? 800 : 700,
        color: unknown ? '#94a3b8' : '#1e3a8a',
        fontStyle: unknown ? 'italic' : 'normal',
      }}>
        {orUnknown(value ?? null)}
      </span>
    </div>
  );
};

// ── Main ─────────────────────────────────────────────
const StudentProfile: FC = () => {
  const [user, setUser]           = useState<IUserMe | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const studentProfile = user?.profile && isStudentProfile(user.profile) ? user.profile : null;
  const aca: IAcademicInfo | null | undefined = user?.academic;

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
  const sectionTitle: React.CSSProperties = {
    margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 700, color: '#1e3a8a',
    display: 'flex', alignItems: 'center', gap: '8px',
  };
  const sectionSub: React.CSSProperties = { margin: '0 0 1rem', fontSize: '0.78rem', color: '#94a3b8' };

  return (
    <div style={{
      minHeight: '100%', background: '#eef4ff',
      fontFamily: "'Be Vietnam Pro', system-ui, sans-serif",
      padding: '1.5rem',
    }}>
      <style>{CSS}</style>

      <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* ── HEADER CARD ── */}
        <div style={{ borderRadius: '24px', overflow: 'hidden', boxShadow: '0 12px 40px rgba(37,99,235,0.14)' }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 55%, #3b82f6 100%)',
            padding: '2rem 2rem 0', position: 'relative',
          }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)' }} />
            <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.14)' }} />

            <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-end', gap: '1.25rem' }}>
              <div style={{
                width: 88, height: 88, borderRadius: '22px', flexShrink: 0,
                background: 'linear-gradient(145deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1))',
                border: '3px solid rgba(255,255,255,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.75rem', fontWeight: 800, color: 'white',
                backdropFilter: 'blur(8px)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', marginBottom: '8px',
              }}>
                {loading ? <User size={32} color="rgba(255,255,255,0.6)" /> : initials(user?.name ?? 'U')}
              </div>
              <div style={{ paddingBottom: '1rem', color: 'white', minWidth: 0 }}>
                {loading
                  ? <><Skeleton w="160px" h="22px" /><div style={{ marginTop: 8 }}><Skeleton w="200px" h="14px" /></div></>
                  : <>
                      <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, lineHeight: 1.2 }}>{user?.name}</h1>
                      <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'rgba(255,255,255,0.82)' }}>
                        Mã SV: <b style={{ fontFamily: 'monospace' }}>{studentProfile?.student_code ?? '—'}</b>
                        {aca?.chuyen_nganh ? ` · ${aca.chuyen_nganh}` : (aca?.nganh ? ` · ${aca.nganh}` : '')}
                      </p>
                    </>
                }
              </div>
            </div>
          </div>

          {/* White bottom: badges + login stats */}
          <div style={{ background: 'white', padding: '1rem 2rem 1.5rem' }}>
            {loading ? (
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <Skeleton w="80px" h="24px" /><Skeleton w="100px" h="24px" />
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
                {aca?.khoa_hoc && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    background: 'rgba(37,99,235,0.06)', color: '#1e3a8a',
                    border: '1px solid rgba(37,99,235,0.18)',
                    borderRadius: '20px', padding: '4px 12px', fontSize: '0.78rem', fontWeight: 700,
                  }}>
                    <GraduationCap size={12} /> {aca.khoa_hoc}
                  </span>
                )}
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
              {[
                { label: 'Lần đăng nhập', value: loading ? null : String(user?.login_count ?? 0), icon: <LogIn size={16} color="#2563eb" /> },
                { label: 'Đăng nhập đầu',  value: loading ? null : fmtDateShort(user?.first_login_at), icon: <Calendar size={16} color="#2563eb" /> },
                { label: 'Đăng nhập cuối', value: loading ? null : fmtDateShort(user?.last_login_at),  icon: <Clock size={16} color="#2563eb" /> },
              ].map(({ label, value, icon }) => (
                <div key={label} style={{
                  background: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.1)',
                  borderRadius: '14px', padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '6px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {icon}
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                  </div>
                  {value === null ? <Skeleton w="80%" h="18px" /> : <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e3a8a' }}>{value}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div style={{
            background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)',
            borderRadius: '14px', padding: '1rem 1.25rem',
            color: '#dc2626', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <Activity size={16} /> {error}
          </div>
        )}

        {/* ── NHÓM 1 · HỌC VỤ (đã giải mã) ── */}
        <div style={{
          ...card,
          background: 'linear-gradient(135deg, rgba(30,58,138,0.06) 0%, rgba(37,99,235,0.03) 100%)',
          border: '1px solid rgba(37,99,235,0.16)',
        }}>
          <h3 style={sectionTitle}><GraduationCap size={17} color="#2563eb" /> Thông tin học vụ</h3>
          <p style={sectionSub}>Giải mã từ mã sinh viên &amp; mã lớp (EduSoft) — trường chưa tra được sẽ ghi “Chưa xác định”.</p>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              {[1,2,3,4,5,6].map(i => <Skeleton key={i} h="66px" />)}
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.9rem' }}>
                <AcaTile strong icon={<GraduationCap size={15} color="#2563eb" />} label="Khoá học" value={aca?.khoa_hoc} />
                <AcaTile strong icon={<Award size={15} color="#2563eb" />}        label="Danh hiệu" value={aca?.danh_hieu} />
                <AcaTile strong icon={<School size={15} color="#2563eb" />}       label="Hệ đào tạo" value={aca?.he_dao_tao} />
                <AcaTile icon={<Building2 size={15} color="#2563eb" />}           label="Khoa" value={aca?.khoa} />
                <AcaTile icon={<BookOpen size={15} color="#2563eb" />}            label="Ngành" value={aca?.nganh} />
                <AcaTile icon={<Layers size={15} color="#2563eb" />}             label="Chuyên ngành" value={aca?.chuyen_nganh} />
                <AcaTile icon={<Hash size={15} color="#2563eb" />}               label="Lớp" value={aca?.lop} />
                <AcaTile icon={<Calendar size={15} color="#2563eb" />}           label="Năm tuyển sinh" value={aca?.nam_tuyen_sinh ?? null} />
                <AcaTile icon={<MapPin size={15} color="#2563eb" />}             label="Cơ sở" value={aca?.co_so} />
              </div>
              {!aca?.nganh && !aca?.chuyen_nganh && (
                <p style={{ margin: '0.9rem 0 0', fontSize: '0.76rem', color: '#94a3b8' }}>
                  Chưa đủ dữ liệu lớp để giải mã ngành/chuyên ngành. Thông tin sẽ đầy đủ khi lớp học phần được đồng bộ từ cổng thông tin.
                </p>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default StudentProfile;
