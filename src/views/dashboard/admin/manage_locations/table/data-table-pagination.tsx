import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';

interface Props {
  total:            number;
  selectedCount:    number;
  currentPage:      number;
  totalPages:       number;
  pageSize:         number;
  onPageChange:     (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export function DataTablePagination({
  total, selectedCount, currentPage, totalPages, pageSize, onPageChange, onPageSizeChange,
}: Props) {
  const empty   = totalPages === 0;
  const canPrev = currentPage > 1 && !empty;
  const canNext = currentPage < totalPages && !empty;

  const navButtons = (
    <div className="flex items-center gap-1">
      <Button variant="outline" size="icon" className="h-8 w-8"
        onClick={() => onPageChange(1)} disabled={!canPrev}>
        <ChevronsLeft className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" className="h-8 w-8"
        onClick={() => onPageChange(currentPage - 1)} disabled={!canPrev}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" className="h-8 w-8"
        onClick={() => onPageChange(currentPage + 1)} disabled={!canNext}>
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" className="h-8 w-8"
        onClick={() => onPageChange(totalPages)} disabled={!canNext}>
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </div>
  );

  const pageSizeSelect = (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="whitespace-nowrap">Số hàng</span>
      <Select
        value={String(pageSize)}
        onValueChange={(v) => { onPageSizeChange(Number(v)); onPageChange(1); }}
      >
        <SelectTrigger className="h-8 w-16"><SelectValue /></SelectTrigger>
        <SelectContent side="top">
          {PAGE_SIZE_OPTIONS.map((s) => (
            <SelectItem key={s} value={String(s)}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="text-sm text-muted-foreground mt-1">
      {/* Mobile: 2 rows */}
      <div className="flex flex-col gap-2 sm:hidden px-1 py-2">
        <div className="flex items-center justify-between">
          <span className="text-xs">
            {selectedCount > 0 && (
              <><span className="font-medium text-foreground">{selectedCount}</span> đã chọn · </>
            )}
            {total} địa điểm
          </span>
          <span className="text-xs">
            Trang{' '}
            <span className="font-medium text-foreground">{empty ? 0 : currentPage}</span>
            {' '}/ {empty ? 0 : totalPages}
          </span>
        </div>
        <div className="flex items-center justify-between">
          {pageSizeSelect}
          {navButtons}
        </div>
      </div>

      {/* Desktop: 1 row */}
      <div className="hidden sm:flex items-center justify-between px-2 py-3">
        <span>{selectedCount} / {total} địa điểm được chọn.</span>
        <div className="flex items-center gap-6">
          {pageSizeSelect}
          <span className="whitespace-nowrap">
            Trang {empty ? 0 : currentPage} / {empty ? 0 : totalPages}
          </span>
          {navButtons}
        </div>
      </div>
    </div>
  );
}
