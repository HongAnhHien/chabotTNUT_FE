import type { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DataTableRowActions } from './data-table-row-actions';
import { getAvatarUrl } from '@/hooks/useUser';
import type { IAdminUser } from '@/infra/api/interfaces/IUser';

export type { IAdminUser };

const roleCfg: Record<string, { label: string; className: string }> = {
  admin: { label: 'Admin', className: 'bg-[#2F6B3F]/10 text-[#2F6B3F] border-[#2F6B3F]/20' },
  user:  { label: 'User',  className: 'bg-[#6B8E23]/10 text-[#6B8E23] border-[#6B8E23]/20' },
};

const activeCfg = {
  true:  { label: 'Hoạt động',      className: 'bg-emerald-100 text-emerald-700 border-0' },
  false: { label: 'Vô hiệu hóa',   className: 'bg-rose-100 text-rose-700 border-0' },
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

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
      const { name, username, avatar } = row.original;
      return (
        <div className="flex items-center gap-2.5">
          <Avatar size="sm">
            <AvatarImage src={getAvatarUrl(avatar ?? undefined)} />
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
      const cfg = roleCfg[row.original.role] ?? roleCfg['user'];
      return (
        <Badge variant="outline" className={`text-xs font-medium ${cfg.className}`}>
          {cfg.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'isActive',
    header: 'Trạng thái',
    cell: ({ row }) => {
      const cfg = row.original.isActive ? activeCfg['true'] : activeCfg['false'];
      return <Badge className={`text-xs font-medium ${cfg.className}`}>{cfg.label}</Badge>;
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Ngày tạo',
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">{formatDate(row.original.createdAt)}</span>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
