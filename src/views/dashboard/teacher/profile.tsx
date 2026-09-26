import { type FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  User, Calendar, Activity, Clock, LogIn, Hash,
  GraduationCap, Briefcase, Building2, Landmark, Layers, Award, BadgeCheck, BookOpen, Users,
} from 'lucide-react';
import AuthRepository from '@/infra/AuthRepository';
import type { IUserMe } from '@/infra/api/interfaces/IUser';
import { getTeacherHoSo, type ITeacherHoSo } from '@/infra/teacher/hoso_api';

// ── helpers ──────────────────────────────────────────
const CHUA = 'Chưa cập nhật';

function fmtDateShort(iso: string | undefined): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(new Date(iso));
}

/** 20261 → "HK1 2026–2027" (mã học kỳ Portal: năm bắt đầu + số kỳ). */
function tenHocKy(hk: number | null | undefined): string {
  if (!hk) return '—';
  const nam = Math.floor(hk / 10);
  return `HK${hk % 10} ${nam}–${nam + 1}`;
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).filter(Boolean).slice(-2).join('').toUpperCase();
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
      <div style={{ fontSize: '0.9rem', color: value === CHUA ? '#94a3b8' : '#1e293b', fontWeight: 600, wordBreak: 'break-word' }}>{value}</div>
    </div>
  </div>
);

const cellTd: React.CSSProperties = { padding: '7px 8px', borderBottom: '1px solid #f1f5f9' };

