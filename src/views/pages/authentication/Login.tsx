import { type FC, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, LogIn, MessageCircle, ClipboardList, GraduationCap, CalendarClock } from 'lucide-react';
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

const CHATBOTS = [
  // Chatbot trợ giảng (chat môn học)
  { icon: MessageCircle,  label: 'Hỏi đáp bài học',    sub: 'Giải đáp tức thì mọi câu hỏi học thuật theo môn' },
  { icon: ClipboardList,  label: 'Tạo đề kiểm tra',    sub: 'Sinh đề tự động theo chương trình học' },
  // Cố vấn học tập (CVHT)
  { icon: GraduationCap,  label: 'Cố vấn học tập',     sub: 'Tra cứu điểm, thời khoá biểu, lịch thi' },
  { icon: CalendarClock,  label: 'Tư vấn đăng ký môn', sub: 'Gợi ý môn học, môn tiên quyết mỗi kỳ' },
];

const CSS = `
  @keyframes lg-fade-up  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes lg-spin     { to{transform:rotate(360deg)} }
  @keyframes lg-shimmer  { 0%,100%{opacity:.4} 50%{opacity:.7} }
  @keyframes lg-float    { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-12px)} }
  .lg-card   { animation: lg-fade-up .5s cubic-bezier(.22,1,.36,1) both .1s }
  .lg-form   { animation: lg-fade-up .5s cubic-bezier(.22,1,.36,1) both .25s }
`;

