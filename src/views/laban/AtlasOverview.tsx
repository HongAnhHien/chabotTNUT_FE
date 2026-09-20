import { useEffect, useState, type FC } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, Compass, Loader2, Building2, GitBranch, Star, Layers, ChevronRight } from "lucide-react";
import axiosInstance from "@/infra/api/conflig/axiosInstance";
import { useAuthStore } from "@/views/pages/stores/auth_store";

interface Program { id: string; ma_nganh: string; ten_nganh: string; ma_xet_tuyen?: string | null; ten_khoa: string; tong_tc?: number | null; so_hoc_phan: number; }
interface KhoaGroup { ten_khoa: string; so_ct: number; chuong_trinh: Program[]; }
interface Bridge { ma_mon: string; ten_mon: string; so_nganh_chung: number; }
interface Gateway { ma_mon: string; ten_mon: string; so_ct: number; }
interface Atlas { so_chuong_trinh: number; so_khoa: number; khoi_ten: string[]; khoa: KhoaGroup[]; bridges: Bridge[]; gateways: Gateway[]; }

const AtlasOverview: FC = () => {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const [atlas, setAtlas] = useState<Atlas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axiosInstance.get("/laban/atlas")
      .then((r) => setAtlas(r.data?.data ?? null))
      .catch(() => setError("Không tải được Atlas CTĐT."))
      .finally(() => setLoading(false));
  }, []);

  const openProgram = (id: string) => navigate(`/laban?nganh=${id}`);

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
              <span className="font-bold tracking-tight">Atlas CTĐT TNUT — Bản đồ toàn trường</span>
            </div>
          </div>
          <button onClick={() => logout()} className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">Đăng xuất</button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {loading && <div className="flex items-center gap-2 text-slate-500"><Loader2 className="h-5 w-5 animate-spin" /> Đang tải Atlas…</div>}
        {error && !loading && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">{error}</div>}

        {atlas && (
          <>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Bản đồ chương trình đào tạo toàn trường</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {atlas.so_chuong_trinh} chương trình · {atlas.so_khoa} khoa · chọn một chương trình để xem bản đồ học phần, định vị & cố vấn nghề.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 text-xs">
                {atlas.khoi_ten.map((k, i) => (
                  <span key={i} className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{i + 1}. {k}</span>
                ))}
              </div>
            </div>

            {/* Chương trình gom theo Khoa */}
            <div className="mt-6 space-y-6">
              {atlas.khoa.map((kh) => (
                <section key={kh.ten_khoa}>
                  <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <Building2 className="h-4 w-4" /> {kh.ten_khoa}
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-normal text-slate-500 dark:bg-slate-800">{kh.so_ct} chương trình</span>
                  </h2>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {kh.chuong_trinh.map((p) => (
                      <button key={p.id} onClick={() => openProgram(p.id)}
                        className="group flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-teal-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                        <div className="min-w-0">
                          <div className="truncate font-semibold leading-snug">{p.ten_nganh}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                            {p.ma_xet_tuyen && <span className="font-mono">{p.ma_xet_tuyen}</span>}
                            <span>{p.so_hoc_phan} học phần</span>
                            {p.tong_tc ? <span>{p.tong_tc} TC bắt buộc</span> : null}
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:text-teal-500" />
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            {/* Học phần Bridge & Gateway toàn trường */}
            <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h3 className="flex items-center gap-2 font-semibold"><GitBranch className="h-4 w-4 text-violet-500" /> Học phần cầu nối</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Học phần kỹ thuật dùng chung nhiều ngành — nền để dịch chuyển liên ngành.</p>
                <ul className="mt-3 flex flex-col gap-1.5">
                  {atlas.bridges.map((b) => (
                    <li key={b.ma_mon} className="flex items-center gap-2 text-sm">
                      <span className="font-mono text-xs text-slate-500">{b.ma_mon}</span>
                      <span className="flex-1 truncate">{b.ten_mon}</span>
                      <span className="shrink-0 rounded bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">{b.so_nganh_chung} ngành</span>
                    </li>
                  ))}
                  {atlas.bridges.length === 0 && <li className="text-xs text-slate-400">—</li>}
                </ul>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h3 className="flex items-center gap-2 font-semibold"><Star className="h-4 w-4 text-amber-500" /> Học phần mở khoá</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Học phần mở khoá nhiều môn sau — nên ưu tiên học đúng hạn.</p>
                <ul className="mt-3 flex flex-col gap-1.5">
                  {atlas.gateways.map((g) => (
                    <li key={g.ma_mon} className="flex items-center gap-2 text-sm">
                      <span className="font-mono text-xs text-slate-500">{g.ma_mon}</span>
                      <span className="flex-1 truncate">{g.ten_mon}</span>
                      <span className="shrink-0 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">{g.so_ct} CT</span>
                    </li>
                  ))}
                  {atlas.gateways.length === 0 && <li className="text-xs text-slate-400">—</li>}
                </ul>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              <Layers className="h-4 w-4" /> Học phần &amp; tiên quyết lấy từ CTĐT K62 (nguồn A). Khối &amp; tầng học là suy luận (nguồn B). PLO/nghề bổ sung theo từng ngành.
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AtlasOverview;
