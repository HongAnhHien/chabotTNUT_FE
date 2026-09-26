import { useEffect, useRef, useState, type FC } from "react";
import { BookMarked, ChevronDown, Loader2, Upload } from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "@/infra/api/conflig/axiosInstance";

interface ThongKe {
  tong: number;
  co_don_vi?: number;
  khop_bo_mon?: number;
  so_don_vi?: number;
  don_vi_chua_khop?: { don_vi: string; so_mon: number }[];
  nap_luc?: string | null;
}

const fmt = (n?: number) => (n ?? 0).toLocaleString("vi-VN");

/**
 * Danh mục môn học chính thức (EduSoft/PĐT) trong CSDL chung: thống kê + tải file cập nhật.
 * Nạp xong, học phần chưa gán sẽ tự về đúng bộ môn phụ trách (không ghi đè gán tay).
 */
const DanhMucMonHocCard: FC<{ canImport: boolean; onImported: () => void }> = ({ canImport, onImported }) => {
  const [tk, setTk] = useState<ThongKe | null>(null);
  const [uploading, setUploading] = useState(false);
  const [moDs, setMoDs] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = () => {
    axiosInstance.get("/cms/danh-muc").then((r) => setTk(r.data?.data ?? null)).catch(() => setTk(null));
  };
  useEffect(load, []);

  const upload = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    setUploading(true);
    try {
      const res = await axiosInstance.post("/cms/danh-muc/nap", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 300000,
      });
      toast.success(res.data?.message ?? "Đã nạp danh mục môn học.");
      load();
      onImported();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Không nạp được file danh mục.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  if (!tk) return null;
  const chuaKhop = tk.don_vi_chua_khop ?? [];

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <BookMarked className="h-4 w-4 text-teal-600" /> Danh mục môn học chính thức (EduSoft / Phòng Đào tạo)
          </h3>
          {tk.tong > 0 ? (
            <p className="mt-1 text-xs text-slate-500">
              <b className="text-slate-700 dark:text-slate-200">{fmt(tk.tong)}</b> môn · {fmt(tk.so_don_vi)} đơn vị phụ trách ·{" "}
              <b className="text-slate-700 dark:text-slate-200">{fmt(tk.khop_bo_mon)}</b> môn khớp bộ môn trong cơ cấu
              {tk.nap_luc && <> · cập nhật {new Date(tk.nap_luc).toLocaleString("vi-VN")}</>}
            </p>
          ) : (
            <p className="mt-1 text-xs text-slate-500">Chưa nạp danh mục. Tải file Excel danh mục môn học để hệ thống tự gán học phần về bộ môn.</p>
          )}
        </div>
        {canImport && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
            />
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-teal-600 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-50 disabled:opacity-50 dark:text-teal-300 dark:hover:bg-teal-500/10"
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              {uploading ? "Đang nạp…" : tk.tong > 0 ? "Cập nhật danh mục (.xlsx)" : "Tải danh mục (.xlsx)"}
            </button>
          </>
        )}
      </div>

      {tk.tong > 0 && (
        <div className="mt-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-full rounded-full bg-teal-500" style={{ width: `${((tk.khop_bo_mon ?? 0) / tk.tong) * 100}%` }} />
          </div>
          {chuaKhop.length > 0 && (
            <>
              <button onClick={() => setMoDs((v) => !v)} className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                <ChevronDown className={`h-3.5 w-3.5 transition ${moDs ? "rotate-180" : ""}`} />
                {chuaKhop.length} đơn vị chưa có trong cơ cấu bộ môn ({fmt(chuaKhop.reduce((n, d) => n + d.so_mon, 0))} môn)
              </button>
              {moDs && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {chuaKhop.map((d) => (
                    <span key={d.don_vi} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {d.don_vi} <b>{d.so_mon}</b>
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
};

export default DanhMucMonHocCard;
