import { useEffect, useMemo, useState, type FC } from "react";
import { Link, useSearchParams } from "react-router";
import { ArrowLeft, Compass, Loader2, Layers } from "lucide-react";
import axiosInstance from "@/infra/api/conflig/axiosInstance";
import { API_ENDPOINTS } from "@/infra/api/conflig/apiEndpoints";
import toast from "react-hot-toast";
import { useAuthStore } from "@/views/pages/stores/auth_store";

interface NganhItem { id: string; ma_nganh: string; ten_nganh: string; ten_khoa?: string | null; co_du_lieu: boolean; }
interface HocPhan { ma_mon: string; ten_mon?: string | null; la_gateway?: boolean; la_bridge?: boolean; so_nganh_chung?: number | null; }
interface Nghe { ten_vi: string; do_hot?: number | null; }
interface Curriculum { nganh: { id: string; ma_nganh: string; ten_nganh: string; ten_khoa?: string | null; khoa_tuyen?: string | null; tong_tc?: number | null }; hoc_phan: HocPhan[]; nghe: Nghe[]; }
interface NgheDich { ten_vi: string; do_hot?: number | null; nguon?: string | null; }
interface RadarItem { loai: string; mo_ta: string; horizon: number; nguon?: string | null; }
const RADAR_TAG: Record<string, { label: string; cls: string }> = {
  emerging:     { label: "Mới nổi",     cls: "bg-emerald-500 text-white" },
  ai_augmented: { label: "AI hỗ trợ",   cls: "bg-sky-500 text-white" },
  core:         { label: "Người giữ",   cls: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200" },
  automatable:  { label: "Tự động hoá", cls: "bg-slate-400 text-white dark:bg-slate-600" },
};
interface Edge { nganh_id: string; ma_nganh: string; ten_nganh: string; ten_khoa?: string | null; cung_nganh?: boolean; cung_khoa: boolean; so_chung: number; ty_le: number; mon_chung: string[]; optionality: number; nghe: NgheDich[]; }

// màu tuyến: cùng ngành (xanh dương, gần nhất) · nội bộ khoa (A, xanh lá) · ra ngoài (C, hồng)
const COL_NGANH = "#2563eb", COL_A = "#2f9e44", COL_C = "#d6336c";
// URL phân hệ RIAT E-learning (app Next.js chạy riêng, mặc định cổng dev 3001)
const RIAT_ELEARNING_URL = (import.meta.env.VITE_RIAT_ELEARNING_URL as string | undefined) || "http://localhost:3001";
const colorOf = (e: Edge) => (e.cung_nganh ? COL_NGANH : e.cung_khoa ? COL_A : COL_C);

const Segs: FC<{ v: number; color: string }> = ({ v, color }) => (
  <div className="flex gap-[3px]">
    {[1, 2, 3, 4, 5].map((i) => (
      <span key={i} className="h-[7px] flex-1 rounded-sm" style={{ background: i <= v ? color : "var(--seg-off)" }} />
    ))}
  </div>
);

const CompetencyMap: FC = () => {
  const logout = useAuthStore((s) => s.logout);
  const [searchParams] = useSearchParams();
  const wantNganh = searchParams.get("nganh") ?? "";
  const [list, setList] = useState<NganhItem[]>([]);
  const [nganhId, setNganhId] = useState("");
  const [cur, setCur] = useState<Curriculum | null>(null);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(true);
  const [active, setActive] = useState<string | null>(null);
  const [radarBy, setRadarBy] = useState<Record<string, RadarItem[]>>({});

  useEffect(() => {
    axiosInstance.get("/laban/nganh").then((r) => {
      const l: NganhItem[] = r.data?.data ?? [];
      setList(l);
      const w = wantNganh && l.find((n) => n.id === wantNganh);
      const first = w || l.find((n) => n.co_du_lieu) || l[0];
      if (first) setNganhId(first.id);
    }).finally(() => setLoading(false));
  }, [wantNganh]);

  useEffect(() => {
    if (!nganhId) return;
    let cancelled = false;
    setActive(null);
    setMapLoading(true);

    const curReq = axiosInstance.get(`/laban/nganh/${nganhId}/curriculum`)
      .then((r) => { if (!cancelled) setCur(r.data?.data ?? null); })
      .catch(() => { if (!cancelled) setCur(null); });

    // Mobility: tự thử lại nếu rỗng (tránh đua với refresh token / khởi động lại BE)
    const mobReq = (async () => {
      for (let i = 0; i < 3; i++) {
        try {
          const r = await axiosInstance.get(`/laban/nganh/${nganhId}/mobility`);
          const data: Edge[] = r.data?.data ?? [];
          if (data.length > 0 || i === 2) { if (!cancelled) setEdges(data); return; }
        } catch { if (i === 2) { if (!cancelled) setEdges([]); return; } }
        await new Promise((res) => setTimeout(res, 450));
      }
    })();

    Promise.allSettled([curReq, mobReq]).then(() => { if (!cancelled) setMapLoading(false); });
    return () => { cancelled = true; };
  }, [nganhId]);

  useEffect(() => {
    if (!active || radarBy[active]) return;
    axiosInstance.get(`/laban/nganh/${active}/future-radar`)
      .then((r) => setRadarBy((m) => ({ ...m, [active]: r.data?.data ?? [] })))
      .catch(() => setRadarBy((m) => ({ ...m, [active]: [] })));
  }, [active, radarBy]);

  const nameOf = useMemo(() => {
    const m: Record<string, string> = {};
    cur?.hoc_phan.forEach((h) => { if (h.ten_mon) m[h.ma_mon] = h.ten_mon; });
    return m;
  }, [cur]);

  // Học phần giá trị chuyển đổi cao (dùng chung nhiều ngành) — cho panel giới thiệu
  const topValue = useMemo(() => {
    return [...(cur?.hoc_phan ?? [])]
      .filter((h) => (h.so_nganh_chung ?? 0) > 1)
      .sort((a, b) => (b.so_nganh_chung ?? 0) - (a.so_nganh_chung ?? 0))
      .slice(0, 6);
  }, [cur]);

  const dests = [...edges].sort((a, b) => (b.cung_nganh ? 1 : 0) - (a.cung_nganh ? 1 : 0) || b.so_chung - a.so_chung).slice(0, 6);
  const sel = dests.find((d) => d.nganh_id === active) || null;

  // SVG layout (cỡ chữ to hơn cho hài hoà với panel bên phải)
  const VB_W = 1000, VB_H = Math.max(460, 150 + dests.length * 104);
  const HUB = { x: 300, y: VB_H / 2 };
  const NX = 686, NW = 300, NH = 74;
  const ys = dests.map((_, i) => (dests.length === 1 ? VB_H / 2 : 80 + i * ((VB_H - 160) / (dests.length - 1))));

  const kho = (e: Edge) => Math.max(1, Math.min(5, Math.round((100 - e.ty_le) / 20)));
  const ruiro = (e: Edge) => (e.cung_khoa ? 2 : 3);

  // Mở RIAT E-learning bằng SSO (lấy vé rồi vào thẳng, không phải đăng nhập lại)
  const openRiatSso = async () => {
    const w = window.open("about:blank", "_blank");
    try {
      const res = await axiosInstance.post(API_ENDPOINTS.SSO.RIAT_TICKET);
      const ticket = res.data?.data?.ticket as string | undefined;
      if (!ticket) throw new Error("no ticket");
      // next=/khoa-hoc : sau khi SSO đưa về trang "Khoá học" của RIAT E-learning
      const url = `${RIAT_ELEARNING_URL.replace(/\/+$/, "")}/learn/sso?t=${encodeURIComponent(ticket)}&next=${encodeURIComponent("/khoa-hoc")}`;
      if (w) w.location.href = url; else window.location.href = url;
    } catch {
      if (w) w.close();
      toast.error("Chưa tạo được phiên đăng nhập RIAT E-learning. Kiểm tra RIAT đang chạy và thử lại.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 [--seg-off:#e2e8f0] [--bead-bg:#ffffff] [--node-stroke:#bcc8d4] dark:[--seg-off:#334155] dark:[--bead-bg:#0f172a] dark:[--node-stroke:#354453]">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-900/85">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to={`/laban?nganh=${nganhId}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <ArrowLeft className="h-4 w-4" /> La bàn
            </Link>
            <div className="flex items-center gap-2"><Compass className="h-5 w-5 text-teal-600 dark:text-teal-400" /><span className="font-bold tracking-tight">Bản đồ Giao thông Năng lực</span></div>
          </div>
          <div className="flex items-center gap-3">
            {list.length > 0 && (
              <select value={nganhId} onChange={(e) => setNganhId(e.target.value)} className="max-w-[240px] rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800">
                {list.map((n) => <option key={n.id} value={n.id}>{n.ten_nganh}</option>)}
              </select>
            )}
            <button onClick={() => logout()} className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">Đăng xuất</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-teal-600 dark:text-teal-400">Viện RIAT · TNUT · Cố vấn học tập AI</div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Bản đồ Giao thông Năng lực</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">Định vị &amp; dẫn đường: từ ngành hiện tại có thể <b>dịch chuyển</b> sang những ngành nào — bấm một tuyến để xem học phần cầu nối, mức chung, độ khó &amp; độ mở lựa chọn. Con số trên mỗi tuyến = số học phần dùng chung.</p>

        {(loading || mapLoading) && <div className="mt-6 flex items-center gap-2 text-slate-500"><Loader2 className="h-5 w-5 animate-spin" /> Đang tải bản đồ…</div>}

        {!loading && !mapLoading && cur && (
          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1.55fr_1fr]">
            {/* Bản đồ SVG */}
            <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="overflow-x-auto">
                <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="block h-auto w-full min-w-[640px]" role="img" aria-label="Bản đồ tuyến dịch chuyển năng lực">
                  {/* tuyến */}
                  {dests.map((d, i) => {
                    const y = ys[i], col = colorOf(d), on = active === d.nganh_id, dim = active !== null && !on;
                    const path = `M${HUB.x},${HUB.y} C520,${HUB.y} 540,${y} ${NX},${y}`;
                    const bx = 560, by = HUB.y + (y - HUB.y) * 0.62;
                    return (
                      <g key={d.nganh_id} className="cursor-pointer" style={{ opacity: dim ? 0.34 : 1, transition: "opacity .15s" }}
                        onClick={() => setActive(on ? null : d.nganh_id)} tabIndex={0} role="button" aria-label={d.ten_nganh}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActive(on ? null : d.nganh_id); } }}>
                        <path d={path} fill="none" stroke={col} strokeWidth={on ? 10 : 5.5} strokeLinecap="round" style={{ transition: "stroke-width .15s" }} />
                        <circle cx={bx} cy={by} r={19} fill="var(--bead-bg)" stroke={col} strokeWidth={4} />
                        <text x={bx} y={by} textAnchor="middle" dominantBaseline="central" className="fill-slate-900 dark:fill-slate-100" style={{ fontSize: 17, fontWeight: 700 }}>{d.so_chung}</text>
                        <rect x={NX} y={y - NH / 2} width={NW} height={NH} rx={13} className="fill-slate-50 dark:fill-slate-800" stroke="var(--node-stroke)" strokeWidth={on ? 2.6 : 1.5} />
                        <rect x={NX} y={y - NH / 2} width={7} height={NH} rx={3.5} fill={col} />
                        <text x={NX + 22} y={y - 7} className="fill-slate-900 dark:fill-slate-100" style={{ fontSize: 21, fontWeight: 600 }}>{d.ten_nganh.length > 26 ? d.ten_nganh.slice(0, 25) + "…" : d.ten_nganh}</text>
                        <text x={NX + 22} y={y + 18} className="fill-slate-500 dark:fill-slate-400" style={{ fontSize: 15 }}>{(() => { const n = d.nghe?.[0]?.ten_vi; return n ? (n.length > 30 ? n.slice(0, 29) + "…" : n) : (d.cung_khoa ? "Nội bộ khoa · A" : "Ra ngoài khoa · C"); })()}</text>
                      </g>
                    );
                  })}
                  {/* hub */}
                  <g>
                    <rect x={48} y={HUB.y - 50} width={252} height={100} rx={16} className="fill-slate-800 dark:fill-slate-200" />
                    <text x={68} y={HUB.y - 20} className="fill-slate-300 dark:fill-slate-600" style={{ fontSize: 13, letterSpacing: ".12em", fontWeight: 600 }}>ĐANG Ở ĐÂY</text>
                    <text x={68} y={HUB.y + 6} className="fill-white dark:fill-slate-900" style={{ fontSize: 21, fontWeight: 700 }}>{cur.nganh.ten_nganh.length > 18 ? cur.nganh.ten_nganh.slice(0, 17) + "…" : cur.nganh.ten_nganh}</text>
                    <text x={68} y={HUB.y + 30} className="fill-slate-300 dark:fill-slate-600" style={{ fontSize: 14 }}>Khoá {cur.nganh.khoa_tuyen || "K62"}{cur.nganh.tong_tc ? ` · ${cur.nganh.tong_tc} TC bắt buộc` : ""}</text>
                  </g>
                </svg>
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 px-3 pb-1 pt-2.5 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <span className="inline-flex items-center gap-1.5"><i className="inline-block h-1 w-5 rounded" style={{ background: COL_NGANH }} /> Cùng ngành (gần nhất)</span>
                <span className="inline-flex items-center gap-1.5"><i className="inline-block h-1 w-5 rounded" style={{ background: COL_A }} /> Nội bộ khoa (nguồn A)</span>
                <span className="inline-flex items-center gap-1.5"><i className="inline-block h-1 w-5 rounded" style={{ background: COL_C }} /> Ra ngoài khoa (nguồn C)</span>
                <span className="ml-auto text-[11px] text-slate-400">Độ khó/Rủi ro/Độ mở lựa chọn = suy luận (B)</span>
              </div>
            </div>

            {/* Panel chi tiết */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              {!sel ? (
                <>
                  <h2 className="flex items-center gap-2 text-base font-bold"><span className="h-3 w-3 rounded-full bg-teal-500" /> Bạn đang ở đâu → đi được đâu?</h2>
                  <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Từ <b>{cur.nganh.ten_nganh}</b> có <b>{dests.length} tuyến dịch chuyển</b> gần nhất. Bấm một tuyến trên bản đồ để xem chi tiết.</p>
                  {topValue.length > 0 && (
                    <div className="mt-5">
                      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Học phần giá trị chuyển đổi cao</h3>
                      <div className="flex flex-col gap-1.5">
                        {topValue.map((h) => {
                          const w = Math.round(((h.so_nganh_chung ?? 0) / 33) * 100);
                          return (
                            <div key={h.ma_mon} className="flex items-center gap-2 text-sm">
                              <span className="shrink-0 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-xs dark:border-slate-700 dark:bg-slate-800">{h.ma_mon}</span>
                              <span className="h-1.5 rounded-full bg-teal-500/80" style={{ width: `${Math.max(8, w)}px` }} />
                              <span className="min-w-0 flex-1 truncate text-slate-600 dark:text-slate-300">{h.ten_mon}</span>
                              <span className="shrink-0 text-xs text-slate-400">{h.so_nganh_chung} ngành</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
                    <p>Người học có thể tận dụng học <b>song song 2 bằng đại học</b>, hoặc <b>định hướng bồi dưỡng các kỹ năng chuyên môn</b> cho tương lai.</p>
                    <button type="button" onClick={openRiatSso} className="mt-2 inline-flex items-center gap-1 font-medium text-teal-700 hover:underline dark:text-teal-300">Xem thêm khoá bồi dưỡng tại RIAT E-learning →</button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="flex flex-wrap items-center gap-2 text-base font-bold leading-tight">
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: colorOf(sel) }} />{sel.ten_nganh}
                    {sel.cung_nganh
                      ? <span className="rounded px-1.5 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">Cùng ngành</span>
                      : <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${sel.cung_khoa ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"}`}>Nguồn {sel.cung_khoa ? "A" : "C"}</span>}
                  </h2>
                  {sel.ten_khoa && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{sel.ten_khoa}</p>}
                  {sel.nghe?.length > 0 && (
                    <div className="mt-3">
                      <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Nghề đích {sel.nghe[0]?.nguon === "B" && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-medium normal-case text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" title="Định hướng — chờ khoa duyệt">định hướng · nguồn B</span>}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {sel.nghe.map((n) => (
                          <div key={n.ten_vi} className="flex items-center gap-2 text-sm">
                            <span className="min-w-0 flex-1 truncate text-slate-700 dark:text-slate-200">{n.ten_vi}</span>
                            {n.do_hot != null && <span className="shrink-0 text-amber-500" title={`Độ hot ${n.do_hot}/5`}>{"★".repeat(Math.min(5, n.do_hot))}<span className="text-slate-300 dark:text-slate-600">{"★".repeat(Math.max(0, 5 - (n.do_hot ?? 0)))}</span></span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div><div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Độ khó</div><Segs v={kho(sel)} color="#8493a2" /><div className="mt-1 text-xs text-slate-500">{kho(sel)}/5</div></div>
                    <div><div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Rủi ro</div><Segs v={ruiro(sel)} color="#e08a00" /><div className="mt-1 text-xs text-slate-500">{ruiro(sel)}/5</div></div>
                    <div><div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Độ mở lựa chọn</div><Segs v={sel.optionality} color="#2f9e44" /><div className="mt-1 text-xs text-slate-500">{sel.optionality}/5</div></div>
                  </div>
                  <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800/50">
                    <div className="flex items-center justify-between"><span className="text-slate-500 dark:text-slate-400">Học phần dùng chung</span><span className="font-bold tabular-nums text-teal-700 dark:text-teal-300">{sel.so_chung} · {sel.ty_le}%</span></div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"><div className="h-full rounded-full bg-teal-500" style={{ width: `${Math.min(100, sel.ty_le)}%` }} /></div>
                  </div>
                  <div className="mt-4">
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Cầu nối — học phần chuyên ngành dùng chung ({sel.mon_chung.length})</h3>
                    <div className="flex flex-col">
                      {sel.mon_chung.map((c) => (
                        <div key={c} className="flex items-baseline gap-2.5 border-t border-slate-100 py-1.5 first:border-t-0 dark:border-slate-800">
                          <span className="shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold text-white" style={{ background: colorOf(sel) }}>{c}</span>
                          <span className="text-sm text-slate-700 dark:text-slate-200">{nameOf[c] ?? c}</span>
                        </div>
                      ))}
                      {sel.mon_chung.length === 0 && <p className="py-1.5 text-sm text-slate-400">Chủ yếu chung ở khối đại cương.</p>}
                    </div>
                  </div>
                  {(radarBy[sel.nganh_id]?.length ?? 0) > 0 && (
                    <div className="mt-4">
                      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Tương lai nghề · 5–10 năm
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-medium normal-case text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" title="Dự báo xu hướng — chờ khoa duyệt">dự báo · nguồn B</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        {radarBy[sel.nganh_id].map((r, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${RADAR_TAG[r.loai]?.cls ?? RADAR_TAG.core.cls}`}>{RADAR_TAG[r.loai]?.label ?? r.loai}</span>
                            <span className="min-w-0 flex-1 text-slate-700 dark:text-slate-200">{r.mo_ta}</span>
                            <span className="shrink-0 text-xs text-slate-400">{r.horizon} năm</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mt-4 border-l-[3px] border-rose-400 pl-3 text-sm text-slate-500 dark:text-slate-400">
                    {sel.cung_nganh
                      ? "Cùng ngành xét tuyển (khác chuyên ngành) — gần nhất, gần như học tiếp không phải học lại; chỉ khác học phần chuyên sâu."
                      : sel.cung_khoa
                        ? "Tuyến nội bộ khoa — dịch chuyển thuận lợi, tận dụng phần lớn tín chỉ đã học."
                        : "Tuyến ra ngoài khoa (nguồn C) — cần đối chiếu CTĐT ngành đích khi chuyển; số môn chung càng cao càng dễ."}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          <Layers className="h-4 w-4" /> Nguồn: CTĐT K62 (số TC bắt buộc &amp; số môn dùng chung = nguồn A, từ khung CTĐT — không lấy từ tài khoản). Độ khó/Rủi ro/Độ mở lựa chọn · nghề đích · tương lai nghề 5–10 năm là định hướng/dự báo (B), chờ khoa duyệt.
        </div>
      </main>
    </div>
  );
};

export default CompetencyMap;
