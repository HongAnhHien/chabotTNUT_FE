import { useEffect, useMemo, useState, type FC } from "react";
import { Link } from "react-router";
import { ArrowLeft, Camera, Loader2, CheckCircle2, Clock, XCircle, FileText, Users, RefreshCcw, PlayCircle, Lock, ScanFace } from "lucide-react";
import axiosInstance from "@/infra/api/conflig/axiosInstance";

// ── Kiểu dữ liệu (khớp API /diem-danh & /teacher) ──
interface HocKy { hoc_ky: number; ten_hoc_ky?: string | null; is_current?: boolean; }
interface ClassItem { id_to_hoc: string; ten_lop?: string | null; lop?: string | null; phong?: string | null; sl_dk?: number | null; }
interface CourseItem { subject: { ma_mon?: string; ten_mon?: string } | null; classes: ClassItem[]; }
interface Buoi {
  id: string; id_to_hoc: string; ma_mon?: string | null; ten_lop?: string | null; lop?: string | null;
  phong?: string | null; ngay: string; tiet?: string | null; trang_thai: "dang_mo" | "da_dong"; nguon?: string;
  tong_sv: number; so_co_mat: number; so_muon: number; so_vang: number; so_phep: number; ty_le_co_mat: number;
}
interface BanGhi {
  ma_sinh_vien: string; ho_ten?: string | null; ma_lop?: string | null;
  trang_thai: "co_mat" | "muon" | "vang" | "phep"; thoi_diem?: string | null; do_tin_cay?: number | null;
  sua_tay?: boolean; nguon?: string; ghi_chu?: string | null;
}
interface BuoiListItem { id: string; ma_mon?: string | null; ten_lop?: string | null; lop?: string | null; phong?: string | null; ngay: string; tiet?: string | null; trang_thai: string; tong_sv: number; so_co_mat: number; so_vang: number; }

