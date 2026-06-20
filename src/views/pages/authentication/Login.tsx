import { type FC, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Eye, EyeOff, LogIn,
  MessageCircle, BookOpen, GraduationCap, Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/views/pages/stores/auth_store';
import { getFieldError } from '@/helper/error_handler';
import logoTNUT from '@/assets/logo_tnut/logo_tnut.png';

const loginSchema = z.object({
  username: z.string().min(1, 'Vui lòng nhập tên đăng nhập'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});
type LoginFormValues = z.infer<typeof loginSchema>;

const FEATURES = [
  { icon: MessageCircle, label: 'Hỏi đáp AI',   sub: 'Mọi lúc, mọi nơi'      },
  { icon: BookOpen,      label: 'Ôn tập',        sub: 'Flashcard thích ứng'    },
  { icon: GraduationCap, label: 'Cố vấn',        sub: 'Học tập thông minh'     },
  { icon: Bell,          label: 'Nhắc nhở',      sub: 'Lịch thi & deadline'    },
];

const STATS = [
  { value: '5.000+', label: 'Sinh viên' },
  { value: '98%',    label: 'Hài lòng'  },
  { value: '24/7',   label: 'Hỗ trợ'   },
];

const CSS = `
  @keyframes login-float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
  @keyframes login-spin   { to { transform: rotate(360deg); } }
  .login-link:hover { text-decoration: underline; }
`;

const Login: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from     = (location.state as { from?: { pathname: string } })?.from?.pathname ?? null;

  const { login, isLoading, error, clearError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    clearError();
    const ok = await login(values);
    if (ok) {
      const role = useAuthStore.getState().user?.role;
      const dest  = role === 'admin' ? '/admin/dashboard' : role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard';
      navigate(from ?? dest, { replace: true });
    }
  };

  const serverError = (f: 'username' | 'password') => getFieldError(error, f);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: '#eef4ff',
      fontFamily: "'Be Vietnam Pro', system-ui, sans-serif",
    }}>
      <style>{CSS}</style>

      {/* ══════════════ LEFT PANEL ══════════════ */}
      <div
        className="hidden lg:flex"
        style={{
          width: '45%', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center',
          padding: '3.5rem 3rem', position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(145deg, #1e3a8a 0%, #1d4ed8 55%, #2563eb 100%)',
        }}
      >
        {/* Decorative rings */}
        {[
          { size: 340, top: -90,  right: -90,  op: 0.07 },
          { size: 200, top: -45,  right: -45,  op: 0.11 },
          { size: 400, bottom: -110, left: -70, op: 0.06 },
          { size: 220, bottom: -55,  left: -30, op: 0.09 },
        ].map((r, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: r.size, height: r.size, borderRadius: '50%',
            border: `1px solid rgba(255,255,255,${r.op})`,
            ...(r.top    !== undefined ? { top:    r.top }    : {}),
            ...(r.bottom !== undefined ? { bottom: r.bottom } : {}),
            ...(r.right  !== undefined ? { right:  r.right }  : {}),
            ...(r.left   !== undefined ? { left:   r.left }   : {}),
          }} />
        ))}

        {/* Floating orbs */}
        <div style={{
          position: 'absolute', top: '32%', right: '7%',
          width: 90, height: 90, borderRadius: '50%',
          background: 'rgba(96,165,250,0.22)', filter: 'blur(22px)',
          animation: 'login-float 6s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '28%', left: '9%',
          width: 65, height: 65, borderRadius: '50%',
          background: 'rgba(147,197,253,0.18)', filter: 'blur(16px)',
          animation: 'login-float 8s ease-in-out infinite 2.5s',
        }} />

        {/* Content */}
        <div style={{
          position: 'relative', zIndex: 10, width: '100%', maxWidth: '360px',
          display: 'flex', flexDirection: 'column', gap: '2rem', color: 'white',
        }}>
          {/* Logo + brand */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center' }}>
            <div style={{
              width: 76, height: 76, borderRadius: '22px',
              background: 'rgba(255,255,255,0.14)',
              backdropFilter: 'blur(14px)',
              border: '1px solid rgba(255,255,255,0.28)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            }}>
              <img src={logoTNUT} alt="TNUT" style={{ width: 56, height: 56, objectFit: 'contain' }} />
            </div>
            <div>
              <p style={{
                fontSize: '10px', fontWeight: 600,
                letterSpacing: '0.18em', textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.55)', marginBottom: '8px',
              }}>
                Trường ĐH Kỹ thuật Công nghiệp
              </p>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
                Trợ lý Học thuật
              </h1>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em', color: '#93c5fd' }}>
                TNUT AI
              </div>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.68)', lineHeight: 1.65, maxWidth: '290px' }}>
              Người bạn đồng hành thông minh trong hành trình học tập và nghiên cứu của bạn.
            </p>
          </div>

          {/* Feature cards 2 × 2 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {FEATURES.map(({ icon: Icon, label, sub }) => (
              <div key={label} style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.16)',
                borderRadius: '16px',
                padding: '14px 12px',
                display: 'flex', flexDirection: 'column', gap: '8px',
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '10px',
                  background: 'rgba(255,255,255,0.16)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={18} color="rgba(255,255,255,0.92)" strokeWidth={1.8} />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{label}</div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.52)', marginTop: '2px' }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Stats bar */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '1rem 1.5rem',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '16px',
          }}>
            {STATS.map(({ value, label }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#93c5fd' }}>{value}</div>
                <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.52)', marginTop: '3px' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════ RIGHT PANEL ══════════════ */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Mobile logo */}
          <div className="flex lg:hidden" style={{ flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <img src={logoTNUT} alt="TNUT" style={{ width: 52, height: 52, objectFit: 'contain' }} />
            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1e3a8a' }}>TNUT AI</span>
          </div>

          {/* ── Card ── */}
          <div style={{
            background: 'rgba(255,255,255,0.78)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.95)',
            borderRadius: '28px',
            padding: '2.5rem 2.25rem',
            boxShadow: '0 24px 64px rgba(37,99,235,0.1), 0 4px 16px rgba(37,99,235,0.06)',
            display: 'flex', flexDirection: 'column', gap: '1.5rem',
          }}>

            {/* Header */}
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e3a8a', margin: 0 }}>
                Chào mừng trở lại! 👋
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '6px', marginBottom: 0 }}>
                Đăng nhập để tiếp tục hành trình học tập
              </p>
            </div>

            {/* Server error */}
            {error && !error.errors?.length && (
              <div style={{
                background: 'rgba(220,38,38,0.07)',
                border: '1px solid rgba(220,38,38,0.2)',
                borderRadius: '12px', padding: '12px 14px',
                fontSize: '0.875rem', color: '#dc2626',
              }}>
                {error.message}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }} noValidate>

              {/* Username */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e3a8a' }}>
                  Tên đăng nhập
                </label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Nhập tên đăng nhập..."
                  autoComplete="username"
                  className="focus-visible:ring-[#2563eb]/35 bg-white/80"
                  style={{
                    borderColor: errors.username ? '#dc2626' : 'rgba(37,99,235,0.22)',
                    borderRadius: '12px',
                    height: '46px',
                    fontSize: '0.9rem',
                  }}
                  {...register('username')}
                />
                {(errors.username ?? serverError('username')) && (
                  <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>
                    {errors.username?.message ?? serverError('username')}
                  </span>
                )}
              </div>

              {/* Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e3a8a' }}>
                    Mật khẩu
                  </label>
                  <Link to="#" className="login-link" style={{ fontSize: '0.78rem', color: '#2563eb', textDecoration: 'none' }}>
                    Quên mật khẩu?
                  </Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu..."
                    autoComplete="current-password"
                    className="focus-visible:ring-[#2563eb]/35 bg-white/80"
                    style={{
                      borderColor: errors.password ? '#dc2626' : 'rgba(37,99,235,0.22)',
                      borderRadius: '12px',
                      height: '46px',
                      fontSize: '0.9rem',
                      paddingRight: '44px',
                    }}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    style={{
                      position: 'absolute', right: '13px', top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#94a3b8', padding: 0, display: 'flex', alignItems: 'center',
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {(errors.password ?? serverError('password')) && (
                  <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>
                    {errors.password?.message ?? serverError('password')}
                  </span>
                )}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full gap-2 font-semibold text-white hover:opacity-90 transition-opacity"
                style={{
                  background: isLoading ? '#93c5fd' : 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                  borderRadius: '14px',
                  height: '50px',
                  fontSize: '0.95rem',
                  border: 'none',
                  marginTop: '6px',
                  boxShadow: '0 6px 24px rgba(37,99,235,0.35)',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {isLoading ? (
                  <div style={{
                    width: 18, height: 18,
                    border: '2px solid rgba(255,255,255,0.35)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'login-spin 0.7s linear infinite',
                  }} />
                ) : (
                  <LogIn size={18} />
                )}
                {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </Button>
            </form>
          </div>

          {/* Register */}
          <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
            Chưa có tài khoản?{' '}
            <Link to="/register" className="login-link" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
              Đăng ký ngay
            </Link>
          </p>

          <p style={{ textAlign: 'center', fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
            Bằng cách đăng nhập, bạn đồng ý với{' '}
            <Link to="#" style={{ color: '#2563eb', textDecoration: 'underline' }}>Điều khoản sử dụng</Link>
            {' '}và{' '}
            <Link to="#" style={{ color: '#2563eb', textDecoration: 'underline' }}>Chính sách bảo mật</Link>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
