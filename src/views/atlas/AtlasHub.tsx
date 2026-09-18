import { useEffect, useState, type FC } from "react";
import { useNavigate } from "react-router";
import { LogOut, ExternalLink, Activity, ArrowRight, Sparkles, Layers, KeyRound, ShieldCheck, Lock } from "lucide-react";
import { useAuthStore, selectUser } from "@/views/pages/stores/auth_store";
import { ROLES, ROLE_LABELS, type Role } from "@/constants/roles";
import { ATLAS_APPS, type AtlasApp } from "./atlasApps";
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
  up: "#34d399",
  down: "#fb7185",
  unconfigured: "#cbd5e1",
};

// Màu thương hiệu cho từng ứng dụng — để lưới thẻ sống động, nhìn ra tầm hệ sinh thái.
const APP_COLORS: Record<string, [string, string]> = {
  "tro-giang": ["#6366f1", "#4f46e5"],
  cvht: ["#8b5cf6", "#7c3aed"],
  dashboard: ["#0ea5e9", "#0284c7"],
  cms: ["#14b8a6", "#0d9488"],
  "quan-tri": ["#64748b", "#475569"],
  "tuyen-sinh": ["#f43f5e", "#e11d48"],
  "to-chuc": ["#f59e0b", "#d97706"],
  "la-ban": ["#10b981", "#059669"],
  "diem-danh": ["#d946ef", "#c026d3"],
  elearning: ["#fb923c", "#ea580c"],
  webgis: ["#ef4444", "#dc2626"],
  "noi-tru": ["#3b82f6", "#2563eb"],
};
const appColor = (key: string): [string, string] => APP_COLORS[key] ?? ["#6366f1", "#4f46e5"];

// Nhãn đối tượng cho thẻ "khoá" (ứng dụng thuộc hệ sinh thái nhưng ngoài quyền của vai hiện tại).
function audienceLabel(app: AtlasApp): string {
  const r = app.roles;
  if (r.length === 1 && r[0] === ROLES.ADMIN) return "Quản trị";
  if (!r.includes(ROLES.STUDENT) && !r.includes(ROLES.TEACHER)) return "Cán bộ quản lý";
  if (!r.includes(ROLES.STUDENT)) return "Cán bộ";
  return "Nội bộ";
}

