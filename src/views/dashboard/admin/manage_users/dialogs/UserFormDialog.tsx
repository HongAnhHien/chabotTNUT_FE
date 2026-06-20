import { type FC, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useManageUsersStore } from '../stores/user_store';
import { getFieldError } from '@/helper/error_handler';

// ── Schemas ───────────────────────────────────────────
const createSchema = z.object({
  username: z.string().min(3, 'Tối thiểu 3 ký tự'),
  password: z.string().min(6, 'Tối thiểu 6 ký tự'),
  name:     z.string().min(2, 'Tối thiểu 2 ký tự'),
  email:    z.email('Email không hợp lệ'),
  role:     z.enum(['admin', 'user']),
});

const editSchema = z.object({
  username: z.string().min(3, 'Tối thiểu 3 ký tự'),
  name:     z.string().min(2, 'Tối thiểu 2 ký tự'),
  email:    z.email('Email không hợp lệ'),
  role:     z.enum(['admin', 'user']),
});

type CreateValues = z.infer<typeof createSchema>;
type EditValues   = z.infer<typeof editSchema>;

const FieldError: FC<{ message?: string }> = ({ message }) =>
  message ? <p className="mt-1 text-xs text-red-600">{message}</p> : null;

// ── Create Dialog ─────────────────────────────────────
export const CreateUserDialog: FC = () => {
  const { dialogMode, isMutating, error, createUser, closeDialog, clearError } = useManageUsersStore();
  const open = dialogMode === 'create';

  const { register, handleSubmit, reset, formState: { errors }, setValue, watch } = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { username: '', password: '', name: '', email: '', role: 'user' },
  });

  useEffect(() => { if (!open) reset(); }, [open, reset]);

  const onSubmit = async (values: CreateValues) => {
    clearError();
    const ok = await createUser(values);
    if (ok) closeDialog();
  };

  const sf = (field: string) => getFieldError(error, field);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && closeDialog()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle style={{ color: '#1e4429' }}>Thêm tài khoản mới</DialogTitle>
        </DialogHeader>

        {error && !error.errors?.length && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
            {error.message}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: '#265935' }}>Tên đăng nhập</label>
              <Input placeholder="username" {...register('username')} />
              <FieldError message={errors.username?.message ?? sf('username')} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: '#265935' }}>Mật khẩu</label>
              <Input type="password" placeholder="••••••" {...register('password')} />
              <FieldError message={errors.password?.message ?? sf('password')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: '#265935' }}>Họ và tên</label>
            <Input placeholder="Nguyễn Văn A" {...register('name')} />
            <FieldError message={errors.name?.message ?? sf('name')} />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: '#265935' }}>Email</label>
            <Input type="email" placeholder="you@example.com" {...register('email')} />
            <FieldError message={errors.email?.message ?? sf('email')} />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: '#265935' }}>Vai trò</label>
            <Select value={watch('role')} onValueChange={(v) => setValue('role', v as 'admin' | 'user')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <FieldError message={errors.role?.message} />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={closeDialog} disabled={isMutating}>Hủy</Button>
            <Button
              type="submit"
              disabled={isMutating}
              className="gap-2 text-white"
              style={{ background: 'linear-gradient(135deg, #2F6B3F, #3d7a50)' }}
            >
              {isMutating && <Loader2 className="w-4 h-4 animate-spin" />}
              {isMutating ? 'Đang tạo...' : 'Tạo tài khoản'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ── Edit Dialog ───────────────────────────────────────
export const EditUserDialog: FC = () => {
  const { dialogMode, selected, isMutating, error, updateUser, closeDialog, clearError } = useManageUsersStore();
  const open = dialogMode === 'edit';

  const { register, handleSubmit, reset, formState: { errors }, setValue, watch } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
  });

  useEffect(() => {
    if (open && selected) {
      reset({
        username: selected.username,
        name:     selected.name,
        email:    selected.email ?? '',
        role:     selected.role,
      });
    }
  }, [open, selected, reset]);

  const onSubmit = async (values: EditValues) => {
    if (!selected) return;
    clearError();
    const ok = await updateUser(selected._id, values);
    if (ok) closeDialog();
  };

  const sf = (field: string) => getFieldError(error, field);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && closeDialog()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle style={{ color: '#1e4429' }}>Chỉnh sửa tài khoản</DialogTitle>
        </DialogHeader>

        {error && !error.errors?.length && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
            {error.message}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: '#265935' }}>Tên đăng nhập</label>
              <Input {...register('username')} />
              <FieldError message={errors.username?.message ?? sf('username')} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: '#265935' }}>Vai trò</label>
              <Select value={watch('role')} onValueChange={(v) => setValue('role', v as 'admin' | 'user')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <FieldError message={errors.role?.message} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: '#265935' }}>Họ và tên</label>
            <Input {...register('name')} />
            <FieldError message={errors.name?.message ?? sf('name')} />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: '#265935' }}>Email</label>
            <Input type="email" {...register('email')} />
            <FieldError message={errors.email?.message ?? sf('email')} />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={closeDialog} disabled={isMutating}>Hủy</Button>
            <Button
              type="submit"
              disabled={isMutating}
              className="gap-2 text-white"
              style={{ background: 'linear-gradient(135deg, #2F6B3F, #3d7a50)' }}
            >
              {isMutating && <Loader2 className="w-4 h-4 animate-spin" />}
              {isMutating ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
