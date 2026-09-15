import { useEffect, useState, type FC, type FormEvent } from "react";
import { Link } from "react-router";
import { ArrowLeft, Building2, Loader2, DoorOpen, Users, Search, X, LayoutGrid } from "lucide-react";
import axiosInstance from "@/infra/api/conflig/axiosInstance";
import { useAuthStore } from "@/views/pages/stores/auth_store";

interface ThongKe { tong_toa: number; tong_phong: number; tong_sinh_vien: number; tong_luu_tru: number; }
interface ToaNha { ma_toa: string; ten?: string | null; ghi_chu?: string | null; so_phong: number; so_sv: number; }
interface Phong { ma_phong: string; so_phong?: string | null; suc_chua?: number | null; so_sv: number; }
interface Occupant { ma_sv: string; ho_ten?: string | null; ngay_sinh?: string | null; phai?: string | null; hoc_ky?: string | null; }
interface SvItem { ma_sv: string; ho_ten?: string | null; ngay_sinh?: string | null; phai?: string | null; ma_phong?: string | null; }

const Stat: FC<{ icon: FC<{ className?: string }>; label: string; value: number | string }> = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-300"><Icon className="h-5 w-5" /></span>
    <div>
      <div className="text-xl font-bold tabular-nums">{value}</div>
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  </div>
);

