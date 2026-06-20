import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTableRowActions } from './data-table-row-actions';
import type { ILocation } from '@/infra/api/interfaces/ILocation';
import ImageCell from './ImageCell';

export type { ILocation };

const mucDoCfg: Record<string, string> = {
  'cao':        'bg-red-100 text-red-700 border-red-200',
  'trung bình': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'thấp':       'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const getMucDoCfg = (mucDo: string) =>
  mucDoCfg[mucDo.toLowerCase()] ?? 'bg-gray-100 text-gray-600 border-gray-200';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

export const columns: ColumnDef<ILocation>[] = [
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
    id: 'stt',
    header: 'ID',
    cell: ({ row }) => (
      <span className="text-xs font-mono text-muted-foreground select-all">{row.original._id}</span>
    ),
  },
  {
    id: 'images',
    header: 'Ảnh',
    cell: ({ row }) => <ImageCell row={row} />,
  },
  {
    id: 'location',
    header: 'Địa điểm',
    cell: ({ row }) => {
      const { ten_xa, ten_huyen, ten_tinh } = row.original;
      return (
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{ten_xa}</p>
          <p className="text-xs text-muted-foreground truncate">{ten_huyen}, {ten_tinh}</p>
        </div>
      );
    },
  },
  {
    id: 'xep_loai',
    header: 'Xếp loại',
    cell: ({ row }) => {
      const mucDo = row.original.cham_diem?.nguy_co ?? '';
      return (
        <Badge className={`text-xs font-medium whitespace-nowrap capitalize ${getMucDoCfg(mucDo)}`}>
          {mucDo || '—'}
        </Badge>
      );
    },
  },
  {
    id: 'toa_do',
    header: 'Tọa độ',
    cell: ({ row }) => {
      const { lat, lng } = row.original.toa_do;
      return (
        <span className="text-xs text-muted-foreground font-mono">
          {lat.toFixed(4)}, {lng.toFixed(4)}
        </span>
      );
    },
  },
  {
    id: 'created_by',
    header: 'Người tạo',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.original.created_by?.name ?? '—'}</span>
    ),
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
