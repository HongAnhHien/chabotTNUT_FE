import * as React from 'react';
import type { ColumnDef, RowSelectionState, SortingState } from '@tanstack/react-table';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Ban, CheckCircle2, Loader2 } from 'lucide-react';
import { DataTableToolbar } from './data-table-toolbar';
import type { IAdminUser } from '@/infra/api/interfaces/IUser';
import { useManageUsersStore } from '../stores/user_store';

// ── Config ────────────────────────────────────────────────────────────────────
const ROLE_CFG: Record<string, { label: string; className: string }> = {
  admin:   { label: 'Admin',     className: 'bg-[#2F6B3F]/10 text-[#2F6B3F] border-[#2F6B3F]/20' },
  teacher: { label: 'Giáo viên', className: 'bg-[#6B8E23]/10 text-[#6B8E23] border-[#6B8E23]/20' },
  student: { label: 'Sinh viên', className: 'bg-blue-500/10 text-blue-700 border-blue-500/20' },
};

const BLOCKED_CFG = {
  false: { label: 'Hoạt động', className: 'bg-emerald-100 text-emerald-700 border-0' },
  true:  { label: 'Đã chặn',   className: 'bg-rose-100 text-rose-700 border-0' },
};

// ── Mobile card ───────────────────────────────────────────────────────────────
function UserMobileCard({ user }: { user: IAdminUser }) {
  const { openDialog, unblockUser, isMutating } = useManageUsersStore();
  const roleCfg    = ROLE_CFG[user.role] ?? ROLE_CFG['student'];
  const blockedCfg = user.is_blocked ? BLOCKED_CFG['true'] : BLOCKED_CFG['false'];

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
      {/* Avatar */}
      <Avatar size="sm" className="shrink-0">
        <AvatarFallback className="text-xs font-semibold bg-[#2F6B3F]/10 text-[#2F6B3F]">
          {user.name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-sm font-semibold truncate leading-tight">{user.name}</p>
        <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${roleCfg.className}`}>
            {roleCfg.label}
          </Badge>
          <Badge className={`text-[10px] px-1.5 py-0 h-4 ${blockedCfg.className}`}>
            {blockedCfg.label}
          </Badge>
        </div>
      </div>

      {/* Actions */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Mở menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {user.is_blocked ? (
            <DropdownMenuItem onClick={() => unblockUser(user._id)} disabled={isMutating}>
              {isMutating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />}
              <span className="text-emerald-600">Bỏ chặn</span>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => openDialog('block', user)}
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <Ban className="mr-2 h-4 w-4" />Chặn tài khoản
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props<TData, TValue> {
  columns:             ColumnDef<TData, TValue>[];
  data:                TData[];
  loading?:            boolean;
  onSelectionChange?:  (count: number) => void;
  searchTerm:          string;
  onSearchChange:      (v: string) => void;
  role:                string;
  onRoleChange:        (v: string) => void;
  status:              string;
  onStatusChange:      (v: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function DataTable<TData, TValue>({
  columns, data, loading, onSelectionChange,
  searchTerm, onSearchChange, role, onRoleChange, status, onStatusChange,
}: Props<TData, TValue>) {

  const MOBILE_HIDDEN = ['email', 'login_count', 'last_login_at', 'created_at'];
  const getVisibility = (mobile: boolean) =>
    mobile ? Object.fromEntries(MOBILE_HIDDEN.map((id) => [id, false])) : {};

  const [isMobile,         setIsMobile]         = React.useState(() => window.innerWidth < 768);
  const [sorting,          setSorting]          = React.useState<SortingState>([]);
  const [rowSelection,     setRowSelection]     = React.useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = React.useState<Record<string, boolean>>(
    () => getVisibility(window.innerWidth < 768),
  );

  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
      setColumnVisibility(getVisibility(e.matches));
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data, columns,
    getCoreRowModel: getCoreRowModel(),
    state: { sorting, rowSelection, columnVisibility },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    enableRowSelection: true,
  });

  React.useEffect(() => {
    onSelectionChange?.(table.getSelectedRowModel().rows.length);
  }, [rowSelection, onSelectionChange, table]);

  const rows = table.getRowModel().rows;

  return (
    <div className="space-y-3">
      <DataTableToolbar
        table={table}
        searchTerm={searchTerm} onSearchChange={onSearchChange}
        role={role}             onRoleChange={onRoleChange}
        status={status}         onStatusChange={onStatusChange}
      />

      {/* ── Mobile card list ── */}
      {isMobile ? (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          {loading ? (
            <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">
              Đang tải...
            </div>
          ) : rows.length ? (
            rows.map((row) => (
              <UserMobileCard
                key={row.id}
                user={row.original as unknown as IAdminUser}
              />
            ))
          ) : (
            <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">
              Không có kết quả.
            </div>
          )}
        </div>
      ) : (
        /* ── Desktop table ── */
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id} className="bg-muted/40">
                  {hg.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : rows.length ? (
                rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="hover:bg-muted/30 transition-colors"
                    data-state={row.getIsSelected() ? 'selected' : undefined}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3 text-center">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                    Không có kết quả.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
