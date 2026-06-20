import * as React from "react";
import type { Table } from "@tanstack/react-table";
import {
  Check,
  ChevronDown,
  Download,
  Search,
  SlidersHorizontal,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const NGUY_CO_OPTIONS = [
  { value: "cao",              label: "Nguy cơ cao",        dot: "#dc2626" },
  { value: "trung bình",      label: "Nguy cơ trung bình", dot: "#ea580c" },
  { value: "thấp",            label: "Nguy cơ thấp",       dot: "#16a34a" },
  { value: "null", label: "Chưa phân loại",     dot: "#6b7280" },
];

interface Props<TData> {
  table: Table<TData>;
  id: string;
  onIdChange: (v: string) => void;
  tenXa: string;
  onTenXaChange: (v: string) => void;
  createdById: string;
  onCreatedByIdChange: (v: string) => void;
  creatorOptions: { _id: string; name: string }[];
  xepLoai: string;
  onXepLoaiChange: (v: string) => void;
  from: string;
  onFromChange: (v: string) => void;
  to: string;
  onToChange: (v: string) => void;
  selectedIds: string[];
  onDeleteSelected: () => void;
  onBackupClick: () => void;
  onImportClick: () => void;
}

export function DataTableToolbar<TData>({
  table,
  id,
  onIdChange,
  tenXa,
  onTenXaChange,
  createdById,
  onCreatedByIdChange,
  creatorOptions,
  xepLoai,
  onXepLoaiChange,
  from,
  onFromChange,
  to,
  onToChange,
  selectedIds,
  onDeleteSelected,
  onBackupClick,
  onImportClick,
}: Props<TData>) {
  const [creatorOpen,   setCreatorOpen]   = React.useState(false);
  const [creatorSearch, setCreatorSearch] = React.useState("");

  const filteredCreators = creatorOptions.filter((o) =>
    o.name.toLowerCase().includes(creatorSearch.toLowerCase()),
  );

  const selectedCreatorName = creatorOptions.find((o) => o._id === createdById)?.name ?? "";

  const hidable = table.getAllColumns().filter((c) => c.getCanHide());
  const hasFilter =
    id !== "" || tenXa !== "" || createdById !== "" || xepLoai !== "all" || from !== "" || to !== "";
  const clearAll = () => {
    onIdChange("");
    onTenXaChange("");
    onCreatedByIdChange("");
    onXepLoaiChange("all");
    onFromChange("");
    onToChange("");
    setCreatorSearch("");
  };

  return (
    <div className="flex flex-col gap-2 mb-3">
      {/* ── Row 1: filters ── */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* ID search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" />
            <Input
              placeholder="Tìm theo ID..."
              value={id}
              onChange={(e) => onIdChange(e.target.value)}
              className="pl-8 pr-8 w-52 bg-white font-mono placeholder:font-sans placeholder:text-black dark:placeholder:text-white placeholder:italic"
            />
            {id && (
              <button
                type="button"
                onClick={() => onIdChange("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Tên xã search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4  pointer-events-none" />
            <Input
              placeholder="Tìm tên xã..."
              value={tenXa}
              onChange={(e) => onTenXaChange(e.target.value)}
              className="pl-8 pr-8 w-64 bg-white placeholder:text-black dark:placeholder:text-white placeholder:italic"
            />
            {tenXa && (
              <button
                type="button"
                onClick={() => onTenXaChange("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5 " />
              </button>
            )}
          </div>

          {/* Người tạo */}
          <Popover open={creatorOpen} onOpenChange={setCreatorOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`h-9 gap-1.5 bg-white ${createdById ? "border-primary/50 text-primary" : ""}`}
              >
                <User className="h-4 w-4 shrink-0" />
                <span className="max-w-28 truncate">
                  {selectedCreatorName || "Người tạo"}
                </span>
                {createdById ? (
                  <X
                    className="h-3.5 w-3.5 shrink-0"
                    onClick={(e) => { e.stopPropagation(); onCreatedByIdChange(""); setCreatorSearch(""); }}
                  />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="start">
              {/* Search inside popover */}
              <div className="relative mb-2">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <input
                  placeholder="Tìm tên..."
                  value={creatorSearch}
                  onChange={(e) => setCreatorSearch(e.target.value)}
                  className="w-full pl-7 pr-2 h-8 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring/50"
                />
              </div>
              {/* Creator list */}
              <div className="max-h-52 overflow-y-auto space-y-0.5">
                {filteredCreators.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3">
                    Không tìm thấy
                  </p>
                ) : (
                  filteredCreators.map((o) => {
                    const active = createdById === o._id;
                    return (
                      <button
                        key={o._id}
                        type="button"
                        onClick={() => {
                          onCreatedByIdChange(active ? "" : o._id);
                          setCreatorOpen(false);
                          setCreatorSearch("");
                        }}
                        className={`w-full text-left px-2 py-1.5 text-sm rounded-md flex items-center gap-2 transition-colors
                          ${active ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"}`}
                      >
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                          {active && <Check className="h-3.5 w-3.5" />}
                        </span>
                        <span className="truncate">{o.name}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Nguy cơ */}
          <Select value={xepLoai} onValueChange={onXepLoaiChange}>
            <SelectTrigger className="w-44 gap-1.5 bg-white">
              <SelectValue placeholder="Lọc nguy cơ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="bg-white">Tất cả nguy cơ</SelectItem>
              {NGUY_CO_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} className="bg-white">
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: o.dot }}
                    />
                    {o.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date range */}
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={from}
              onChange={(e) => onFromChange(e.target.value)}
              className="h-9 w-36 rounded-md border border-input bg-white dark:bg-[color-mix(in_oklab,var(--input)_30%,transparent)] text-foreground px-2.5 text-sm
                         scheme-light dark:scheme-dark
                         focus:outline-none focus:ring-2 focus:ring-ring/30
                         hover:border-ring/50 transition-colors"
            />
            <span className="text-xs text-muted-foreground">–</span>
            <input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => onToChange(e.target.value)}
              className="h-9 w-36 rounded-md border border-input bg-white dark:bg-[color-mix(in_oklab,var(--input)_30%,transparent)] text-foreground px-2.5 text-sm
                         scheme-light dark:scheme-dark
                         focus:outline-none focus:ring-2 focus:ring-ring/30
                         hover:border-ring/50 transition-colors"
            />
          </div>

          {/* Clear */}
          {hasFilter && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="gap-1.5 text-muted-foreground hover:text-foreground h-9"
            >
              <X className="h-3.5 w-3.5" />
              Xóa lọc
            </Button>
          )}
        </div>

        {/* left */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {/* Delete selected */}
            {selectedIds.length > 0 && (
              <Button
                type="button"
                variant="destructive"
                size="lg"
                onClick={onDeleteSelected}
                className="gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Xóa {selectedIds.length} mục
              </Button>
            )}

            {/* Import */}
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={onImportClick}
              className="gap-1.5 bg-white "
            >
              <Upload className="h-3.5 w-3.5" />
              Import
            </Button>

            {/* Backup */}
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={onBackupClick}
              className="gap-1.5 bg-white "
            >
              <Download className="h-3.5 w-3.5" />
              Backup
            </Button>
          </div>

          {/* Column visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="lg" className="gap-2 shrink-0 bg-white " >
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
                  {typeof col.columnDef.header === "string"
                    ? col.columnDef.header
                    : col.id}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
