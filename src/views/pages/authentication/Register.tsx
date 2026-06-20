import { type FC, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, UserPlus, Globe, MapPin, Layers, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/views/pages/stores/auth_store';
import { getFieldError } from '@/helper/error_handler';

// ── Schema ────────────────────────────────────────────
const registerSchema = z
  .object({
    username: z.string().min(3, 'Tên đăng nhập tối thiểu 3 ký tự'),
    name:     z.string().min(2, 'Họ tên tối thiểu 2 ký tự'),
    email:    z.email('Email không hợp lệ'),
    password: z
      .string()
      .min(6, 'Mật khẩu tối thiểu 6 ký tự'),
    confirm:  z.string(),
    terms:    z.boolean().refine((v) => v === true, 'Bạn phải đồng ý điều khoản'),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirm'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

// ── Password strength ─────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const score =
    (password.length >= 8 ? 1 : 0) +
    (/[A-Z]/.test(password) ? 1 : 0) +
    (/[0-9]/.test(password) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(password) ? 1 : 0);

  const levels = [
    { label: 'Rất yếu',    color: 'bg-red-500' },
    { label: 'Yếu',        color: 'bg-orange-400' },
    { label: 'Trung bình', color: 'bg-amber-400' },
    { label: 'Mạnh',       color: 'bg-[#6B8E23]' },
    { label: 'Rất mạnh',   color: 'bg-[#2F6B3F]' },
  ];

  if (!password) return null;
  const level = levels[Math.min(score, 4)];

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < score ? level.color : 'bg-stone-200'}`} />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{level.label}</p>
    </div>
  );
}

// ── Topo SVG ──────────────────────────────────────────
const TopoPattern = () => (
  <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
    <defs>
      <pattern id="topo2" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
        <path d="M0,100 Q25,60 50,100 Q75,140 100,100 Q125,60 150,100 Q175,140 200,100" fill="none" stroke="white" strokeWidth="1"/>
        <path d="M0,130 Q25,90 50,130 Q75,170 100,130 Q125,90 150,130 Q175,170 200,130" fill="none" stroke="white" strokeWidth="0.8"/>
        <path d="M0,70 Q25,30 50,70 Q75,110 100,70 Q125,30 150,70 Q175,110 200,70" fill="none" stroke="white" strokeWidth="0.8"/>
        <path d="M0,160 Q25,120 50,160 Q75,200 100,160 Q125,120 150,160 Q175,200 200,160" fill="none" stroke="white" strokeWidth="0.6"/>
        <path d="M0,40 Q25,0 50,40 Q75,80 100,40 Q125,0 150,40 Q175,80 200,40" fill="none" stroke="white" strokeWidth="0.6"/>
        <circle cx="50" cy="100" r="20" fill="none" stroke="white" strokeWidth="0.5"/>
        <circle cx="150" cy="100" r="30" fill="none" stroke="white" strokeWidth="0.5"/>
        <circle cx="100" cy="50" r="15" fill="none" stroke="white" strokeWidth="0.5"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#topo2)"/>
  </svg>
);

const perks = [
  { icon: MapPin,  text: 'Truy cập bản đồ rủi ro toàn quốc' },
  { icon: Layers,  text: 'Phân lớp dữ liệu địa hình đa chiều' },
  { icon: Compass, text: 'Định vị vùng nguy hiểm chính xác' },
  { icon: Globe,   text: 'Tích hợp dữ liệu vệ tinh thời gian thực' },
];

// ── Component ─────────────────────────────────────────
const Register: FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);

  const { register: registerUser, isLoading, error, clearError } = useAuthStore();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: '', name: '', email: '', password: '', confirm: '', terms: false },
  });

  const passwordValue = watch('password');

  const onSubmit = async (values: RegisterFormValues) => {
    clearError();
    const ok = await registerUser({
      username: values.username,
      name:     values.name,
      email:    values.email,
      password: values.password,
    });
    if (ok) navigate('/login');
  };

  const serverError = (field: string) => getFieldError(error, field);

  return (
    <div className="flex min-h-screen w-full font-sans">
      {/* ── LEFT ── */}
      <div
        className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col items-center justify-center p-12 text-white"
        style={{ background: 'linear-gradient(160deg, #17321f 0%, #2F6B3F 50%, #57741c 100%)' }}
      >
        <TopoPattern />
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full border border-white/10" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full border border-white/10" />

        <div className="relative z-10 flex flex-col items-center text-center space-y-8 max-w-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center shadow-xl">
              <Globe className="w-8 h-8 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight">GeoRisk</h1>
              <p className="mt-1 text-xs font-medium tracking-[0.2em] uppercase text-white/60">
                Geographic Risk Intelligence
              </p>
            </div>
          </div>

          <p className="text-sm text-white/75 leading-relaxed">
            Tạo tài khoản và bắt đầu phân tích, giám sát rủi ro địa lý trên toàn lãnh thổ Việt Nam.
          </p>

          <div className="w-full space-y-3">
            {perks.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3 text-left">
                <div className="mt-0.5 w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-white/80" strokeWidth={1.5} />
                </div>
                <p className="text-sm text-white/80 leading-snug">{text}</p>
              </div>
            ))}
          </div>

          <div className="w-full pt-2 border-t border-white/10 flex justify-between text-[10px] text-white/30 font-mono">
            <span>16°N 107°E</span>
            <span>v2.0.0</span>
            <span>VN · GEORISK</span>
          </div>
        </div>
      </div>

      {/* ── RIGHT ── */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto" style={{ background: '#F7F6F2' }}>
        <div className="w-full max-w-sm space-y-5 py-8">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 justify-center">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#2F6B3F' }}>
              <Globe className="w-4 h-4 text-white" strokeWidth={1.5} />
            </div>
            <span className="font-bold text-lg" style={{ color: '#2F6B3F' }}>GeoRisk</span>
          </div>

          <div className="text-center space-y-1">
            <h2 className="text-2xl font-bold" style={{ color: '#1e4429' }}>Tạo tài khoản</h2>
            <p className="text-sm text-muted-foreground">Đăng ký để tiếp cận dữ liệu rủi ro địa lý</p>
          </div>

          <Separator />

          {/* Server error tổng */}
          {error && !error.errors?.length && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error.message}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

            {/* Username + Name */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="username" className="text-sm font-medium" style={{ color: '#265935' }}>
                  Tên đăng nhập
                </label>
                <Input
                  id="username"
                  type="text"
                  placeholder="username"
                  autoComplete="username"
                  className="border-stone-300 focus-visible:ring-[#2F6B3F]/40 bg-white"
                  {...register('username')}
                />
                {(errors.username || serverError('username')) && (
                  <p className="text-xs text-red-600">{errors.username?.message ?? serverError('username')}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-sm font-medium" style={{ color: '#265935' }}>
                  Họ và tên
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Nguyễn Văn A"
                  autoComplete="name"
                  className="border-stone-300 focus-visible:ring-[#2F6B3F]/40 bg-white"
                  {...register('name')}
                />
                {(errors.name || serverError('name')) && (
                  <p className="text-xs text-red-600">{errors.name?.message ?? serverError('name')}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium" style={{ color: '#265935' }}>Email</label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                className="border-stone-300 focus-visible:ring-[#2F6B3F]/40 bg-white"
                {...register('email')}
              />
              {(errors.email || serverError('email')) && (
                <p className="text-xs text-red-600">{errors.email?.message ?? serverError('email')}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium" style={{ color: '#265935' }}>Mật khẩu</label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Tối thiểu 6 ký tự"
                  autoComplete="new-password"
                  className="pr-10 border-stone-300 focus-visible:ring-[#2F6B3F]/40 bg-white"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <PasswordStrength password={passwordValue} />
              {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
            </div>

            {/* Confirm */}
            <div className="space-y-1.5">
              <label htmlFor="confirm" className="text-sm font-medium" style={{ color: '#265935' }}>
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <Input
                  id="confirm"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Nhập lại mật khẩu"
                  autoComplete="new-password"
                  className="pr-10 border-stone-300 focus-visible:ring-[#2F6B3F]/40 bg-white"
                  {...register('confirm')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirm && <p className="text-xs text-red-600">{errors.confirm.message}</p>}
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                className="mt-0.5 data-[state=checked]:bg-[#2F6B3F] data-[state=checked]:border-[#2F6B3F]"
                onCheckedChange={(checked) => setValue('terms', checked === true, { shouldValidate: true })}
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground leading-snug cursor-pointer">
                Tôi đồng ý với{' '}
                <Link to="#" className="font-medium hover:underline" style={{ color: '#2F6B3F' }}>Điều khoản dịch vụ</Link>{' '}
                và{' '}
                <Link to="#" className="font-medium hover:underline" style={{ color: '#2F6B3F' }}>Chính sách bảo mật</Link>
              </label>
            </div>
            {errors.terms && <p className="text-xs text-red-600">{errors.terms.message}</p>}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full gap-2 text-white font-semibold shadow-md hover:opacity-90 transition-opacity disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #265935, #2F6B3F, #57741c)' }}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {isLoading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Đã có tài khoản?{' '}
            <Link to="/login" className="font-medium hover:underline" style={{ color: '#2F6B3F' }}>
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
