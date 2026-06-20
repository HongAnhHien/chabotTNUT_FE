import type { Table } from '@tanstack/react-table';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Props<TData> {
  table:          Table<TData>;
  searchTerm:     string;
  onSearchChange: (v: string) => void;
  role:           string;
  onRoleChange:   (v: string) => void;
  status:         string;
  onStatusChange: (v: string) => void;
}

export function DataTableToolbar<TData>({
  table, searchTerm, onSearchChange, role, onRoleChange, status, onStatusChange,
}: Props<TData>) {
  const hidable = table.getAllColumns().filter((c) => c.getCanHide());

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Tìm theo tên, username..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 w-full sm:w-64"
          />
        </div>

        {/* Role filter */}
        <Select value={role} onValueChange={onRoleChange}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Vai trò" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>

        {/* Status filter */}
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="true">Hoạt động</SelectItem>
            <SelectItem value="false">Vô hiệu hóa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Column visibility */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 shrink-0">
            <SlidersHorizontal className="h-4 w-4" />
            Cột
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuLabel>Hiển thị cột</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {hidable.map((col) => (
            <DropdownMenuCheckboxItem
              key={col.id}
              checked={col.getIsVisible()}
              onCheckedChange={(v) => col.toggleVisibility(!!v)}
              className="capitalize"
            >
              {typeof col.columnDef.header === 'string' ? col.columnDef.header : col.id}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