const AtlasHub: FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore(selectUser);
  const logout = useAuthStore((s) => s.logout);

  const role = (user?.role as Role) ?? ROLES.STUDENT;
  const roleLabel = ROLE_LABELS[role] ?? user?.role ?? "";
  // Hiển thị TOÀN hệ sinh thái cho mọi vai: ứng dụng dùng được thì mở, còn lại hiện dạng "khoá"
  // để mọi người (kể cả sinh viên) đều thấy đầy đủ quy mô nền tảng.
  const canUse = (a: AtlasApp) => a.roles.includes(role) && a.status !== "soon";
  const usableCount = ATLAS_APPS.filter(canUse).length;
  // WebGIS mở cho mọi vai nhưng cố tình giữ ở khối "Trong hệ sinh thái" (đầu khối, tô đỏ) để
  // bố cục cân và mobile không bị trôi → tách riêng khỏi 2 danh sách bên dưới.
  const webgis = ATLAS_APPS.find((a) => a.key === "webgis");
  const openApps = ATLAS_APPS.filter((a) => canUse(a) && a.key !== "webgis");
  const otherApps = ATLAS_APPS.filter((a) => !canUse(a) && a.key !== "webgis"); // khoá hoặc sắp ra mắt

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

  const firstName = user?.name ?? user?.username ?? "bạn";

  return (
    <div className="atlas-root">
      <style>{`
        .atlas-root{min-height:100vh;color:#0f172a;
          background:
            radial-gradient(60rem 30rem at 85% -8%, rgba(124,58,237,.10), transparent 60%),
            radial-gradient(50rem 26rem at -5% 12%, rgba(13,148,136,.10), transparent 60%),
            linear-gradient(180deg,#f7f8fc 0%,#eef1f8 100%);}
        .atlas-hero{position:relative;overflow:hidden;color:#fff;
          background:linear-gradient(135deg,#4f46e5 0%,#6d28d9 44%,#0e7490 100%);}
        .atlas-hero::before{content:"";position:absolute;inset:0;opacity:.5;
          background:
            radial-gradient(38rem 20rem at 12% 0%, rgba(255,255,255,.22), transparent 60%),
            radial-gradient(34rem 22rem at 92% 120%, rgba(20,184,166,.45), transparent 55%);
          pointer-events:none;}
        .atlas-hero::after{content:"";position:absolute;inset:0;opacity:.16;pointer-events:none;
          background-image:linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px);
          background-size:44px 44px;mask-image:linear-gradient(180deg,#000,transparent 78%);}
        .atlas-card{transition:transform .18s ease, box-shadow .18s ease, border-color .18s ease;}
        .atlas-card:hover{transform:translateY(-4px);box-shadow:0 18px 40px -18px rgba(15,23,42,.35);}
        .atlas-card:hover .atlas-arrow{transform:translateX(3px);}
        .atlas-pill{backdrop-filter:blur(6px);}
      `}</style>

      {/* ── Khung hero: header + lời chào cùng một dải gradient ───────── */}
      <div className="atlas-hero">
        <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 pt-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 ring-1 ring-white/25">
              <img src="/logo_tnut.svg" alt="TNUT" className="h-6 w-6" />
            </span>
            <div className="leading-tight">
              <div className="text-[15px] font-extrabold tracking-tight">
                Atlas <span className="text-teal-200">TNUT</span>
              </div>
              <div className="text-[11px] uppercase tracking-[.16em] text-white/70">Hệ sinh thái AI · PIAI</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-semibold">{user?.name ?? user?.username ?? "Người dùng"}</div>
              <div className="text-[11px] text-white/70">{roleLabel}</div>
            </div>
            <button
              onClick={onLogout}
              className="atlas-pill inline-flex items-center gap-1.5 rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </header>

        <div className="relative z-10 mx-auto max-w-6xl px-5 pb-20 pt-8">
          <span className="atlas-pill inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white ring-1 ring-white/25">
            <Sparkles className="h-3.5 w-3.5" /> {roleLabel}
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-[2.35rem]">Xin chào, {firstName}</h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-white/80">
            Chọn một ứng dụng để bắt đầu. Toàn hệ sinh thái dùng chung <b className="font-semibold text-white">một lần đăng nhập Portal TNUT</b>, dữ liệu thật theo kỷ luật A/B/C.
          </p>

          {/* Dải giá trị nền tảng */}
          <div className="mt-6 flex flex-wrap gap-2.5">
            <span className="atlas-pill inline-flex items-center gap-2 rounded-xl bg-white/12 px-3.5 py-2 text-sm ring-1 ring-white/20">
              <Layers className="h-4 w-4 text-teal-200" /> <b className="font-semibold">{usableCount}</b> ứng dụng của bạn · {ATLAS_APPS.length} trong hệ sinh thái
            </span>
            <span className="atlas-pill inline-flex items-center gap-2 rounded-xl bg-white/12 px-3.5 py-2 text-sm ring-1 ring-white/20">
              <KeyRound className="h-4 w-4 text-teal-200" /> 1 lần đăng nhập · SSO Portal
            </span>
            <span className="atlas-pill inline-flex items-center gap-2 rounded-xl bg-white/12 px-3.5 py-2 text-sm ring-1 ring-white/20">
              <ShieldCheck className="h-4 w-4 text-teal-200" /> Dữ liệu thật · lấy từ Portal
            </span>
            <span className="atlas-pill inline-flex items-center gap-2 rounded-xl bg-white/12 px-3.5 py-2 text-sm ring-1 ring-white/20">
              <Activity className="h-4 w-4 text-teal-200" />
              {healthLoading ? (
                <span className="text-white/70">Đang kiểm tra dịch vụ AI…</span>
              ) : health ? (
                <span className="inline-flex items-center gap-2">
                  Dịch vụ AI
                  {health.services?.map((s) => (
                    <span key={s.key} className="inline-flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full" style={{ background: statusDot[s.status] ?? "#cbd5e1" }} />
                      <span className="text-white/85">{s.name}</span>
                    </span>
                  ))}
                </span>
              ) : (
                <span className="text-white/70">Dịch vụ AI</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* ── Lưới ứng dụng (đè lên đáy hero) ───────────────────────────── */}
      <main className="relative z-20 mx-auto -mt-12 max-w-6xl px-5 pb-16">
        <section aria-labelledby="apps-available">
          <h2 id="apps-available" className="mb-3 px-1 text-xs font-bold uppercase tracking-[.14em] text-slate-500">
            Ứng dụng của bạn
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {openApps.map((app) => {
              const Icon = app.icon;
              const [c1, c2] = appColor(app.key);
              return (
                <button
                  key={app.key}
                  onClick={() => openApp(app)}
                  className="atlas-card group relative flex flex-col items-start overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 text-left shadow-sm"
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-15 blur-xl transition-opacity group-hover:opacity-30"
                    style={{ background: `radial-gradient(circle, ${c1}, transparent 70%)` }}
                  />
                  <span
                    className="grid h-12 w-12 place-items-center rounded-xl text-white shadow-md"
                    style={{ background: `linear-gradient(135deg, ${c1}, ${c2})`, boxShadow: `0 8px 18px -8px ${c2}` }}
                  >
                    <Icon className="h-6 w-6" />
                  </span>
                  <div className="mt-4 flex w-full items-center justify-between gap-2">
                    <h3 className="text-[15px] font-bold text-slate-900">{app.name}</h3>
                    {app.status === "external" ? (
                      <ExternalLink className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-slate-600" />
                    ) : (
                      <ArrowRight className="atlas-arrow h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-slate-600" />
                    )}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">{app.desc}</p>
                </button>
              );
            })}
          </div>
        </section>

        {(webgis || otherApps.length > 0) && (
          <section aria-labelledby="apps-eco" className="mt-10">
            <h2 id="apps-eco" className="mb-1 px-1 text-xs font-bold uppercase tracking-[.14em] text-slate-500">
              Trong hệ sinh thái PIAI-TNUT
            </h2>
            <p className="mb-3 px-1 text-xs text-slate-400">Các phân hệ khác của nền tảng — mở theo vai được cấp quyền.</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {webgis && (() => {
                const Icon = webgis.icon;
                const [c1, c2] = appColor(webgis.key);
                return (
                  <button
                    key={webgis.key}
                    onClick={() => openApp(webgis)}
                    className="atlas-card group relative flex flex-col items-start overflow-hidden rounded-2xl border-2 border-rose-300 bg-white p-5 text-left shadow-sm ring-1 ring-rose-200/60"
                  >
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-20 blur-xl transition-opacity group-hover:opacity-35"
                      style={{ background: `radial-gradient(circle, ${c1}, transparent 70%)` }}
                    />
                    <span
                      className="grid h-12 w-12 place-items-center rounded-xl text-white shadow-md"
                      style={{ background: `linear-gradient(135deg, ${c1}, ${c2})`, boxShadow: `0 8px 18px -8px ${c2}` }}
                    >
                      <Icon className="h-6 w-6" />
                    </span>
                    <div className="mt-4 flex w-full items-center justify-between gap-2">
                      <h3 className="text-[15px] font-bold text-slate-900">{webgis.name}</h3>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-600 ring-1 ring-rose-200">
                        Mọi vai <ArrowRight className="atlas-arrow h-3 w-3 transition" />
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-slate-500">{webgis.desc}</p>
                  </button>
                );
              })()}
              {otherApps.map((app) => {
                const Icon = app.icon;
                const isSoon = app.status === "soon";
                const [c1] = appColor(app.key);
                return (
                  <div
                    key={app.key}
                    title={isSoon ? undefined : `Phân hệ dành cho: ${audienceLabel(app)}`}
                    className="relative flex flex-col items-start rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5"
                  >
                    <span
                      className="grid h-12 w-12 place-items-center rounded-xl text-white"
                      style={{ background: `linear-gradient(135deg, ${c1}, ${c1})`, opacity: 0.42 }}
                    >
                      <Icon className="h-6 w-6" />
                    </span>
                    <div className="mt-4 flex w-full items-center justify-between gap-2">
                      <h3 className="text-[15px] font-bold text-slate-600">{app.name}</h3>
                      {isSoon ? (
                        <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 ring-1 ring-amber-600/20">
                          {app.phase ?? "Sắp ra mắt"}
                        </span>
                      ) : (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 ring-1 ring-slate-300">
                          <Lock className="h-2.5 w-2.5" /> {audienceLabel(app)}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-slate-500">{app.desc}</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <footer className="mt-12 border-t border-slate-200 pt-6 text-xs text-slate-400">
          PIAI-TNUT · Viện RIAT — Trường Đại học Kỹ thuật Công nghiệp (TNUT).
        </footer>
      </main>
    </div>
  );
};

export default AtlasHub;
