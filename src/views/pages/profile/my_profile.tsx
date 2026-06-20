import { type FC, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, User, Mail, KeyRound, ShieldCheck, Calendar, Loader2, LayoutDashboard, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUser } from '@/hooks/useUser';
import { useAuthStore } from '@/views/pages/stores/auth_store';
import { getFieldError } from '@/helper/error_handler';

// ── Schemas ───────────────────────────────────────────
const profileSchema = z.object({
  username: z.string().min(3, 'Tối thiểu 3 ký tự'),
  name:     z.string().min(2, 'Tối thiểu 2 ký tự'),
  email:    z.email('Email không hợp lệ'),
});

const passwordSchema = z
  .object({
    current_password: z.string().min(1, 'Nhập mật khẩu hiện tại'),
    new_password:     z.string().min(6, 'Tối thiểu 6 ký tự'),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirm_password'],
  });

type ProfileFormValues  = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

// ── Helpers ───────────────────────────────────────────
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

const roleBadge: Record<string, { label: string; style: string }> = {
  admin: { label: 'Admin', style: 'bg-[#2F6B3F]/10 text-[#2F6B3F] border border-[#2F6B3F]/20' },
  user:  { label: 'User',  style: 'bg-[#6B8E23]/10 text-[#6B8E23] border border-[#6B8E23]/20' },
};

// ── Sub-components ────────────────────────────────────
const SectionCard: FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
    <div className="flex items-center gap-2.5 px-6 py-4 border-b border-stone-100">
      <span className="text-[#2F6B3F]">{icon}</span>
      <h2 className="font-semibold text-stone-800">{title}</h2>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const FieldError: FC<{ message?: string }> = ({ message }) =>
  message ? <p className="mt-1 text-xs text-red-600">{message}</p> : null;

// ── Main ──────────────────────────────────────────────
const MyProfile: FC = () => {
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const logout   = useAuthStore((s) => s.logout);
  const {
    profile, avatarUrl, isLoading, isUpdating, error,
    updateProfile, changePassword, uploadAvatar, clearError,
  } = useUser();

  const dashboardPath = profile?.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: {
      username: profile?.username ?? '',
      name:     profile?.name     ?? '',
      email:    profile?.email    ?? '',
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current_password: '', new_password: '', confirm_password: '' },
  });

  const onProfileSubmit = async (values: ProfileFormValues) => {
    clearError();
    await updateProfile(values);
  };

  const onPasswordSubmit = async (values: PasswordFormValues) => {
    clearError();
    const ok = await changePassword({
      current_password: values.current_password,
      new_password:     values.new_password,
    });
    if (ok) passwordForm.reset();
  };

  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadAvatar(file);
    e.target.value = '';
  };

  const badge = roleBadge[profile?.role ?? ''] ?? roleBadge['user'];
  const sf = (field: string) => getFieldError(error, field);

  if (isLoading && !profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#2F6B3F]" />
          <p className="text-sm text-muted-foreground">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-3 p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1e4429' }}>Hồ sơ của tôi</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Quản lý thông tin tài khoản và bảo mật</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => navigate(dashboardPath)}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </Button>
        </div>
      </div>

      {/* ── Avatar card ── */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 flex items-center gap-6">
        <div className="relative shrink-0">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-stone-100 shadow-md bg-stone-100">
            {avatarUrl ? (
              <img src={avatarUrl} alt={profile?.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#2F6B3F]/10">
                <User className="w-10 h-10 text-[#2F6B3F]/40" />
              </div>
            )}
          </div>
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => avatarInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ background: '#2F6B3F' }}
          >
            {isUpdating
              ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
              : <Camera className="w-3.5 h-3.5 text-white" />
            }
          </button>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-stone-800 truncate">{profile?.name}</h2>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.style}`}>{badge.label}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">@{profile?.username}</p>
          <p className="text-sm text-muted-foreground">{profile?.email}</p>
        </div>

        <div className="hidden sm:flex flex-col gap-2 text-xs text-stone-400 shrink-0">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>Tạo: {profile?.createdAt ? formatDate(profile.createdAt) : '—'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className={profile?.isActive !== false ? 'text-[#2F6B3F]' : 'text-red-500'}>
              {profile?.isActive !== false ? 'Đang hoạt động' : 'Đã vô hiệu hóa'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Edit profile ── */}
      <SectionCard title="Thông tin cá nhân" icon={<User className="w-4 h-4" />}>
        {error && !error.errors?.length && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error.message}
          </div>
        )}
        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="p-username" className="text-sm font-medium" style={{ color: '#265935' }}>
                Tên đăng nhập
              </label>
              <Input
                id="p-username"
                className="border-stone-300 focus-visible:ring-[#2F6B3F]/40 bg-stone-50"
                {...profileForm.register('username')}
              />
              <FieldError message={profileForm.formState.errors.username?.message ?? sf('username')} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="p-name" className="text-sm font-medium" style={{ color: '#265935' }}>
                Họ và tên
              </label>
              <Input
                id="p-name"
                className="border-stone-300 focus-visible:ring-[#2F6B3F]/40 bg-stone-50"
                {...profileForm.register('name')}
              />
              <FieldError message={profileForm.formState.errors.name?.message ?? sf('name')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="p-email" className="text-sm font-medium flex items-center gap-1.5" style={{ color: '#265935' }}>
              <Mail className="w-3.5 h-3.5" /> Email
            </label>
            <Input
              id="p-email"
              type="email"
              className="border-stone-300 focus-visible:ring-[#2F6B3F]/40 bg-stone-50"
              {...profileForm.register('email')}
            />
            <FieldError message={profileForm.formState.errors.email?.message ?? sf('email')} />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={isUpdating}
              className="gap-2 text-white hover:opacity-90 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #2F6B3F, #3d7a50)' }}
            >
              {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
              {isUpdating ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </form>
      </SectionCard>

      {/* ── Change password ── */}
      <SectionCard title="Đổi mật khẩu" icon={<KeyRound className="w-4 h-4" />}>
        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <label htmlFor="current_password" className="text-sm font-medium" style={{ color: '#265935' }}>
              Mật khẩu hiện tại
            </label>
            <Input
              id="current_password"
              type="password"
              placeholder="••••••••"
              className="border-stone-300 focus-visible:ring-[#2F6B3F]/40 bg-stone-50"
              {...passwordForm.register('current_password')}
            />
            <FieldError message={passwordForm.formState.errors.current_password?.message ?? sf('current_password')} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="new_password" className="text-sm font-medium" style={{ color: '#265935' }}>
                Mật khẩu mới
              </label>
              <Input
                id="new_password"
                type="password"
                placeholder="Tối thiểu 6 ký tự"
                className="border-stone-300 focus-visible:ring-[#2F6B3F]/40 bg-stone-50"
                {...passwordForm.register('new_password')}
              />
              <FieldError message={passwordForm.formState.errors.new_password?.message} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="confirm_password" className="text-sm font-medium" style={{ color: '#265935' }}>
                Xác nhận mật khẩu mới
              </label>
              <Input
                id="confirm_password"
                type="password"
                placeholder="Nhập lại mật khẩu mới"
                className="border-stone-300 focus-visible:ring-[#2F6B3F]/40 bg-stone-50"
                {...passwordForm.register('confirm_password')}
              />
              <FieldError message={passwordForm.formState.errors.confirm_password?.message} />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={isUpdating}
              className="gap-2 text-white hover:opacity-90 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #265935, #2F6B3F)' }}
            >
              {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
              {isUpdating ? 'Đang đổi...' : 'Đổi mật khẩu'}
            </Button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
};

export default MyProfile;
