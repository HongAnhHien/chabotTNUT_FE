import type { Row } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, PowerOff, Power, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { IAdminUser } from '@/infra/api/interfaces/IUser';
import { useManageUsersStore } from '../stores/user_store';

interface Props {
  row: Row<IAdminUser>;
}

export function DataTableRowActions({ row }: Props) {
  const { openDialog, toggleActiveUser } = useManageUsersStore();
  const user = row.original;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0 data-[state=open]:bg-muted">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Mở menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => openDialog('edit', user)}>
          <Pencil className="mr-2 h-4 w-4" />
          Chỉnh sửa
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => toggleActiveUser(user._id)}>
          {user.isActive ? (
            <><PowerOff className="mr-2 h-4 w-4 text-amber-500" /><span className="text-amber-600">Vô hiệu hóa</span></>
          ) : (
            <><Power className="mr-2 h-4 w-4 text-emerald-500" /><span className="text-emerald-600">Kích hoạt</span></>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => openDialog('delete', user)}
          className="text-red-600 focus:text-red-600 focus:bg-red-50"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Xóa tài khoản
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