const Login: FC = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? null;

  const { login, isLoading, error, clearError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  // Tài khoản mẫu: hiện tên user, ẨN mật khẩu trên màn hình; nút "Điền" vẫn đổ
  // đủ user + mật khẩu để đăng nhập (Portal cần đúng mật khẩu thật của GV/SV).
  const SAMPLE_ACCOUNTS: { label: string; u: string; p: string }[] = [
    { label: 'Quản trị (admin)', u: 'admin', p: 'admin123' },
    { label: 'Giáo viên', u: '40102', p: 'hai123' },
    { label: 'GVC PDT106 — Nguyễn Văn Huy (demo)', u: '40307', p: 'huy123' },
    { label: 'Sinh viên K59', u: 'K235520207027', p: '0378891141' },
    { label: 'Sinh viên K60', u: 'k245520207032', p: '09092006' },
    { label: 'Sinh viên K61', u: 'k255520207218', p: '20070803' },
  ];
  const fillAccount = (u: string, p: string) => {
    setValue('username', u, { shouldValidate: true });
    setValue('password', p, { shouldValidate: true });
  };

  const onSubmit = async (values: LoginFormValues) => {
    clearError();
    const ok = await login(values);
    if (ok) {
      // Sau đăng nhập → hub Atlas (hub tự điều hướng theo vai, hỗ trợ cả khoa/trường)
      navigate(from ?? '/atlas', { replace: true });
    }
  };

  const serverError = (f: 'username' | 'password') => getFieldError(error, f);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Be Vietnam Pro', system-ui, sans-serif" }}>
      <style>{CSS}</style>

      {/* ═══════ LEFT PANEL ═══════ */}
      <div
        className="hidden lg:flex"
        style={{
          width: '48%', flexDirection: 'column', justifyContent: 'space-between',
          padding: '3rem 3.5rem', position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(160deg, #0f172a 0%, #1e3a8a 50%, #1d4ed8 100%)',
        }}
      >
        {/* Background grid texture */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.035,
          backgroundImage: 'linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        {/* Glow blobs */}
        <div style={{ position: 'absolute', top: '15%', right: '-5%', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(96,165,250,0.18) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '-8%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)', filter: 'blur(40px)' }} />

        {/* Top: Logo */}
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={logoTNUT} alt="TNUT" style={{ width: 30, height: 30, objectFit: 'contain' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>ĐH Kỹ thuật Công nghiệp</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'white', letterSpacing: '-0.01em' }}>TNUT AI Platform</div>
          </div>
        </div>

        {/* Middle: Hero text + features */}
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'inline-block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#93c5fd', background: 'rgba(147,197,253,0.12)', border: '1px solid rgba(147,197,253,0.25)', borderRadius: 20, padding: '4px 12px', marginBottom: 14 }}>
              2 Chatbot AI hỗ trợ học tập
            </div>
            <h1 style={{ fontSize: '2.1rem', fontWeight: 900, lineHeight: 1.15, letterSpacing: '-0.03em', color: 'white', margin: 0 }}>
              Học thông minh hơn<br />
              <span style={{ color: '#60a5fa' }}>cùng AI của TNUT</span>
            </h1>
            <p style={{ marginTop: 12, fontSize: '0.88rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, maxWidth: 360 }}>
              Nền tảng học tập tích hợp 2 hệ thống chatbot AI — hỗ trợ chuyên môn từng môn học và cố vấn học tập toàn diện — dành riêng cho sinh viên và giảng viên Đại học Kỹ thuật Công nghiệp Thái Nguyên.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {CHATBOTS.map(({ icon: Icon, label, sub }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', transition: 'background .2s' }}>
                <div style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 10, background: 'rgba(96,165,250,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={16} color="#93c5fd" strokeWidth={1.8} />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'white' }}>{label}</div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Stats */}
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', gap: 32, marginTop: 20 }}>
          {[{ value: '5.000+', label: 'Sinh viên' }, { value: '98%', label: 'Hài lòng' }, { value: '24/7', label: 'Hỗ trợ' }].map(({ value, label }) => (
            <div key={label}>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#93c5fd' }}>{value}</div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: 2, fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════ RIGHT PANEL ═══════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
        {/* Top bar */}
        <div style={{ padding: '1.25rem 2rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <div className="flex lg:hidden" style={{ alignItems: 'center', gap: 8 }}>
            <img src={logoTNUT} alt="TNUT" style={{ width: 28, height: 28, objectFit: 'contain' }} />
            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1e3a8a' }}>TNUT AI</span>
          </div>
        </div>

        {/* Form area */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem 2rem 3rem' }}>
          <div style={{ width: '100%', maxWidth: 420 }}>

            {/* Header */}
            <div className="lg-card" style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.025em' }}>
                Đăng nhập
              </h2>
              <p style={{ marginTop: 8, fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6 }}>
                Sử dụng tài khoản Portal TNUT của bạn để tiếp tục
              </p>
            </div>

            {/* Card */}
            <div className="lg-form" style={{ background: 'white', borderRadius: 20, border: '1px solid #e2e8f0', padding: '2rem', boxShadow: '0 4px 24px rgba(15,23,42,0.06), 0 1px 4px rgba(15,23,42,0.04)' }}>

              {/* Server error */}
              {error && !error.errors?.length && (
                <div style={{ marginBottom: '1.25rem', display: 'flex', gap: 10, padding: '12px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12 }}>
                  <div style={{ flexShrink: 0, width: 18, height: 18, borderRadius: '50%', background: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                    <span style={{ color: 'white', fontSize: 11, fontWeight: 800 }}>!</span>
                  </div>
                  <span style={{ fontSize: '0.85rem', color: '#dc2626', lineHeight: 1.5 }}>{error.message}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} noValidate>

                {/* Username */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#374151', letterSpacing: '0.01em' }}>
                    Tên đăng nhập
                  </label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Nhập tên đăng nhập..."
                    autoComplete="username"
                    className="focus-visible:ring-[#2563eb]/30 bg-white"
                    style={{
                      borderColor: errors.username || serverError('username') ? '#f87171' : '#d1d5db',
                      borderRadius: 12, height: 46, fontSize: '0.88rem',
                      boxShadow: 'none',
                    }}
                    {...register('username')}
                  />
                  {(errors.username ?? serverError('username')) && (
                    <span style={{ fontSize: '0.75rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {errors.username?.message ?? serverError('username')}
                    </span>
                  )}
                </div>

                {/* Password */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#374151', letterSpacing: '0.01em' }}>
                    Mật khẩu
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Nhập mật khẩu..."
                      autoComplete="current-password"
                      className="focus-visible:ring-[#2563eb]/30 bg-white"
                      style={{
                        borderColor: errors.password || serverError('password') ? '#f87171' : '#d1d5db',
                        borderRadius: 12, height: 46, fontSize: '0.88rem',
                        paddingRight: 44, boxShadow: 'none',
                      }}
                      {...register('password')}
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, display: 'flex', alignItems: 'center' }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {(errors.password ?? serverError('password')) && (
                    <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>
                      {errors.password?.message ?? serverError('password')}
                    </span>
                  )}
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    background: isLoading ? '#93c5fd' : 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
                    borderRadius: 12, height: 48, fontSize: '0.9rem', fontWeight: 700,
                    border: 'none', marginTop: 4, cursor: isLoading ? 'not-allowed' : 'pointer',
                    boxShadow: isLoading ? 'none' : '0 4px 16px rgba(37,99,235,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'white',
                    transition: 'box-shadow .2s, opacity .2s',
                  }}
                  className="w-full hover:opacity-95 transition-opacity"
                >
                  {isLoading ? (
                    <div style={{ width: 17, height: 17, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'lg-spin 0.7s linear infinite' }} />
                  ) : (
                    <LogIn size={17} />
                  )}
                  {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </Button>
              </form>
            </div>

            {/* Footer note */}
            <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.6 }}>
              Sử dụng tài khoản đã được cấp bởi nhà trường.<br />
              Nếu gặp sự cố hãy liên hệ phòng CNTT.
            </p>

            {/* Tài khoản mẫu — bấm để điền nhanh (demo/pilot) */}
            <div style={{ marginTop: '1rem', border: '1px solid #e5e7eb', borderRadius: 12, padding: '0.85rem 1rem', background: '#f8fafc' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: 8 }}>
                Tài khoản mẫu <span style={{ fontWeight: 400, color: '#94a3b8' }}>(bấm để điền nhanh)</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {SAMPLE_ACCOUNTS.map((a) => (
                  <div key={a.u} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, fontSize: '0.75rem' }}>
                    <span style={{ color: '#334155', flexShrink: 0, minWidth: 104 }}>{a.label}</span>
                    <span style={{ fontFamily: 'ui-monospace, monospace', color: '#64748b', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.u} <span style={{ color: '#cbd5e1' }}>/ ••••••</span></span>
                    <button type="button" onClick={() => fillAccount(a.u, a.p)} style={{ flexShrink: 0, background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer', fontSize: '0.75rem', padding: '2px 4px' }}>Điền</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div style={{ padding: '1rem 2rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>© 2025 Đại học Kỹ thuật Công nghiệp Thái Nguyên · TNUT AI Platform</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
