import { useEffect, useMemo, useState, type FC } from "react";
import { Link } from "react-router";
import { ArrowLeft, BookOpen, Loader2, Users, Clock, CheckCircle2, X, GraduationCap } from "lucide-react";
import axiosInstance from "@/infra/api/conflig/axiosInstance";
import { useAuthStore } from "@/views/pages/stores/auth_store";
import toast from "react-hot-toast";

interface Course {
  id: string; ma_khoa: string; tieu_de: string; linh_vuc?: string | null; giang_vien?: string | null;
  cap_do?: string | null; thoi_luong?: string | null; so_buoi?: number | null; suc_chua?: number | null;
  hoc_phi?: string | null; trang_thai: string; khai_giang?: string | null; so_dang_ky: number; da_dang_ky: boolean;
}
interface CourseDetail extends Course { mo_ta?: string | null; noi_dung: string[]; plo_lien_quan: string[]; }
interface MyCourse { khoa_hoc_id: string; ma_khoa?: string | null; tieu_de?: string | null; linh_vuc?: string | null; khai_giang?: string | null; trang_thai: string; }

const ElearningCatalog: FC = () => {
  const logout = useAuthStore((s) => s.logout);
  const [courses, setCourses] = useState<Course[]>([]);
  const [mine, setMine] = useState<MyCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("");
  const [detail, setDetail] = useState<CourseDetail | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => {
    Promise.all([axiosInstance.get("/elearning/khoa-hoc"), axiosInstance.get("/elearning/cua-toi")])
      .then(([a, b]) => { setCourses(a.data?.data ?? []); setMine(b.data?.data ?? []); })
      .catch(() => setError("Không tải được danh mục khoá học."))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const linhVucs = useMemo(() => Array.from(new Set(courses.map((c) => c.linh_vuc).filter(Boolean))) as string[], [courses]);
  const shown = filter ? courses.filter((c) => c.linh_vuc === filter) : courses;

  const enroll = async (c: Course) => {
    setBusy(c.id);
    try {
      await axiosInstance.post(`/elearning/khoa-hoc/${c.id}/dang-ky`);
      toast.success("Đăng ký thành công!");
      load(); setDetail(null);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Đăng ký không thành công.");
    } finally { setBusy(null); }
  };
  const cancel = async (c: Course) => {
    setBusy(c.id);
    try {
      await axiosInstance.delete(`/elearning/khoa-hoc/${c.id}/dang-ky`);
      toast.success("Đã huỷ đăng ký.");
      load(); setDetail(null);
    } catch { toast.error("Huỷ không thành công."); } finally { setBusy(null); }
  };
  const openDetail = (id: string) => {
    axiosInstance.get(`/elearning/khoa-hoc/${id}`).then((r) => setDetail(r.data?.data ?? null)).catch(() => {});
  };

  const full = (c: Course) => c.suc_chua != null && c.so_dang_ky >= c.suc_chua && !c.da_dang_ky;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-900/85">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/atlas" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"><ArrowLeft className="h-4 w-4" /> Atlas</Link>
            <div className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-teal-600 dark:text-teal-400" /><span className="font-bold tracking-tight">RIAT E-learning</span></div>
          </div>
          <button onClick={() => logout()} className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">Đăng xuất</button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-bold tracking-tight">Khoá bồi dưỡng năng lực hướng nghiệp</h1>
        <p className="mt-1.5 max-w-2xl text-slate-600 dark:text-slate-400">Đăng ký học thêm các khoá bồi dưỡng để sẵn sàng cho nghề nghiệp tương lai.</p>

        {loading && <div className="mt-6 flex items-center gap-2 text-slate-500"><Loader2 className="h-5 w-5 animate-spin" /> Đang tải…</div>}
        {error && !loading && <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">{error}</div>}

        {!loading && (
          <>
            {mine.length > 0 && (
              <section className="mt-6">
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Khoá của tôi</h2>
                <div className="flex flex-wrap gap-2">
                  {mine.map((m) => (
                    <button key={m.khoa_hoc_id} onClick={() => openDetail(m.khoa_hoc_id)} className="inline-flex items-center gap-2 rounded-lg border border-teal-300 bg-teal-50 px-3 py-1.5 text-sm text-teal-800 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-200">
                      <CheckCircle2 className="h-3.5 w-3.5" /> {m.tieu_de}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {linhVucs.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                <button onClick={() => setFilter("")} className={`rounded-full px-3 py-1 text-xs font-medium ${filter === "" ? "bg-teal-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700"}`}>Tất cả</button>
                {linhVucs.map((lv) => (
                  <button key={lv} onClick={() => setFilter(lv)} className={`rounded-full px-3 py-1 text-xs font-medium ${filter === lv ? "bg-teal-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700"}`}>{lv}</button>
                ))}
              </div>
            )}

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((c) => (
                <div key={c.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-start justify-between gap-2">
                    {c.linh_vuc && <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">{c.linh_vuc}</span>}
                    {c.cap_do && <span className="text-[11px] text-slate-400">{c.cap_do}</span>}
                  </div>
                  <button onClick={() => openDetail(c.id)} className="mt-2 text-left">
                    <h3 className="font-semibold leading-snug hover:text-teal-700 dark:hover:text-teal-300">{c.tieu_de}</h3>
                  </button>
                  {c.giang_vien && <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{c.giang_vien}</div>}
                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    {c.thoi_luong && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {c.thoi_luong}</span>}
                    <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {c.so_dang_ky}{c.suc_chua ? `/${c.suc_chua}` : ""}</span>
                    {c.hoc_phi && <span className="font-medium text-emerald-600 dark:text-emerald-400">{c.hoc_phi}</span>}
                  </div>
                  <div className="mt-4 flex-1" />
                  {c.da_dang_ky ? (
                    <button disabled={busy === c.id} onClick={() => cancel(c)} className="rounded-lg border border-teal-300 bg-teal-50 px-3 py-2 text-sm font-medium text-teal-700 hover:bg-teal-100 disabled:opacity-50 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-300">
                      ✓ Đã đăng ký · Huỷ
                    </button>
                  ) : (
                    <button disabled={busy === c.id || full(c) || c.trang_thai !== "open"} onClick={() => enroll(c)} className="rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50">
                      {full(c) ? "Đã đủ số lượng" : c.trang_thai !== "open" ? "Chưa mở" : "Đăng ký"}
                    </button>
                  )}
                </div>
              ))}
              {shown.length === 0 && <p className="text-sm text-slate-400">Chưa có khoá học. Chạy <code className="font-mono">php artisan db:seed --class=ElearningSeeder</code>.</p>}
            </div>
          </>
        )}
      </main>

      {/* Chi tiết khoá */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" onClick={() => setDetail(null)}>
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
          <div className="relative z-10 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setDetail(null)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"><X className="h-5 w-5" /></button>
            {detail.linh_vuc && <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">{detail.linh_vuc}</span>}
            <h3 className="mt-2 text-lg font-bold">{detail.tieu_de}</h3>
            {detail.giang_vien && <div className="mt-0.5 text-sm text-slate-500">{detail.giang_vien}</div>}
            {detail.mo_ta && <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{detail.mo_ta}</p>}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              {detail.thoi_luong && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {detail.thoi_luong}</span>}
              <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {detail.so_dang_ky}{detail.suc_chua ? `/${detail.suc_chua}` : ""} học viên</span>
              {detail.khai_giang && <span>Khai giảng: {detail.khai_giang}</span>}
            </div>
            {detail.noi_dung.length > 0 && (
              <div className="mt-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400"><BookOpen className="mr-1 inline h-3.5 w-3.5" /> Nội dung</div>
                <ol className="mt-1.5 flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
                  {detail.noi_dung.map((n, i) => <li key={i} className="flex gap-2"><span className="text-teal-600">{i + 1}.</span> {n}</li>)}
                </ol>
              </div>
            )}
            <div className="mt-5">
              {detail.da_dang_ky ? (
                <button disabled={busy === detail.id} onClick={() => cancel(detail)} className="w-full rounded-lg border border-teal-300 bg-teal-50 px-3 py-2.5 text-sm font-medium text-teal-700 hover:bg-teal-100 disabled:opacity-50 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-300">✓ Đã đăng ký · Huỷ đăng ký</button>
              ) : (
                <button disabled={busy === detail.id || full(detail) || detail.trang_thai !== "open"} onClick={() => enroll(detail)} className="w-full rounded-lg bg-teal-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50">
                  {full(detail) ? "Đã đủ số lượng" : detail.trang_thai !== "open" ? "Chưa mở đăng ký" : "Đăng ký khoá học"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ElearningCatalog;
