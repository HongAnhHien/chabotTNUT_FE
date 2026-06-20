import * as React from 'react';
import type { ColumnDef, ColumnFiltersState, SortingState, Table as TanTable } from '@tanstack/react-table';
import {
  flexRender, getCoreRowModel, getFilteredRowModel,
  getSortedRowModel, useReactTable,
} from '@tanstack/react-table';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Mail, Phone, User } from 'lucide-react';
import { ClassStudentsToolbar } from './Toolbar';
import type { ITeacherStudent } from '@/infra/api/interfaces/ITeacher';

export type TTable = TanTable<ITeacherStudent>;

const fmtDate = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
};

function initials(name: string) {
  return name.split(' ').map(w => w[0]).filter(Boolean).slice(-2).join('').toUpperCase();
}

// ── Skeleton ──────────────────────────────────────────
const SkRow = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid rgba(37,99,235,0.06)' }}>
    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(90deg,#e0eaff 25%,#c7d9fe 50%,#e0eaff 75%)', backgroundSize: '200%', animation: 'sk-pulse 1.4s ease infinite', flexShrink: 0 }} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ width: '40%', height: 13, borderRadius: 6, background: 'linear-gradient(90deg,#e0eaff 25%,#c7d9fe 50%,#e0eaff 75%)', backgroundSize: '200%', animation: 'sk-pulse 1.4s ease infinite' }} />
      <div style={{ width: '25%', height: 11, borderRadius: 6, background: 'linear-gradient(90deg,#e0eaff 25%,#c7d9fe 50%,#e0eaff 75%)', backgroundSize: '200%', animation: 'sk-pulse 1.4s ease infinite' }} />
    </div>
    <div style={{ width: 80, height: 11, borderRadius: 6, background: 'linear-gradient(90deg,#e0eaff 25%,#c7d9fe 50%,#e0eaff 75%)', backgroundSize: '200%', animation: 'sk-pulse 1.4s ease infinite' }} />
  </div>
);

