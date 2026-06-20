import * as React from 'react';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ImageOff, MoreHorizontal, Eye, Pencil, Trash2 } from 'lucide-react';
import { DataTableToolbar } from './data-table-toolbar';
import type { ILocation } from '@/infra/api/interfaces/ILocation';
import { getImageUrl } from '@/helper/image_url';
import { useManageLocationsStore } from '../stores/location_store';

// ── Colour map ────────────────────────────────────────────────────────────────
const MUC_DO_CFG: Record<string, string> = {
  'cao':        'bg-red-100 text-red-700 border-red-200',
  'trung bình': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'thấp':       'bg-emerald-100 text-emerald-700 border-emerald-200',
};

// ── Mobile card ───────────────────────────────────────────────────────────────
function LocationMobileCard({ loc }: { loc: ILocation }) {
  const { openDialog } = useManageLocationsStore();
  const mucDo  = loc.cham_diem?.nguy_co ?? '';
  const imgUrl = loc.images[0]?.url;
  const sub    = [loc.ten_huyen, loc.ten_tinh].filter(Boolean).join(', ');

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
      {/* Thumbnail */}
      <div className="shrink-0 w-14 h-14 rounded-xl overflow-hidden border border-border bg-muted flex items-center justify-center">
        {imgUrl
          ? <img src={getImageUrl(imgUrl)} alt="" className="w-full h-full object-cover" />
          : <ImageOff className="w-5 h-5 text-muted-foreground/30" />}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-sm font-semibold truncate leading-tight">{loc.ten_xa}</p>
        {sub && (
          <p className="text-xs text-muted-foreground truncate">{sub}</p>
        )}
        {mucDo && (
          <Badge
            className={`mt-1 text-[10px] px-1.5 py-0 h-4 border-0 capitalize ${
              MUC_DO_CFG[mucDo.toLowerCase()] ?? 'bg-gray-100 text-gray-600'
            }`}
          >
            {mucDo}
          </Badge>
        )}
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
          <DropdownMenuItem onClick={() => openDialog('detail', loc)}>
            <Eye className="mr-2 h-4 w-4" />Xem chi tiết
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => openDialog('edit', loc)}>
            <Pencil className="mr-2 h-4 w-4" />Chỉnh sửa
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => openDialog('delete', loc)}
            className="text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            <Trash2 className="mr-2 h-4 w-4" />Xóa địa điểm
          </DropdownMenuItem>
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
  onSelectionChange?:  (ids: string[]) => void;
  id:                    string;
  onIdChange:            (v: string) => void;
  tenXa:                 string;
  onTenXaChange:         (v: string) => void;
  createdById:           string;
  onCreatedByIdChange:   (v: string) => void;
  creatorOptions:        { _id: string; name: string }[];
  xepLoai:               string;
  onXepLoaiChange:       (v: string) => void;
  from:                string;
  onFromChange:        (v: string) => void;
  to:                  string;
  onToChange:          (v: string) => void;
  onDeleteSelected:    (ids: string[]) => void;
  onBackupClick:       () => void;
  onImportClick:       () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function DataTable<TData, TValue>({
  columns, data, loading, onSelectionChange, onDeleteSelected,
  id, onIdChange,
  tenXa, onTenXaChange,
  createdById, onCreatedByIdChange, creatorOptions,
  xepLoai, onXepLoaiChange,
  from, onFromChange, to, onToChange,
  onBackupClick, onImportClick,
}: Props<TData, TValue>) {

  const MOBILE_HIDDEN = ['toa_do', 'created_by', 'createdAt'];
  const getVisibility = (mobile: boolean) =>
    mobile ? Object.fromEntries(MOBILE_HIDDEN.map((id) => [id, false])) : {};

  const [isMobile,         setIsMobile]         = React.useState(() => window.innerWidth < 768);
  const [sorting,          setSorting]          = React.useState<SortingState>([]);
  const [rowSelection,     setRowSelection]     = React.useState<Record<string, boolean>>({});
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
    getRowId: (row) => (row as unknown as { _id: string })._id,
    state: { sorting, rowSelection, columnVisibility },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    enableRowSelection: true,
  });

  const selectedIds = Object.keys(rowSelection).filter((k) => rowSelection[k]);

  React.useEffect(() => {
    setRowSelection({});
  }, [data]);

  React.useEffect(() => {
    onSelectionChange?.(selectedIds);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowSelection]);

  const rows = table.getRowModel().rows;

  return (
    <div className="space-y-3">
      <DataTableToolbar<TData>
        table={table}
        id={id}                           onIdChange={onIdChange}
        tenXa={tenXa}                     onTenXaChange={onTenXaChange}
        createdById={createdById}         onCreatedByIdChange={onCreatedByIdChange}
        creatorOptions={creatorOptions}
        xepLoai={xepLoai}                 onXepLoaiChange={onXepLoaiChange}
        from={from}                       onFromChange={onFromChange}
        to={to}                           onToChange={onToChange}
        selectedIds={selectedIds}         onDeleteSelected={() => onDeleteSelected(selectedIds)}
        onBackupClick={onBackupClick}
        onImportClick={onImportClick}
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
              <LocationMobileCard
                key={row.id}
                loc={row.original as unknown as ILocation}
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
