import type { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DataTableRowActions } from './data-table-row-actions';
import type { IAdminUser } from '@/infra/api/interfaces/IUser';

export type { IAdminUser };

const roleCfg: Record<string, { label: string; className: string }> = {
  admin:   { label: 'Admin',      className: 'bg-[#2F6B3F]/10 text-[#2F6B3F] border-[#2F6B3F]/20' },
  teacher: { label: 'Giáo viên',  className: 'bg-[#6B8E23]/10 text-[#6B8E23] border-[#6B8E23]/20' },
  student: { label: 'Sinh viên',  className: 'bg-blue-500/10 text-blue-700 border-blue-500/20' },
};

const blockedCfg = {
  false: { label: 'Hoạt động', className: 'bg-emerald-100 text-emerald-700 border-0' },
  true:  { label: 'Đã chặn',   className: 'bg-rose-100 text-rose-700 border-0' },
};

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const formatDateTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Chưa đăng nhập';

export const columns: ColumnDef<IAdminUser>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
        onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
        aria-label="Chọn tất cả"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(v) => row.toggleSelected(!!v)}
        aria-label="Chọn hàng"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: 'account',
    header: 'Người dùng',
    cell: ({ row }) => {
      const { name, username } = row.original;
      return (
        <div className="flex items-center gap-2.5">
          <Avatar size="sm">
            <AvatarFallback className="text-xs font-semibold bg-[#2F6B3F]/10 text-[#2F6B3F]">
              {name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="text-left min-w-0">
            <p className="text-sm font-medium truncate">{name}</p>
            <p className="text-xs text-muted-foreground truncate">@{username}</p>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.original.email ?? '—'}</span>
    ),
  },
  {
    accessorKey: 'role',
    header: 'Vai trò',
    cell: ({ row }) => {
      const cfg = roleCfg[row.original.role] ?? roleCfg['student'];
      return (
        <Badge variant="outline" className={`text-xs font-medium ${cfg.className}`}>
          {cfg.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'is_blocked',
    header: 'Trạng thái',
    cell: ({ row }) => {
      const cfg = row.original.is_blocked ? blockedCfg['true'] : blockedCfg['false'];
      return <Badge className={`text-xs font-medium ${cfg.className}`}>{cfg.label}</Badge>;
    },
  },
  {
    accessorKey: 'login_count',
    header: 'Lượt đăng nhập',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground tabular-nums">{row.original.login_count}</span>
    ),
  },
  {
    accessorKey: 'last_login_at',
    header: 'Đăng nhập gần nhất',
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(row.original.last_login_at)}</span>
    ),
  },
  {
    accessorKey: 'created_at',
    header: 'Ngày tạo',
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">{formatDate(row.original.created_at)}</span>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