// ── Student card row ──────────────────────────────────
function StudentCard({ student, idx }: { student: ITeacherStudent; idx: number }) {
  const name = student.ho_ten ?? '';
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', borderBottom: '1px solid rgba(37,99,235,0.06)', transition: 'background .15s' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(37,99,235,0.03)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Index */}
      <div style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(37,99,235,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', flexShrink: 0 }}>
        {idx + 1}
      </div>

      {/* Avatar */}
      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#1e3a8a,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, color: 'white', flexShrink: 0, boxShadow: '0 3px 8px rgba(37,99,235,0.22)' }}>
        {name ? initials(name) : <User size={15} color="white" />}
      </div>

      {/* Name + code */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b' }}>{name || '—'}</span>
          <span style={{ fontSize: '0.68rem', background: 'rgba(37,99,235,0.08)', color: '#2563eb', borderRadius: 20, padding: '1px 8px', fontWeight: 700, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{student.ma_sinh_vien}</span>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 2, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{student.ten_lop || student.ma_lop || '—'}</span>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>· Sinh: {fmtDate(student.ngay_sinh)}</span>
        </div>
      </div>

      {/* Contact */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-end', flexShrink: 0 }}>
        {student.dien_thoai && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: '#64748b' }}>
            <Phone size={10} /> {student.dien_thoai}
          </span>
        )}
        {student.e_mail && (
          <a href={`mailto:${student.e_mail}`} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: '#2563eb', textDecoration: 'none' }}>
            <Mail size={10} /> {student.e_mail}
          </a>
        )}
      </div>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────
interface Props<TData, TValue> {
  columns:  ColumnDef<TData, TValue>[];
  data:     TData[];
  loading?: boolean;
  search:         string;
  onSearchChange: (v: string) => void;
  classFilter:    string;
  onClassFilter:  (v: string) => void;
  classOptions:   string[];
  onFilteredCount?: (n: number) => void;
}

const CSS = `@keyframes sk-pulse { 0%,100%{opacity:.7} 50%{opacity:.3} }`;

// ── Component ─────────────────────────────────────────
export function DataTable<TData extends ITeacherStudent, TValue>({
  columns, data, loading,
  search, onSearchChange, classFilter, onClassFilter, classOptions,
  onFilteredCount,
}: Props<TData, TValue>) {
  const [sorting,          setSorting]          = React.useState<SortingState>([]);
  const [columnFilters,    setColumnFilters]    = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<Record<string, boolean>>({});
  const [viewMode,         setViewMode]         = React.useState<'card' | 'table'>('card');

  React.useEffect(() => {
    const filters: ColumnFiltersState = [];
    if (classFilter !== 'all') filters.push({ id: 'ten_lop', value: classFilter });
    setColumnFilters(filters);
  }, [classFilter]);

  const filteredData = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(s =>
      s.ho_ten?.toLowerCase().includes(q) ||
      s.ma_sinh_vien?.toLowerCase().includes(q)
    );
  }, [data, search]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel:     getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel:   getSortedRowModel(),
    state: { sorting, columnFilters, columnVisibility },
    onSortingChange:          setSorting,
    onColumnFiltersChange:    setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
  });

  const rows = table.getFilteredRowModel().rows;

  React.useEffect(() => { onFilteredCount?.(rows.length); }, [rows.length, onFilteredCount]);

  return (
    <div style={{ background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.95)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 24px rgba(37,99,235,0.08)' }}>
      <style>{CSS}</style>

      {/* Toolbar */}
      <ClassStudentsToolbar
        table={table as TTable}
        search={search}
        onSearchChange={onSearchChange}
        classFilter={classFilter}
        onClassFilter={onClassFilter}
        classOptions={classOptions}
      />

      {/* Sub-header: count + view toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', borderBottom: '1px solid rgba(37,99,235,0.06)', background: 'rgba(248,250,255,0.6)' }}>
        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
          {loading ? 'Đang tải...' : `${rows.length} sinh viên`}
        </span>
        <div style={{ display: 'flex', gap: 3, background: 'rgba(37,99,235,0.06)', borderRadius: 10, padding: 3 }}>
          {(['card', 'table'] as const).map(mode => (
            <button key={mode} onClick={() => setViewMode(mode)}
              style={{ padding: '4px 12px', borderRadius: 8, fontSize: '0.73rem', fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all .15s', background: viewMode === mode ? 'white' : 'transparent', color: viewMode === mode ? '#1e3a8a' : '#94a3b8', boxShadow: viewMode === mode ? '0 1px 4px rgba(37,99,235,0.12)' : 'none' }}
            >
              {mode === 'card' ? 'Thẻ' : 'Bảng'}
            </button>
          ))}
        </div>
      </div>

      {/* Content — no pagination, hiện hết */}
      {viewMode === 'card' ? (
        <div>
          {loading
            ? [1,2,3,4,5].map(i => <SkRow key={i} />)
            : rows.length
              ? rows.map((row, i) => <StudentCard key={row.id} student={row.original} idx={i} />)
              : <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>Không tìm thấy sinh viên nào.</div>
          }
        </div>
      ) : (
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(hg => (
              <TableRow key={hg.id} style={{ background: 'rgba(37,99,235,0.04)' }}>
                {hg.headers.map(header => (
                  <TableHead key={header.id} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={columns.length} style={{ height: 160, textAlign: 'center', color: '#94a3b8' }}>Đang tải...</TableCell></TableRow>
            ) : rows.length ? (
              rows.map((row, i) => (
                <TableRow key={row.id} style={{ background: i % 2 !== 0 ? 'rgba(37,99,235,0.02)' : 'transparent' }} className="hover:bg-blue-50/40 transition-colors">
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id} style={{ textAlign: 'center', padding: '10px 12px' }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={columns.length} style={{ height: 160, textAlign: 'center', color: '#94a3b8' }}>Không có kết quả.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      )}

      {/* Footer: total count only */}
      {!loading && rows.length > 0 && (
        <div style={{ padding: '10px 20px', borderTop: '1px solid rgba(37,99,235,0.07)', background: 'rgba(248,250,255,0.6)', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'right' }}>
          Hiển thị {rows.length} / {data.length} sinh viên
        </div>
      )}
    </div>
  );
}
