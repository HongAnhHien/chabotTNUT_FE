import { useEffect, useMemo, useState, type FC } from "react";
import { Link } from "react-router";
import { ArrowLeft, FileText, CheckCircle2, FolderTree, Loader2, ChevronRight } from "lucide-react";
import axiosInstance from "@/infra/api/conflig/axiosInstance";
import { useAuthStore, selectUser } from "@/views/pages/stores/auth_store";
import { ROLES, ORG_ADMIN_ROLES, type Role } from "@/constants/roles";
import toast from "react-hot-toast";

interface CmsSubject {
  id: string;
  ma_mon: string;
  ten_mon?: string | null;
  so_tc?: string | null;
  files: number;
  ingested: number;
}
interface CmsBoMon {
  id: string;
  ma_bo_mon: string;
  ten_bo_mon: string;
  subjects: CmsSubject[];
}
interface CmsKhoa {
  id: string;
  ma_khoa: string;
  ten_khoa: string;
  bo_mon: CmsBoMon[];
}
interface CmsTree {
  khoa: CmsKhoa[];
  unassigned: CmsSubject[];
  tong_hoc_phan: number;
}

const SubjectRow: FC<{ s: CmsSubject }> = ({ s }) => (
  <Link
    to={`/teacher/subjects/${s.ma_mon}/files`}
    className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm transition hover:border-teal-400/60 hover:bg-teal-50/40 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-teal-500/5"
  >
    <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{s.ma_mon}</span>
    <span className="flex-1 truncate font-medium">{s.ten_mon ?? "—"}</span>
    {s.so_tc && <span className="hidden shrink-0 text-xs text-slate-400 sm:inline">{s.so_tc} TC</span>}
    <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300" title="Số tài liệu">
      <FileText className="h-3 w-3" /> {s.files}
    </span>
    <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" title="Đã nạp vào RAG">
      <CheckCircle2 className="h-3 w-3" /> {s.ingested}
    </span>
    <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" />
  </Link>
);

const CmsMaterials: FC = () => {
  const user = useAuthStore(selectUser);
  const logout = useAuthStore((s) => s.logout);
  const role = (user?.role as Role) ?? ROLES.TEACHER;
  const canAssign = ORG_ADMIN_ROLES.includes(role);

  const [tree, setTree] = useState<CmsTree | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    axiosInstance
      .get("/cms/materials/tree")
      .then((res) => setTree(res.data?.data ?? null))
      .catch(() => setError("Không tải được cây học liệu. Kiểm tra kết nối hoặc quyền truy cập."))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  // Danh sách bộ môn phẳng cho ô chọn gán
  const boMonOptions = useMemo(() => {
    const out: { id: string; label: string }[] = [];
    tree?.khoa.forEach((k) => k.bo_mon.forEach((b) => out.push({ id: b.id, label: `${k.ten_khoa} · ${b.ten_bo_mon}` })));
    return out;
  }, [tree]);

  const assign = async (subjectId: string, boMonId: string) => {
    if (!boMonId) return;
    setAssigning(subjectId);
    try {
      await axiosInstance.patch(`/cms/subjects/${subjectId}/bo-mon`, { bo_mon_id: boMonId });
      toast.success("Đã gán học phần vào bộ môn.");
      load();
    } catch {
      toast.error("Gán không thành công.");
    } finally {
      setAssigning(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-900/85">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/atlas" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <ArrowLeft className="h-4 w-4" /> Atlas
            </Link>
            <div className="flex items-center gap-2">
              <FolderTree className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              <span className="font-bold tracking-tight">CMS học liệu</span>
            </div>
          </div>
          <button onClick={() => logout()} className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">Đăng xuất</button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-bold tracking-tight">Tài liệu giảng dạy theo tổ chức</h1>
        <p className="mt-1.5 max-w-2xl text-slate-600 dark:text-slate-400">
          Duyệt học liệu theo <b>Khoa → Bộ môn → Học phần</b>. Mỗi học phần hiển thị số tài liệu và số đã nạp vào trợ giảng (RAG).
        </p>

        {loading && (
          <div className="mt-10 flex items-center gap-2 text-slate-500"><Loader2 className="h-5 w-5 animate-spin" /> Đang tải…</div>
        )}
        {error && !loading && (
          <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">{error}</div>
        )}

        {!loading && tree && (
          <div className="mt-6 flex flex-col gap-4">
            {tree.khoa.length === 0 && (
              <p className="text-sm text-slate-500">Chưa có dữ liệu tổ chức. Hãy nạp cơ cấu Khoa/Bộ môn (seeder org-structure) trước.</p>
            )}
            {tree.khoa.map((k) => (
              <details key={k.id} open className="rounded-2xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <summary className="cursor-pointer list-none rounded-xl px-4 py-3 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/60">
                  <span className="text-teal-700 dark:text-teal-300">{k.ten_khoa}</span>
                  <span className="ml-2 text-xs font-normal text-slate-400">{k.bo_mon.length} bộ môn</span>
                </summary>
                <div className="flex flex-col gap-3 px-3 pb-3 pt-1">
                  {k.bo_mon.length === 0 && <p className="px-2 py-1 text-sm text-slate-400">Chưa có bộ môn.</p>}
                  {k.bo_mon.map((b) => (
                    <div key={b.id}>
                      <div className="mb-1.5 flex items-center gap-2 px-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {b.ten_bo_mon}
                        <span className="text-xs font-normal text-slate-400">{b.subjects.length} học phần</span>
                      </div>
                      {b.subjects.length === 0 ? (
                        <p className="px-1 text-xs text-slate-400">Chưa có học phần gán vào bộ môn này.</p>
                      ) : (
                        <div className="flex flex-col gap-1.5">{b.subjects.map((s) => <SubjectRow key={s.id} s={s} />)}</div>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            ))}

            {/* Chưa gán bộ môn */}
            {tree.unassigned.length > 0 && (
              <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/50 p-4 dark:border-amber-500/30 dark:bg-amber-500/5">
                <div className="mb-3 flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-300">
                  Chưa gán bộ môn <span className="text-xs font-normal">({tree.unassigned.length} học phần)</span>
                </div>
                <div className="flex flex-col gap-2">
                  {tree.unassigned.map((s) => (
                    <div key={s.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm dark:border-amber-500/20 dark:bg-slate-900">
                      <span className="font-mono text-xs text-slate-500">{s.ma_mon}</span>
                      <span className="flex-1 truncate font-medium">{s.ten_mon ?? "—"}</span>
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400"><FileText className="h-3 w-3" /> {s.files}</span>
                      {canAssign ? (
                        <select
                          disabled={assigning === s.id || boMonOptions.length === 0}
                          defaultValue=""
                          onChange={(e) => assign(s.id, e.target.value)}
                          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
                        >
                          <option value="" disabled>Gán vào bộ môn…</option>
                          {boMonOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                        </select>
                      ) : (
                        <span className="text-xs text-slate-400">Chờ Khoa/Trường gán</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default CmsMaterials;
