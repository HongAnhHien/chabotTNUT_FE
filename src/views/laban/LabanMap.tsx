import { useEffect, useMemo, useState, type FC } from "react";
import { Link } from "react-router";
import { ArrowLeft, Compass, Loader2, GitBranch, Star, Target, Route as RouteIcon, X } from "lucide-react";
import axiosInstance from "@/infra/api/conflig/axiosInstance";
import { useAuthStore } from "@/views/pages/stores/auth_store";

interface NganhItem { id: string; ma_nganh: string; ten_nganh: string; khoa_tuyen?: string | null; tong_tc?: number | null; so_hoc_phan: number; co_du_lieu: boolean; }
interface Plo { ma_plo: string; mo_ta: string; nhom?: string | null; }
interface HocPhan { ma_mon: string; ten_mon?: string | null; khoi: number; nhom?: string | null; hoc_ky?: number | null; so_tc?: string | null; vai_tro?: string | null; bat_buoc?: boolean; dung_chung?: boolean; plo_codes: string[]; tien_quyet_ma: string[]; }
interface GiaiDoan { giai_doan: number; ten: string; thoi_diem?: string | null; muc_tieu?: string | null; hoc_phan_ma: string[]; plo_codes: string[]; du_an?: string | null; career_action?: string | null; }
interface Nghe { ten_vi: string; mo_ta?: string | null; nhom_nganh?: string | null; do_hot?: number | null; plo_can: string[]; }
interface Curriculum { nganh: { id: string; ma_nganh: string; ten_nganh: string; khoa_tuyen?: string | null; tong_tc?: number | null; }; khoi: string[]; plo: Plo[]; hoc_phan: HocPhan[]; giai_doan: GiaiDoan[]; nghe: Nghe[]; }

