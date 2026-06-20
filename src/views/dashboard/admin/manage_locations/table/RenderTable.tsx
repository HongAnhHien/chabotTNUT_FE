import { type FC, useEffect, useRef, useState } from 'react';
import { Download, Loader2, TriangleAlert, Upload } from 'lucide-react';
import { columns } from './Column';
import { DataTable } from './DataTable';
import { DataTablePagination } from './data-table-pagination';
import { useManageLocationsStore } from '../stores/location_store';
import { useManageUsersStore } from '../../manage_users/stores/user_store';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const RenderTableManageLocations: FC = () => {
  const {
    locations, pagination, isLoading, isMutating, isExporting, isImporting,
    fetchLocations, deleteManyLocations, backupLocations, importLocations,
  } = useManageLocationsStore();

  const { users, fetchUsers } = useManageUsersStore();

  const [id,             setId]             = useState('');
  const [tenXa,          setTenXa]          = useState('');
  const [createdById,    setCreatedById]    = useState('');
  const [xepLoai,        setXepLoai]        = useState('all');
  const [from,        setFrom]        = useState('');
  const [to,          setTo]          = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize,    setPageSize]    = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Dialog states
  const [pendingIds,     setPendingIds]     = useState<string[]>([]);
  const [showBackup,     setShowBackup]     = useState(false);
  const [showImport,     setShowImport]     = useState(false);
  const [importFile,     setImportFile]     = useState<File | null>(null);
  const [backupFrom,     setBackupFrom]     = useState('');
  const [backupTo,       setBackupTo]       = useState('');
  const [useSelectedIds, setUseSelectedIds] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchUsers({ limit: 1000 }); }, [fetchUsers]);

  const idDebounced            = useDebounce(id,            400);
  const tenXaDebounced         = useDebounce(tenXa,         400);
  const createdByIdDebounced   = useDebounce(createdById,   400);

  const creatorOptions = users
    .map((u) => ({ _id: u._id, name: u.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  useEffect(() => {
    fetchLocations({
      page:             currentPage,
      limit:            pageSize,
      id:               idDebounced            || undefined,
      ten_xa:           tenXaDebounced         || undefined,
      created_by:       createdByIdDebounced   || undefined,
      muc_do_nguy_hiem: xepLoai !== 'all' ? xepLoai : undefined,
      from:             from || undefined,
      to:               to   || undefined,
    });
  }, [fetchLocations, currentPage, pageSize, idDebounced, tenXaDebounced, createdByIdDebounced, xepLoai, from, to]);

  const reset = () => setCurrentPage(1);

  // ── Delete ────────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    const ok = await deleteManyLocations(pendingIds);
    if (ok) setSelectedIds([]);
    setPendingIds([]);
  };

  // ── Backup ────────────────────────────────────────────────────────────────
  const handleBackup = async () => {
    const ids = useSelectedIds && selectedIds.length > 0
      ? selectedIds.join(',')
      : undefined;
    await backupLocations({
      ids,
      from: backupFrom || undefined,
      to:   backupTo   || undefined,
    });
    setShowBackup(false);
  };

  // ── Import ────────────────────────────────────────────────────────────────
  const handleImport = async () => {
    if (!importFile) return;
    const ok = await importLocations(importFile);
    if (ok) {
      setImportFile(null);
      setShowImport(false);
    }
  };

  return (
    <>
      <div className="overflow-x-auto">
        <DataTable
          columns={columns}
          data={locations}
          loading={isLoading}
          onSelectionChange={setSelectedIds}
          onDeleteSelected={setPendingIds}
          id={id}                   onIdChange={(v) => { setId(v); reset(); }}
          tenXa={tenXa}             onTenXaChange={(v) => { setTenXa(v); reset(); }}
          createdById={createdById}
          onCreatedByIdChange={(v) => { setCreatedById(v); reset(); }}
          creatorOptions={creatorOptions}
          xepLoai={xepLoai}         onXepLoaiChange={(v) => { setXepLoai(v); reset(); }}
          from={from}       onFromChange={(v) => { setFrom(v); reset(); }}
          to={to}           onToChange={(v) => { setTo(v); reset(); }}
          onBackupClick={() => setShowBackup(true)}
          onImportClick={() => setShowImport(true)}
        />
        <DataTablePagination
          total={pagination.total}
          selectedCount={selectedIds.length}
          currentPage={currentPage}
          totalPages={pagination.totalPages}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(s) => { setPageSize(s); reset(); }}
        />
      </div>

      {/* ── Delete dialog ── */}
      <Dialog open={pendingIds.length > 0} onOpenChange={(v) => !v && setPendingIds([])}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <TriangleAlert className="h-5 w-5 text-red-600" />
              </div>
              <DialogTitle className="text-base">
                Xóa <span className="text-red-600 font-bold">{pendingIds.length}</span> địa điểm đã chọn?
              </DialogTitle>
            </div>
            <DialogDescription asChild>
              <div className="text-sm leading-relaxed pl-13 space-y-1.5">
                <p className="font-bold text-red-600">Hành động này không thể hoàn tác.</p>
                <p>
                  Toàn bộ dữ liệu, tọa độ và ảnh của{' '}
                  <span className="font-bold text-foreground">{pendingIds.length} địa điểm</span>{' '}
                  sẽ bị xóa vĩnh viễn khỏi hệ thống.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={isMutating} onClick={() => setPendingIds([])}>Hủy</Button>
            <Button variant="destructive" disabled={isMutating} onClick={confirmDelete} className="gap-2">
              {isMutating && <Loader2 className="h-4 w-4 animate-spin" />}
              {isMutating ? 'Đang xóa...' : `Xóa ${pendingIds.length} mục`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Backup dialog ── */}
      <Dialog open={showBackup} onOpenChange={setShowBackup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100">
                <Download className="h-5 w-5 text-green-700" />
              </div>
              <DialogTitle className="text-base">Backup dữ liệu</DialogTitle>
            </div>
            <DialogDescription>
              Tải xuống file backup dạng <span className="font-semibold text-foreground">.zip</span>.
              Có thể lọc theo IDs đã chọn hoặc khoảng ngày tạo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            {/* Use selected IDs */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={useSelectedIds}
                disabled={selectedIds.length === 0}
                onChange={(e) => setUseSelectedIds(e.target.checked)}
                className="h-4 w-4 rounded border-input accent-[#2F6B3F]"
              />
              <span className={`text-sm ${selectedIds.length === 0 ? 'text-muted-foreground' : ''}`}>
                Chỉ backup <span className="font-semibold">{selectedIds.length}</span> mục đã chọn
                {selectedIds.length === 0 && ' (chưa chọn mục nào)'}
              </span>
            </label>

            {/* Date range */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Khoảng ngày tạo</p>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={backupFrom}
                  onChange={(e) => setBackupFrom(e.target.value)}
                  className="flex-1 h-9 rounded-md border border-input bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
                <span className="text-xs text-muted-foreground">–</span>
                <input
                  type="date"
                  value={backupTo}
                  min={backupFrom || undefined}
                  onChange={(e) => setBackupTo(e.target.value)}
                  className="flex-1 h-9 rounded-md border border-input bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
              </div>
              <p className="text-xs text-muted-foreground">Để trống để backup tất cả</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBackup(false)}>Hủy</Button>
            <Button
              disabled={isExporting}
              onClick={handleBackup}
              className="gap-2 text-white"
              style={{ background: 'linear-gradient(135deg,#2F6B3F,#3d7a50)' }}
            >
              {isExporting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isExporting ? 'Đang tải...' : 'Tải xuống'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Import dialog ── */}
      <Dialog open={showImport} onOpenChange={(v) => { setShowImport(v); if (!v) setImportFile(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
                <Upload className="h-5 w-5 text-blue-600" />
              </div>
              <DialogTitle className="text-base">Import dữ liệu</DialogTitle>
            </div>
            <DialogDescription>
              Upload file <span className="font-semibold text-foreground">.zip</span> backup để khôi phục dữ liệu địa điểm.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1">
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip"
              className="hidden"
              onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`w-full rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors ${
                importFile
                  ? 'border-[#2F6B3F]/50 bg-[#2F6B3F]/5'
                  : 'border-border hover:border-[#2F6B3F]/40 hover:bg-muted/30'
              }`}
            >
              {importFile ? (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[#2F6B3F]">{importFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(importFile.size / 1024).toFixed(1)} KB — Bấm để đổi file
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <Upload className="h-6 w-6 mx-auto text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">Bấm để chọn file .zip</p>
                </div>
              )}
            </button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowImport(false); setImportFile(null); }}>Hủy</Button>
            <Button
              disabled={!importFile || isImporting}
              onClick={handleImport}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isImporting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isImporting ? 'Đang import...' : 'Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RenderTableManageLocations;
