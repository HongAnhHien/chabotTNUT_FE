import { useEffect, useState, type FC } from "react";
import { useNavigate } from "react-router";
import { LogOut, ExternalLink, Activity, ArrowRight } from "lucide-react";
import { useAuthStore, selectUser } from "@/views/pages/stores/auth_store";
import { ROLES, ROLE_LABELS, type Role } from "@/constants/roles";
import { appsForRole, type AtlasApp } from "./atlasApps";
import axiosInstance from "@/infra/api/conflig/axiosInstance";

interface AiService {
  key: string;
  name: string;
  status: "up" | "down" | "unconfigured" | string;
  latency_ms: number | null;
}
interface AiHealth {
  services: AiService[];
  up: number;
  total: number;
}

const statusDot: Record<string, string> = {
  up: "bg-emerald-500",
  down: "bg-rose-500",
  unconfigured: "bg-slate-400",
};

const AtlasHub: FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore(selectUser);
  const logout = useAuthStore((s) => s.logout);

  const role = (user?.role as Role) ?? ROLES.STUDENT;
  const roleLabel = ROLE_LABELS[role] ?? user?.role ?? "";
  const apps = appsForRole(role);
  const available = apps.filter((a) => a.status !== "soon");
  const soon = apps.filter((a) => a.status === "soon");

  const [health, setHealth] = useState<AiHealth | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    axiosInstance
      .get("/ai/health")
      .then((res) => {
        if (alive) setHealth(res.data?.data ?? null);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setHealthLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const openApp = (app: AtlasApp) => {
    if (app.status === "soon") return;
    const dest = app.to(role);
    if (app.status === "external") window.open(dest, "_blank", "noopener,noreferrer");
    else navigate(dest);
  };

  const onLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-900/85">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <img src="/logo_tnut.svg" alt="TNUT" className="h-9 w-9" />
            <div className="leading-tight">
              <div className="text-[15px] font-bold tracking-tight">
                Atlas <span className="text-teal-600 dark:text-teal-400">TNUT</span>
              </div>
              <div className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Hệ sinh thái AI · PIAI
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-medium">{user?.name ?? user?.username ?? "Người dùng"}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">{roleLabel}</div>
            </div>
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Hero */}
        <section className="mb-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-teal-700 ring-1 ring-teal-600/20 dark:bg-teal-500/10 dark:text-teal-300">
            {roleLabel}
          </span>
          <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
            Xin chào, {user?.name ?? user?.username ?? "bạn"}
          </h1>
          <p className="mt-1.5 max-w-2xl text-slate-600 dark:text-slate-400">
            Chọn một ứng dụng để bắt đầu. Toàn hệ sinh thái dùng chung một lần đăng nhập Portal TNUT.
          </p>

          {/* AI status strip */}
          <div className="mt-5 inline-flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-800 dark:bg-slate-900">
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-500 dark:text-slate-400">
              <Activity className="h-4 w-4" /> Dịch vụ AI
            </span>
            {healthLoading && <span className="text-slate-400">Đang kiểm tra…</span>}
            {!healthLoading && !health && <span className="text-slate-400">Không lấy được trạng thái</span>}
            {!healthLoading &&
              health?.services?.map((s) => (
                <span key={s.key} className="inline-flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${statusDot[s.status] ?? "bg-slate-400"}`} />
                  <span className="text-slate-600 dark:text-slate-300">{s.name}</span>
                </span>
              ))}
          </div>
        </section>

        {/* Available apps */}
        <section aria-labelledby="apps-available">
          <h2 id="apps-available" className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Ứng dụng của bạn
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {available.map((app) => {
              const Icon = app.icon;
              return (
                <button
                  key={app.key}
                  onClick={() => openApp(app)}
                  className="group flex flex-col items-start rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-teal-400/60 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-teal-500/50"
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-600 ring-1 ring-teal-600/15 dark:bg-teal-500/10 dark:text-teal-300">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="mt-4 flex w-full items-center justify-between">
                    <h3 className="font-semibold">{app.name}</h3>
                    {app.status === "external" ? (
                      <ExternalLink className="h-4 w-4 text-slate-400 transition group-hover:text-teal-600" />
                    ) : (
                      <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-teal-600 dark:text-slate-600" />
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{app.desc}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Coming soon */}
        {soon.length > 0 && (
          <section aria-labelledby="apps-soon" className="mt-10">
            <h2 id="apps-soon" className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Sắp ra mắt
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {soon.map((app) => {
                const Icon = app.icon;
                return (
                  <div
                    key={app.key}
                    className="relative flex flex-col items-start rounded-2xl border border-dashed border-slate-200 bg-white/60 p-5 dark:border-slate-800 dark:bg-slate-900/50"
                  >
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="mt-4 flex w-full items-center justify-between gap-2">
                      <h3 className="font-semibold text-slate-600 dark:text-slate-300">{app.name}</h3>
                      {app.phase && (
                        <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300">
                          {app.phase}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{app.desc}</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <footer className="mt-12 border-t border-slate-200 pt-6 text-xs text-slate-400 dark:border-slate-800">
          PIAI-TNUT · Viện RIAT — Trường Đại học Kỹ thuật Công nghiệp (TNUT).
        </footer>
      </main>
    </div>
  );
};

export default AtlasHub;
