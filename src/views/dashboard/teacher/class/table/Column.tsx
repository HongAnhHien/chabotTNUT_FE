import type { ColumnDef } from '@tanstack/react-table';
import type { ITeacherStudent } from '@/infra/api/interfaces/ITeacher';

const fmtDate = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
};

export const columns: ColumnDef<ITeacherStudent>[] = [
  {
    id: 'stt',
    header: 'STT',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground font-mono tabular-nums">{row.index + 1}</span>
    ),
  },
  {
    accessorKey: 'ma_sinh_vien',
    header: 'Mã SV',
    cell: ({ row }) => (
      <span className="text-sm font-mono font-semibold text-primary select-all">{row.original.ma_sinh_vien}</span>
    ),
  },
  {
    accessorKey: 'ho_ten',
    header: 'Họ và tên',
    cell: ({ row }) => (
      <p className="text-sm font-medium min-w-35">{row.original.ho_ten}</p>
    ),
  },
  {
    accessorKey: 'ten_lop',
    header: 'Lớp',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground whitespace-nowrap">{row.original.ten_lop || row.original.ma_lop || '—'}</span>
    ),
  },
  {
    accessorKey: 'ngay_sinh',
    header: 'Ngày sinh',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground whitespace-nowrap">{fmtDate(row.original.ngay_sinh)}</span>
    ),
  },
  {
    accessorKey: 'dien_thoai',
    header: 'Điện thoại',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground font-mono">{row.original.dien_thoai ?? '—'}</span>
    ),
  },
  {
    accessorKey: 'e_mail',
    header: 'Email',
    cell: ({ row }) => (
      row.original.e_mail
        ? <a href={`mailto:${row.original.e_mail}`} className="text-sm text-primary hover:underline">{row.original.e_mail}</a>
        : <span className="text-sm text-muted-foreground">—</span>
    ),
  },
];