// ── Main ─────────────────────────────────────────────
const TeacherProfile: FC = () => {
  const navigate = useNavigate();
  const [user, setUser]             = useState<IUserMe | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [hoSo, setHoSo]             = useState<ITeacherHoSo | null>(null);
  const [hoSoLoading, setHoSoLoading] = useState(true);

  const fetchProfile = () => {
    setLoading(true);
    setError(null);
    AuthRepository.getMe()
      .then(res => setUser(res.data))
      .catch(() => setError('Không thể tải thông tin. Vui lòng thử lại.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProfile();
    getTeacherHoSo().then(setHoSo).catch(() => setHoSo(null)).finally(() => setHoSoLoading(false));
  }, []);

  const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.82)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.95)',
    borderRadius: 20,
    boxShadow: '0 8px 32px rgba(37,99,235,0.08)',
    padding: '1.5rem',
  };
  const h3: React.CSSProperties = { margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 700, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: 8 };
  const sub: React.CSSProperties = { margin: '0 0 1rem', fontSize: '0.78rem', color: '#94a3b8' };

  const cb = hoSo?.can_bo ?? null;
  const boMon = hoSo?.to_chuc.bo_mon ?? (cb?.bo_phan && cb.bo_phan !== cb.don_vi ? cb.bo_phan : null);

  return (
    <div style={{ minHeight: '100%', background: '#eef4ff', fontFamily: "'Be Vietnam Pro',system-ui,sans-serif", padding: '1.5rem' }}>
      <style>{CSS}</style>

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
                        <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                          {/* chức vụ đi với đơn vị của chức vụ đó (danh bạ), không ghép với khoa giảng dạy */}
                          {[cb?.chuc_vu, cb?.don_vi ?? hoSo?.to_chuc.khoa].filter(Boolean).join(' · ') || user?.email}
                        </p>
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

        {/* ── THÔNG TIN CÔNG TÁC (danh bạ cán bộ + cơ cấu tổ chức) ── */}
        <div style={card}>
          <h3 style={h3}><Building2 size={17} color="#2563eb" /> Thông tin công tác</h3>
          <p style={sub}>Theo danh bạ cán bộ TNUT và cơ cấu tổ chức trong hệ thống — mục chưa có dữ liệu ghi “{CHUA}”.</p>
          {hoSoLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>{[1, 2, 3, 4, 5, 6].map(i => <Sk key={i} h="44px" />)}</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', columnGap: '1.5rem' }}>
              <InfoRow icon={<User size={15} color="#2563eb" />}       label="Họ và tên"       value={hoSo?.ho_ten ?? user?.name ?? '—'} />
              <InfoRow icon={<Hash size={15} color="#2563eb" />}       label="Mã giảng viên"   value={hoSo?.ma_gv ?? user?.username ?? '—'} />
              <InfoRow icon={<BadgeCheck size={15} color="#2563eb" />} label="Mã cán bộ"       value={cb?.ma_can_bo ?? CHUA} />
              <InfoRow icon={<Landmark size={15} color="#2563eb" />}   label="Đơn vị công tác" value={cb?.don_vi ?? CHUA} />
              <InfoRow icon={<Building2 size={15} color="#2563eb" />}  label="Khoa"            value={hoSo?.to_chuc.khoa ?? CHUA} />
              <InfoRow icon={<Layers size={15} color="#2563eb" />}     label="Bộ môn"          value={boMon ?? CHUA} />
              <InfoRow icon={<Award size={15} color="#2563eb" />}      label="Chức vụ"         value={cb?.chuc_vu ?? CHUA} />
              <InfoRow icon={<Activity size={15} color="#2563eb" />}   label="Tình trạng"      value={cb?.tinh_trang ?? CHUA} />
            </div>
          )}
          {!hoSoLoading && hoSo && !cb && (
            <div style={{ marginTop: 10, fontSize: '0.76rem', color: '#b45309' }}>Chưa khớp được hồ sơ trong danh bạ cán bộ (theo email/họ tên) — liên hệ quản trị để gán Khoa/Bộ môn.</div>
          )}
        </div>

        {/* ── GIẢNG DẠY (lớp học phần đồng bộ từ Portal) ── */}
        <div style={card}>
          <h3 style={h3}><BookOpen size={17} color="#2563eb" /> Giảng dạy &amp; cố vấn học tập</h3>
          <p style={sub}>Tổng hợp từ các lớp học phần đã đồng bộ từ cổng thông tin TNUT.</p>
          {hoSoLoading ? <Sk h="120px" /> : hoSo && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 14 }}>
                {[
                  { label: 'Học kỳ gần nhất',   value: tenHocKy(hoSo.giang_day.hoc_ky_moi_nhat) },
                  { label: 'Môn học phụ trách', value: String(hoSo.giang_day.mon.length) },
                  { label: 'Lớp học phần',      value: String(hoSo.giang_day.so_lop_hp) },
                  { label: 'Số học kỳ đã dạy',  value: String(hoSo.giang_day.so_hoc_ky) },
                ].map(k => (
                  <div key={k.label} style={{ background: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.1)', borderRadius: 14, padding: '0.75rem 0.9rem' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k.label}</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e3a8a', marginTop: 4 }}>{k.value}</div>
                  </div>
                ))}
              </div>

              {hoSo.giang_day.mon.length === 0 ? (
                <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Chưa có lớp học phần nào được đồng bộ.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ color: '#64748b', textAlign: 'left' }}>
                        {['Mã môn', 'Tên môn học', 'TC', 'Số lớp', 'Học kỳ đã dạy'].map(t => (
                          <th key={t} style={{ padding: '6px 8px', fontWeight: 600, borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{t}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {hoSo.giang_day.mon.map(m => (
                        <tr key={m.ma_mon}>
                          <td style={{ ...cellTd, fontFamily: 'monospace', color: '#2563eb', fontWeight: 700 }}>{m.ma_mon}</td>
                          <td style={{ ...cellTd, color: '#1e293b', fontWeight: 600 }}>{m.ten_mon}</td>
                          <td style={cellTd}>{m.so_tc ?? '—'}</td>
                          <td style={cellTd}>{m.so_lop}</td>
                          <td style={{ ...cellTd, color: '#64748b' }}>
                            {m.hoc_ky.slice(0, 3).map(tenHocKy).join(' · ')}{m.hoc_ky.length > 3 ? ` +${m.hoc_ky.length - 3}` : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <Users size={14} color="#2563eb" /> Lớp cố vấn học tập:
                </span>
                {hoSo.giang_day.lop_co_van.length === 0
                  ? <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Chưa có</span>
                  : hoSo.giang_day.lop_co_van.map(l => (
                      <span key={l} style={{ background: 'rgba(124,58,237,0.08)', color: '#7c3aed', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 20, padding: '3px 10px', fontSize: '0.76rem', fontWeight: 700 }}>{l}</span>
                    ))}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default TeacherProfile;