type TrangThai = BanGhi["trang_thai"];
const STATUS: Record<TrangThai, { label: string; cls: string; icon: FC<{ className?: string }> }> = {
  co_mat: { label: "Có mặt", cls: "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300", icon: CheckCircle2 },
  muon:   { label: "Muộn",   cls: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300", icon: Clock },
  vang:   { label: "Vắng",   cls: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300", icon: XCircle },
  phep:   { label: "Có phép", cls: "bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-300", icon: FileText },
};
const CYCLE: TrangThai[] = ["co_mat", "muon", "vang", "phep"];

const Stat: FC<{ label: string; value: number | string; tone?: string }> = ({ label, value, tone }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <div className={`text-2xl font-bold tabular-nums ${tone ?? ""}`}>{value}</div>
    <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
  </div>
);

const DiemDanhManage: FC = () => {
  const [semesters, setSemesters] = useState<HocKy[]>([]);
  const [hocKy, setHocKy] = useState<number | null>(null);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [recent, setRecent] = useState<BuoiListItem[]>([]);

  const [buoi, setBuoi] = useState<Buoi | null>(null);
  const [banGhi, setBanGhi] = useState<BanGhi[]>([]);
  const [busy, setBusy] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Nạp học kỳ + danh sách buổi gần đây
  useEffect(() => {
    Promise.all([
      axiosInstance.get("/teacher/semesters"),
      axiosInstance.get("/diem-danh/buoi"),
    ])
      .then(([s, b]) => {
        const ds: HocKy[] = s.data?.data?.ds_hoc_ky ?? [];
        setSemesters(ds);
        const cur = s.data?.data?.hoc_ky_hien_tai ?? ds.find((h) => h.is_current)?.hoc_ky ?? ds[0]?.hoc_ky ?? null;
        setHocKy(cur);
        setRecent(b.data?.data ?? []);
      })
      .catch(() => setError("Không tải được dữ liệu (cần quyền Giảng viên/Khoa/Trường và tài khoản Portal hợp lệ)."))
      .finally(() => setLoading(false));
  }, []);

  // Nạp môn/lớp khi đổi học kỳ
  useEffect(() => {
    if (hocKy == null) return;
    setLoadingCourses(true);
    axiosInstance.get(`/teacher/semesters/${hocKy}`)
      .then((r) => setCourses(r.data?.data ?? []))
      .catch(() => setCourses([]))
      .finally(() => setLoadingCourses(false));
  }, [hocKy]);

  const refreshRecent = () => axiosInstance.get("/diem-danh/buoi").then((b) => setRecent(b.data?.data ?? [])).catch(() => {});

  const openBoard = (data: { buoi: Buoi; ban_ghi: BanGhi[] }) => {
    setBuoi(data.buoi); setBanGhi(data.ban_ghi ?? []);
  };

  const moBuoi = (c: ClassItem) => {
    setBusy(true); setError(null);
    axiosInstance.post("/diem-danh/buoi", { id_to_hoc: c.id_to_hoc, phong: c.phong })
      .then((r) => { openBoard(r.data?.data); refreshRecent(); })
      .catch((e) => setError(e?.response?.data?.message ?? "Không mở được buổi điểm danh."))
      .finally(() => setBusy(false));
  };

  const xemBuoi = (id: string) => {
    setBusy(true);
    axiosInstance.get(`/diem-danh/buoi/${id}`)
      .then((r) => openBoard(r.data?.data))
      .catch((e) => setError(e?.response?.data?.message ?? "Không tải được buổi."))
      .finally(() => setBusy(false));
  };

  const doiTrangThai = (bg: BanGhi) => {
    if (!buoi) return;
    const next = CYCLE[(CYCLE.indexOf(bg.trang_thai) + 1) % CYCLE.length];
    axiosInstance.patch(`/diem-danh/buoi/${buoi.id}/ban-ghi/${bg.ma_sinh_vien}`, { trang_thai: next })
      .then((r) => { openBoard(r.data?.data); refreshRecent(); })
      .catch((e) => setError(e?.response?.data?.message ?? "Không cập nhật được."));
  };

  const dongBuoi = () => {
    if (!buoi) return;
    setBusy(true);
    axiosInstance.patch(`/diem-danh/buoi/${buoi.id}/dong`)
      .then((r) => { openBoard(r.data?.data); refreshRecent(); })
      .catch((e) => setError(e?.response?.data?.message ?? "Không đóng được buổi."))
      .finally(() => setBusy(false));
  };

  const sorted = useMemo(
    () => [...banGhi].sort((a, b) => (a.ma_sinh_vien ?? "").localeCompare(b.ma_sinh_vien ?? "")),
    [banGhi],
  );

  if (loading) {
    return <div className="grid min-h-[60vh] place-items-center"><Loader2 className="h-7 w-7 animate-spin text-teal-600" /></div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-5 flex items-center gap-3">
        <Link to="/atlas" className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"><ArrowLeft className="h-4 w-4" /></Link>
        <div className="flex-1">
          <h1 className="flex items-center gap-2 text-lg font-bold"><Camera className="h-5 w-5 text-teal-600" /> Điểm danh thông minh</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Điểm danh theo lớp học phần &amp; thời khoá biểu. Camera AI tự cập nhật; giảng viên chỉnh tay khi cần.</p>
        </div>
        <Link to="/diem-danh/enroll" className="inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-100 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-300"><ScanFace className="h-4 w-4" /> Đăng ký khuôn mặt</Link>
      </div>

      {error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">{error}</div>}

      {buoi ? (
        // ── Bảng điểm danh của một buổi ──
        <div className="space-y-4">
          <button onClick={() => setBuoi(null)} className="text-sm text-teal-600 hover:underline">← Chọn lớp khác / danh sách buổi</button>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-semibold">{buoi.ma_mon} · {buoi.ten_lop ?? buoi.lop}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Phòng {buoi.phong ?? "—"} · {buoi.ngay}{buoi.tiet ? ` · tiết ${buoi.tiet}` : ""} · {buoi.trang_thai === "dang_mo" ? "đang mở" : "đã đóng"}</div>
              </div>
              {buoi.trang_thai === "dang_mo" ? (
                <button onClick={dongBuoi} disabled={busy} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-700"><Lock className="h-4 w-4" /> Đóng buổi</button>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-500 dark:bg-slate-800"><Lock className="h-4 w-4" /> Đã đóng</span>
              )}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Tổng SV" value={buoi.tong_sv} />
              <Stat label="Có mặt" value={buoi.so_co_mat + buoi.so_muon} tone="text-teal-600" />
              <Stat label="Vắng" value={buoi.so_vang} tone="text-rose-600" />
              <Stat label="Tỉ lệ có mặt" value={`${buoi.ty_le_co_mat}%`} tone="text-teal-600" />
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="max-h-[55vh] divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
              {sorted.map((bg) => {
                const st = STATUS[bg.trang_thai]; const Icon = st.icon;
                return (
                  <div key={bg.ma_sinh_vien} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{bg.ho_ten ?? bg.ma_sinh_vien}</div>
                      <div className="text-xs text-slate-400">{bg.ma_sinh_vien}{bg.ma_lop ? ` · ${bg.ma_lop}` : ""}{bg.thoi_diem ? ` · ${new Date(bg.thoi_diem).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}` : ""}{bg.sua_tay ? " · sửa tay" : bg.nguon === "camera_ai" ? " · camera" : ""}</div>
                    </div>
                    <button
                      onClick={() => buoi.trang_thai === "dang_mo" && doiTrangThai(bg)}
                      disabled={buoi.trang_thai !== "dang_mo"}
                      title={buoi.trang_thai === "dang_mo" ? "Bấm để đổi trạng thái" : "Buổi đã đóng"}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${st.cls} ${buoi.trang_thai === "dang_mo" ? "hover:ring-2 hover:ring-teal-300" : "cursor-default opacity-90"}`}
                    >
                      <Icon className="h-3.5 w-3.5" /> {st.label}
                    </button>
                  </div>
                );
              })}
              {sorted.length === 0 && <div className="px-4 py-8 text-center text-sm text-slate-400">Chưa có sinh viên trong buổi.</div>}
            </div>
          </div>
        </div>
      ) : (
        // ── Chọn lớp mở buổi + buổi gần đây ──
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Học kỳ</span>
              <select value={hocKy ?? ""} onChange={(e) => setHocKy(Number(e.target.value))} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900">
                {semesters.map((h) => <option key={h.hoc_ky} value={h.hoc_ky}>{h.ten_hoc_ky ?? h.hoc_ky}{h.is_current ? " (hiện tại)" : ""}</option>)}
              </select>
              {loadingCourses && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
            </div>

            {courses.map((c) => (
              <div key={c.subject?.ma_mon} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-2 text-sm font-semibold">{c.subject?.ma_mon} · {c.subject?.ten_mon}</div>
                <div className="flex flex-wrap gap-2">
                  {c.classes.map((cl) => (
                    <button key={cl.id_to_hoc} onClick={() => moBuoi(cl)} disabled={busy}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700 hover:bg-teal-100 disabled:opacity-50 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-300">
                      <PlayCircle className="h-3.5 w-3.5" /> {cl.ten_lop ?? cl.lop} {cl.phong ? `· ${cl.phong}` : ""} {cl.sl_dk ? `· ${cl.sl_dk} SV` : ""}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {!loadingCourses && courses.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400 dark:border-slate-700">
                <Users className="mx-auto mb-2 h-6 w-6" /> Không có lớp trong học kỳ này.
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Buổi gần đây</span>
              <button onClick={refreshRecent} className="text-slate-400 hover:text-teal-600"><RefreshCcw className="h-4 w-4" /></button>
            </div>
            {recent.length === 0 && <p className="text-xs text-slate-400">Chưa có buổi nào.</p>}
            {recent.map((b) => (
              <button key={b.id} onClick={() => xemBuoi(b.id)} className="block w-full rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm hover:border-teal-300 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span className="truncate">{b.ma_mon} · {b.ten_lop ?? b.lop}</span>
                  <span className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[10px] ${b.trang_thai === "dang_mo" ? "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300" : "bg-slate-100 text-slate-500 dark:bg-slate-800"}`}>{b.trang_thai === "dang_mo" ? "đang mở" : "đã đóng"}</span>
                </div>
                <div className="text-xs text-slate-400">{b.ngay}{b.tiet ? ` · tiết ${b.tiet}` : ""} · {b.so_co_mat}/{b.tong_sv} có mặt · vắng {b.so_vang}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DiemDanhManage;