const KHOI_STYLE = [
  { ring: "ring-blue-500/25", bg: "bg-blue-50 dark:bg-blue-500/10", text: "text-blue-700 dark:text-blue-300", dot: "bg-blue-500" },
  { ring: "ring-teal-500/25", bg: "bg-teal-50 dark:bg-teal-500/10", text: "text-teal-700 dark:text-teal-300", dot: "bg-teal-500" },
  { ring: "ring-violet-500/25", bg: "bg-violet-50 dark:bg-violet-500/10", text: "text-violet-700 dark:text-violet-300", dot: "bg-violet-500" },
  { ring: "ring-emerald-500/25", bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500" },
];
const ks = (k: number) => KHOI_STYLE[k] ?? KHOI_STYLE[0];

const LabanMap: FC = () => {
  const logout = useAuthStore((s) => s.logout);
  const [nganhList, setNganhList] = useState<NganhItem[]>([]);
  const [nganhId, setNganhId] = useState<string>("");
  const [cur, setCur] = useState<Curriculum | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingCur, setLoadingCur] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<HocPhan | null>(null);

  useEffect(() => {
    axiosInstance.get("/laban/nganh")
      .then((res) => {
        const list: NganhItem[] = res.data?.data ?? [];
        setNganhList(list);
        const first = list.find((n) => n.co_du_lieu) ?? list[0];
        if (first) setNganhId(first.id);
      })
      .catch(() => setError("Không tải được danh sách ngành."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!nganhId) return;
    setLoadingCur(true);
    setSelected(null);
    axiosInstance.get(`/laban/nganh/${nganhId}/curriculum`)
      .then((res) => setCur(res.data?.data ?? null))
      .catch(() => setError("Không tải được bản đồ CTĐT."))
      .finally(() => setLoadingCur(false));
  }, [nganhId]);

  const ploMap = useMemo(() => {
    const m: Record<string, string> = {};
    cur?.plo.forEach((p) => { m[p.ma_plo] = p.mo_ta; });
    return m;
  }, [cur]);

  const byKhoi = useMemo(() => {
    const g: HocPhan[][] = [[], [], [], []];
    cur?.hoc_phan.forEach((h) => { (g[h.khoi] ?? g[0]).push(h); });
    g.forEach((arr) => arr.sort((a, b) => (a.hoc_ky ?? 0) - (b.hoc_ky ?? 0)));
    return g;
  }, [cur]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-900/85">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/atlas" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <ArrowLeft className="h-4 w-4" /> Atlas
            </Link>
            <div className="flex items-center gap-2">
              <Compass className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              <span className="font-bold tracking-tight">La bàn nghề nghiệp</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {nganhList.length > 0 && (
              <select
                value={nganhId}
                onChange={(e) => setNganhId(e.target.value)}
                className="max-w-[240px] rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
              >
                {nganhList.map((n) => (
                  <option key={n.id} value={n.id}>{n.ten_nganh}{n.co_du_lieu ? "" : " (chưa có dữ liệu)"}</option>
                ))}
              </select>
            )}
            <button onClick={() => logout()} className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">Đăng xuất</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {loading && <div className="flex items-center gap-2 text-slate-500"><Loader2 className="h-5 w-5 animate-spin" /> Đang tải…</div>}
        {error && !loading && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">{error}</div>}

        {!loading && cur && (
          <>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{cur.nganh.ten_nganh}</h1>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                  <span className="font-mono">{cur.nganh.ma_nganh}</span>
                  {cur.nganh.khoa_tuyen && <span>Khoá {cur.nganh.khoa_tuyen}</span>}
                  {cur.nganh.tong_tc && <span>{cur.nganh.tong_tc} tín chỉ</span>}
                  <span>{cur.hoc_phan.length} học phần · {cur.plo.length} PLO</span>
                </p>
              </div>
            </div>

            {loadingCur && <div className="mt-4 flex items-center gap-2 text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Đang tải bản đồ…</div>}

            {cur.hoc_phan.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900">
                Ngành này chưa có dữ liệu La bàn. Chạy <code className="font-mono">php artisan db:seed --class=LabanSeeder</code> với file dữ liệu ngành.
              </div>
            ) : (
              <>
                {/* Bản đồ học phần theo 4 khối */}
                <h2 className="mb-3 mt-8 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <GitBranch className="h-4 w-4" /> Bản đồ chương trình đào tạo
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {cur.khoi.map((label, k) => {
                    const st = ks(k);
                    return (
                      <div key={k} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className={`mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${st.bg} ${st.text}`}>
                          <span className={`h-2.5 w-2.5 rounded-full ${st.dot}`} /> {label}
                          <span className="ml-auto text-xs font-normal opacity-70">{byKhoi[k].length}</span>
                        </div>
                        <div className="flex flex-col gap-2">
                          {byKhoi[k].map((h) => (
                            <button
                              key={h.ma_mon}
                              onClick={() => setSelected(h)}
                              className={`rounded-xl border bg-white p-3 text-left text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ring-1 ${st.ring} border-slate-100 dark:border-slate-800 dark:bg-slate-900`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{h.ma_mon}</span>
                                <span className="text-[10px] text-slate-400">Kỳ {h.hoc_ky ?? "—"}</span>
                              </div>
                              <div className="mt-0.5 font-medium leading-snug">{h.ten_mon}</div>
                              <div className="mt-1.5 flex flex-wrap items-center gap-1">
                                {h.so_tc && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">{h.so_tc} TC</span>}
                                {h.vai_tro && <span className={`rounded px-1.5 py-0.5 text-[10px] ${st.bg} ${st.text}`}>{h.vai_tro}</span>}
                                {h.dung_chung && <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">dùng chung</span>}
                                {h.tien_quyet_ma.length > 0 && <span className="text-[10px] text-slate-400">◂ {h.tien_quyet_ma.join(", ")}</span>}
                              </div>
                            </button>
                          ))}
                          {byKhoi[k].length === 0 && <p className="px-1 py-2 text-xs text-slate-400">—</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Lộ trình 5 giai đoạn */}
                {cur.giai_doan.length > 0 && (
                  <>
                    <h2 className="mb-3 mt-10 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <RouteIcon className="h-4 w-4" /> Lộ trình {cur.giai_doan.length} giai đoạn
                    </h2>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                      {cur.giai_doan.map((g) => (
                        <div key={g.giai_doan} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                          <div className="flex items-center gap-2">
                            <span className="grid h-7 w-7 place-items-center rounded-full bg-teal-600 text-xs font-bold text-white">{g.giai_doan}</span>
                            <span className="font-semibold leading-tight">{g.ten}</span>
                          </div>
                          {g.thoi_diem && <div className="mt-1 text-xs text-slate-400">{g.thoi_diem}</div>}
                          {g.muc_tieu && <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">{g.muc_tieu}</p>}
                          {g.du_an && <div className="mt-2 text-[11px] text-teal-700 dark:text-teal-300">📦 {g.du_an}</div>}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Nghề nghiệp đích */}
                {cur.nghe.length > 0 && (
                  <>
                    <h2 className="mb-3 mt-10 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <Target className="h-4 w-4" /> Nghề nghiệp đích
                    </h2>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {cur.nghe.map((c) => (
                        <div key={c.ten_vi} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold leading-tight">{c.ten_vi}</h3>
                            {c.do_hot != null && (
                              <span className="flex shrink-0 items-center gap-0.5 text-amber-500">
                                {Array.from({ length: Math.min(5, c.do_hot) }).map((_, i) => <Star key={i} className="h-3 w-3 fill-current" />)}
                              </span>
                            )}
                          </div>
                          {c.mo_ta && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{c.mo_ta}</p>}
                          {c.plo_can.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {c.plo_can.map((p) => <span key={p} className="rounded bg-teal-50 px-1.5 py-0.5 text-[10px] font-medium text-teal-700 dark:bg-teal-500/10 dark:text-teal-300" title={ploMap[p]}>{p}</span>)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* Chi tiết học phần */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-lg rounded-t-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelected(null)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"><X className="h-5 w-5" /></button>
            <div className="font-mono text-xs text-slate-500">{selected.ma_mon}</div>
            <h3 className="mt-0.5 text-lg font-bold">{selected.ten_mon}</h3>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {selected.so_tc && <span className="rounded bg-slate-100 px-2 py-0.5 dark:bg-slate-800">{selected.so_tc} tín chỉ</span>}
              <span className="rounded bg-slate-100 px-2 py-0.5 dark:bg-slate-800">Học kỳ {selected.hoc_ky ?? "—"}</span>
              {selected.vai_tro && <span className={`rounded px-2 py-0.5 ${ks(selected.khoi).bg} ${ks(selected.khoi).text}`}>{selected.vai_tro}</span>}
              <span className="rounded bg-slate-100 px-2 py-0.5 dark:bg-slate-800">{selected.bat_buoc ? "Bắt buộc" : "Tự chọn"}</span>
            </div>
            {selected.tien_quyet_ma.length > 0 && (
              <div className="mt-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Học phần tiên quyết</div>
                <div className="mt-1 flex flex-wrap gap-1.5">{selected.tien_quyet_ma.map((m) => <span key={m} className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs dark:bg-slate-800">{m}</span>)}</div>
              </div>
            )}
            {selected.plo_codes.length > 0 && (
              <div className="mt-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Chuẩn đầu ra đóng góp (PLO)</div>
                <ul className="mt-1.5 flex flex-col gap-1.5">
                  {selected.plo_codes.map((p) => (
                    <li key={p} className="flex gap-2 text-sm">
                      <span className="shrink-0 rounded bg-teal-50 px-1.5 py-0.5 text-xs font-semibold text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">{p}</span>
                      <span className="text-slate-600 dark:text-slate-300">{ploMap[p] ?? ""}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LabanMap;