const NoiTruManage: FC = () => {
  const logout = useAuthStore((s) => s.logout);
  const [tk, setTk] = useState<ThongKe | null>(null);
  const [toaNha, setToaNha] = useState<ToaNha[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selToa, setSelToa] = useState<string | null>(null);
  const [phong, setPhong] = useState<Phong[]>([]);
  const [loadingPhong, setLoadingPhong] = useState(false);

  const [selPhong, setSelPhong] = useState<string | null>(null);
  const [occupants, setOccupants] = useState<Occupant[]>([]);

  const [search, setSearch] = useState("");
  const [svList, setSvList] = useState<SvItem[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    Promise.all([axiosInstance.get("/noitru/thong-ke"), axiosInstance.get("/noitru/toa-nha")])
      .then(([a, b]) => { setTk(a.data?.data ?? null); setToaNha(b.data?.data ?? []); })
      .catch(() => setError("Không tải được dữ liệu nội trú (cần quyền Trường/Admin và đã nạp dữ liệu)."))
      .finally(() => setLoading(false));
  }, []);

  const openToa = (ma: string) => {
    setSelToa(ma); setLoadingPhong(true); setPhong([]);
    axiosInstance.get(`/noitru/toa-nha/${ma}/phong`)
      .then((r) => setPhong(r.data?.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingPhong(false));
  };

  const openPhong = (ma: string) => {
    setSelPhong(ma); setOccupants([]);
    axiosInstance.get(`/noitru/phong/${encodeURIComponent(ma)}`)
      .then((r) => setOccupants(r.data?.data?.sinh_vien ?? []))
      .catch(() => {});
  };

  const doSearch = (e: FormEvent) => {
    e.preventDefault();
    setSearching(true);
    axiosInstance.get(`/noitru/sinh-vien`, { params: { search } })
      .then((r) => setSvList(r.data?.data ?? []))
      .catch(() => {})
      .finally(() => setSearching(false));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-900/85">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/atlas" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"><ArrowLeft className="h-4 w-4" /> Atlas</Link>
            <div className="flex items-center gap-2"><Building2 className="h-5 w-5 text-teal-600 dark:text-teal-400" /><span className="font-bold tracking-tight">Quản lý nội trú</span></div>
          </div>
          <button onClick={() => logout()} className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">Đăng xuất</button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {loading && <div className="flex items-center gap-2 text-slate-500"><Loader2 className="h-5 w-5 animate-spin" /> Đang tải…</div>}
        {error && !loading && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">{error}</div>}

        {!loading && tk && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat icon={Building2} label="Toà nhà" value={tk.tong_toa} />
              <Stat icon={LayoutGrid} label="Phòng" value={tk.tong_phong} />
              <Stat icon={Users} label="Sinh viên" value={tk.tong_sinh_vien} />
              <Stat icon={DoorOpen} label="Lượt lưu trú" value={tk.tong_luu_tru} />
            </div>

            {/* Toà nhà */}
            <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Toà nhà</h2>
            {toaNha.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900">
                Chưa có dữ liệu. Chạy <code className="font-mono">php artisan db:seed --class=NoiTruSeeder</code>.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {toaNha.map((t) => (
                  <button key={t.ma_toa} onClick={() => openToa(t.ma_toa)}
                    className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900 ${selToa === t.ma_toa ? "border-teal-400 ring-1 ring-teal-400/40" : "border-slate-200 dark:border-slate-800"}`}>
                    <div className="font-semibold">{t.ten ?? `Nhà ${t.ma_toa}`}</div>
                    <div className="mt-1 flex gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span>{t.so_phong} phòng</span><span>{t.so_sv} SV</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Phòng của toà */}
            {selToa && (
              <>
                <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Phòng — Nhà {selToa}</h2>
                {loadingPhong ? (
                  <div className="flex items-center gap-2 text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Đang tải phòng…</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {phong.map((p) => (
                      <button key={p.ma_phong} onClick={() => openPhong(p.ma_phong)}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition hover:border-teal-400/60 hover:bg-teal-50/40 dark:border-slate-800 dark:bg-slate-900">
                        <span className="font-mono text-xs">{p.ma_phong}</span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">{p.so_sv} SV</span>
                      </button>
                    ))}
                    {phong.length === 0 && <p className="text-sm text-slate-400">Không có phòng.</p>}
                  </div>
                )}
              </>
            )}

            {/* Tìm sinh viên */}
            <h2 className="mb-3 mt-10 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tìm sinh viên lưu trú</h2>
            <form onSubmit={doSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Mã SV hoặc họ tên…"
                  className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm dark:border-slate-700 dark:bg-slate-800" />
              </div>
              <button type="submit" className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">Tìm</button>
            </form>
            {searching && <div className="mt-3 flex items-center gap-2 text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Đang tìm…</div>}
            {svList.length > 0 && (
              <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                    <tr><th className="px-3 py-2">Mã SV</th><th className="px-3 py-2">Họ tên</th><th className="px-3 py-2">Ngày sinh</th><th className="px-3 py-2">Phái</th><th className="px-3 py-2">Phòng</th></tr>
                  </thead>
                  <tbody>
                    {svList.map((s) => (
                      <tr key={s.ma_sv} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="px-3 py-2 font-mono text-xs">{s.ma_sv}</td>
                        <td className="px-3 py-2">{s.ho_ten}</td>
                        <td className="px-3 py-2 text-slate-500">{s.ngay_sinh}</td>
                        <td className="px-3 py-2 text-slate-500">{s.phai}</td>
                        <td className="px-3 py-2 font-mono text-xs">{s.ma_phong ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>

      {/* Chi tiết phòng */}
      {selPhong && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" onClick={() => setSelPhong(null)}>
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-md rounded-t-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelPhong(null)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"><X className="h-5 w-5" /></button>
            <div className="flex items-center gap-2 font-semibold"><DoorOpen className="h-4 w-4 text-teal-600" /> Phòng {selPhong}</div>
            <div className="mt-1 text-xs text-slate-400">{occupants.length} sinh viên</div>
            <ul className="mt-3 flex flex-col gap-1.5">
              {occupants.map((o) => (
                <li key={o.ma_sv} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-800/50">
                  <span><span className="font-medium">{o.ho_ten}</span> <span className="ml-1 font-mono text-xs text-slate-400">{o.ma_sv}</span></span>
                  <span className="text-xs text-slate-500">{o.phai}{o.ngay_sinh ? ` · ${o.ngay_sinh}` : ""}</span>
                </li>
              ))}
              {occupants.length === 0 && <li className="text-sm text-slate-400">Phòng trống.</li>}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoiTruManage;
