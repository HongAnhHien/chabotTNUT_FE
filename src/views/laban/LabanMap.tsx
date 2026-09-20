import { useEffect, useMemo, useState, type FC, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router";
import { ArrowLeft, Compass, Loader2, GitBranch, Star, Target, Route as RouteIcon, X, MapPin, Briefcase, MessageCircle, Send, Grid3x3, Shuffle, Zap, ChevronDown, Layers } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import axiosInstance from "@/infra/api/conflig/axiosInstance";
import { useAuthStore } from "@/views/pages/stores/auth_store";

interface NganhItem { id: string; ma_nganh: string; ten_nganh: string; khoa_tuyen?: string | null; tong_tc?: number | null; so_hoc_phan: number; co_du_lieu: boolean; }
interface Plo { ma_plo: string; mo_ta: string; nhom?: string | null; }
interface HocPhan { ma_mon: string; ten_mon?: string | null; khoi: number; nhom?: string | null; hoc_ky?: number | null; tang?: number | null; so_tc?: string | null; vai_tro?: string | null; bat_buoc?: boolean; dung_chung?: boolean; la_gateway?: boolean; la_bridge?: boolean; so_nganh_chung?: number | null; plo_codes: string[]; plo_levels?: Record<string, number>; can_cu?: string | null; tien_quyet_ma: string[]; hoc_sau_ma?: string[]; song_hanh_ma?: string[]; }
interface MobilityEdge { nganh_id: string; ma_nganh: string; ten_nganh: string; so_chung: number; ty_le: number; mon_chung: string[]; }
interface KhungItem { t: "hp" | "note"; ma?: string; ten: string; tc?: number | null; }
interface KhungBlock { level: number; code: string; ten: string; tc?: number | null; items: KhungItem[]; }
interface GiaiDoan { giai_doan: number; ten: string; thoi_diem?: string | null; muc_tieu?: string | null; hoc_phan_ma: string[]; plo_codes: string[]; du_an?: string | null; career_action?: string | null; }
interface Nghe { ten_vi: string; mo_ta?: string | null; nhom_nganh?: string | null; do_hot?: number | null; plo_can: string[]; }
interface Curriculum { nganh: { id: string; ma_nganh: string; ten_nganh: string; khoa_tuyen?: string | null; tong_tc?: number | null; }; khoi: string[]; plo: Plo[]; hoc_phan: HocPhan[]; giai_doan: GiaiDoan[]; nghe: Nghe[]; }
interface DinhVi { available: boolean; message?: string; gpa_10?: number | null; gpa_4?: number | null; tc_tich_luy?: number | null; canh_cao?: string; completed: string[]; mon_no: string[]; da_hoc_count: number; }
interface AdvisorCareer { ten_vi: string; do_hot?: number | null; match_percent: number; plo_co: string[]; plo_thieu: string[]; goi_y_mon: { ma_mon: string; ten_mon?: string | null; hoc_ky?: number | null; plo: string }[]; }
interface TuVanNghe { available: boolean; message?: string; achieved_plo?: string[]; careers?: AdvisorCareer[]; }
interface ChatMsg { role: "user" | "assistant"; content: string; }

const STT = {
  done:   { label: "✓ Đã học", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300", edge: "border-l-4 !border-l-emerald-500" },
  no:     { label: "Nợ",       badge: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",          edge: "border-l-4 !border-l-rose-500" },
  ready:  { label: "Sẵn sàng", badge: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",          edge: "border-l-4 !border-l-blue-400" },
  locked: { label: "Chưa đủ",  badge: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",         edge: "opacity-60" },
} as const;
type Stt = keyof typeof STT;

const KHOI_STYLE = [
  { ring: "ring-blue-500/25", bg: "bg-blue-50 dark:bg-blue-500/10", text: "text-blue-700 dark:text-blue-300", dot: "bg-blue-500" },
  { ring: "ring-teal-500/25", bg: "bg-teal-50 dark:bg-teal-500/10", text: "text-teal-700 dark:text-teal-300", dot: "bg-teal-500" },
  { ring: "ring-violet-500/25", bg: "bg-violet-50 dark:bg-violet-500/10", text: "text-violet-700 dark:text-violet-300", dot: "bg-violet-500" },
  { ring: "ring-emerald-500/25", bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500" },
];
const ks = (k: number) => KHOI_STYLE[k] ?? KHOI_STYLE[0];

// Mức đóng góp PLO (1..4) — màu đậm dần
const LV: Record<number, string> = {
  1: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
  2: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  3: "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
  4: "bg-emerald-200 text-emerald-800 dark:bg-emerald-500/25 dark:text-emerald-200",
};
const LV_TITLE: Record<number, string> = {
  1: "Mức 1 — chạm nhẹ, giới thiệu khái niệm",
  2: "Mức 2 — có luyện tập nhưng chưa sâu",
  3: "Mức 3 — đạt mức vận dụng cơ bản",
  4: "Mức 4 — đạt mức đỉnh, cam kết cao nhất",
};

// Căn cứ gán PLO → nhãn soát chất lượng
type CanCuInfo = { short: string; badge: string; chip: string; kiem: "yes" | "no" | "ref" };
const CANCU: Record<string, CanCuInfo> = {
  "ĐỀ CƯƠNG THẬT": { short: "đã kiểm", kiem: "yes", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300", chip: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" },
  "MA TRẬN PLO":   { short: "ma trận PLO (BM chốt)", kiem: "yes", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300", chip: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" },
  "ÁP CHUẨN":      { short: "PLO chưa kiểm", kiem: "no", badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300", chip: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300" },
  "THƯ VIỆN":      { short: "thư viện", kiem: "ref", badge: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400", chip: "bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400" },
};
const canCu = (v?: string | null): CanCuInfo | null => (v ? CANCU[v] ?? null : null);

// Vai trò học phần (dịch sang tiếng Việt)
const VAITRO: Record<string, string> = {
  Foundation: "Nền tảng", Core: "Cốt lõi", Specialized: "Chuyên sâu", Elective: "Tự chọn",
  Practice: "Thực hành", Design: "Đồ án", Integration: "Tích hợp", Bridge: "Cầu nối", Gateway: "Mở khoá",
};
const viTro = (v?: string | null) => (v ? VAITRO[v] ?? v : "");

const LabanMap: FC = () => {
  const logout = useAuthStore((s) => s.logout);
  const [searchParams] = useSearchParams();
  const wantNganh = searchParams.get("nganh") ?? "";
  const [nganhList, setNganhList] = useState<NganhItem[]>([]);
  const [nganhId, setNganhId] = useState<string>("");
  const [mobility, setMobility] = useState<MobilityEdge[]>([]);
  const [khung, setKhung] = useState<KhungBlock[]>([]);
  const [cur, setCur] = useState<Curriculum | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingCur, setLoadingCur] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<HocPhan | null>(null);
  const [pos, setPos] = useState<DinhVi | null>(null);
  const [posLoading, setPosLoading] = useState(false);
  const [advisor, setAdvisor] = useState<TuVanNghe | null>(null);
  const [advisorLoading, setAdvisorLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);

  useEffect(() => {
    axiosInstance.get("/laban/nganh")
      .then((res) => {
        const list: NganhItem[] = res.data?.data ?? [];
        setNganhList(list);
        const wanted = wantNganh && list.find((n) => n.id === wantNganh);
        const first = wanted || list.find((n) => n.co_du_lieu) || list[0];
        if (first) setNganhId(first.id);
      })
      .catch(() => setError("Không tải được danh sách ngành."))
      .finally(() => setLoading(false));
  }, [wantNganh]);

  useEffect(() => {
    if (!nganhId) return;
    setLoadingCur(true);
    setSelected(null);
    setPos(null);
    setAdvisor(null);
    setChatMsgs([]);
    setChatOpen(false);
    setMobility([]);
    setKhung([]);
    axiosInstance.get(`/laban/nganh/${nganhId}/khung`)
      .then((res) => setKhung(res.data?.data?.blocks ?? []))
      .catch(() => setKhung([]));
    axiosInstance.get(`/laban/nganh/${nganhId}/curriculum`)
      .then((res) => setCur(res.data?.data ?? null))
      .catch(() => setError("Không tải được bản đồ CTĐT."))
      .finally(() => setLoadingCur(false));
    axiosInstance.get(`/laban/nganh/${nganhId}/mobility`)
      .then((res) => setMobility(res.data?.data ?? []))
      .catch(() => setMobility([]));
  }, [nganhId]);

  const ploMap = useMemo(() => {
    const m: Record<string, string> = {};
    cur?.plo.forEach((p) => { m[p.ma_plo] = p.mo_ta; });
    return m;
  }, [cur]);

  const ploQA = useMemo(() => {
    const withPlo = (cur?.hoc_phan ?? []).filter((h) => h.plo_codes.length > 0);
    let yes = 0, no = 0, ref = 0;
    withPlo.forEach((h) => {
      const k = canCu(h.can_cu)?.kiem;
      if (k === "yes") yes++; else if (k === "no") no++; else if (k === "ref") ref++;
    });
    return { total: withPlo.length, yes, no, ref, has: withPlo.length > 0 && (yes + no + ref) > 0 };
  }, [cur]);

  const byKhoi = useMemo(() => {
    const g: HocPhan[][] = [[], [], [], []];
    cur?.hoc_phan.forEach((h) => { (g[h.khoi] ?? g[0]).push(h); });
    g.forEach((arr) => arr.sort((a, b) => (a.hoc_ky ?? 0) - (b.hoc_ky ?? 0)));
    return g;
  }, [cur]);

  const loadPos = () => {
    setPosLoading(true);
    axiosInstance.get("/laban/dinh-vi")
      .then((r) => setPos(r.data?.data ?? null))
      .catch(() => setPos({ available: false, message: "Không lấy được định vị.", completed: [], mon_no: [], da_hoc_count: 0 }))
      .finally(() => setPosLoading(false));
  };

  const statusOf = (h: HocPhan): Stt | null => {
    if (!pos?.available) return null;
    if (pos.completed.includes(h.ma_mon)) return "done";
    if (pos.mon_no.includes(h.ma_mon)) return "no";
    return h.tien_quyet_ma.every((m) => pos.completed.includes(m)) ? "ready" : "locked";
  };

  const loadAdvisor = () => {
    setAdvisorLoading(true);
    setAdvisor(null);
    axiosInstance.get("/laban/tu-van-nghe", { params: { nganh_id: nganhId } })
      .then((r) => setAdvisor(r.data?.data ?? null))
      .catch(() => setAdvisor({ available: false, message: "Không lấy được cố vấn nghề." }))
      .finally(() => setAdvisorLoading(false));
  };

  const openChat = () => {
    setChatOpen(true);
    if (chatMsgs.length === 0) {
      setChatMsgs([{ role: "assistant", content: "Chào bạn 👋 Mình là **Cố vấn nghề nghiệp TNUT**. Bạn có thể hỏi kiểu *“em nên theo hướng nào?”* hay *“để làm kỹ sư vi mạch em cần học gì?”* — mình tư vấn dựa trên chương trình đào tạo và kết quả học tập thật của bạn." }]);
    }
  };

  const sendChat = async (e?: FormEvent) => {
    e?.preventDefault();
    const text = chatInput.trim();
    if (!text || chatSending) return;
    const next: ChatMsg[] = [...chatMsgs, { role: "user", content: text }];
    setChatMsgs(next);
    setChatInput("");
    setChatSending(true);
    try {
      const r = await axiosInstance.post("/laban/tu-van-chat", { nganh_id: nganhId, message: text, history: chatMsgs.slice(-6) });
      setChatMsgs([...next, { role: "assistant", content: r.data?.data?.reply ?? "…" }]);
    } catch {
      setChatMsgs([...next, { role: "assistant", content: "Xin lỗi, có lỗi khi gọi cố vấn. Bạn thử lại nhé." }]);
    } finally {
      setChatSending(false);
    }
  };

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
            <Link to="/laban/atlas" className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1.5 text-sm font-medium text-teal-700 transition hover:bg-teal-100 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-300">
              <Grid3x3 className="h-4 w-4" /> Atlas toàn trường
            </Link>
            {nganhId && (
              <Link to={`/laban/giao-thong?nganh=${nganhId}`} className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-sm font-medium text-violet-700 transition hover:bg-violet-100 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300">
                <Shuffle className="h-4 w-4" /> Bản đồ giao thông
              </Link>
            )}
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
              <div className="flex flex-wrap gap-2">
                <button onClick={loadPos} disabled={posLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50">
                  <MapPin className="h-4 w-4" /> {posLoading ? "Đang định vị…" : "Định vị của tôi"}
                </button>
                <button onClick={loadAdvisor} disabled={advisorLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-teal-600 bg-white px-3.5 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-50 disabled:opacity-50 dark:border-teal-500/50 dark:bg-slate-900 dark:text-teal-300 dark:hover:bg-teal-500/10">
                  <Briefcase className="h-4 w-4" /> {advisorLoading ? "Đang phân tích…" : "Cố vấn nghề nghiệp"}
                </button>
                <button onClick={openChat}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100">
                  <MessageCircle className="h-4 w-4" /> Hỏi cố vấn nghề
                </button>
              </div>
            </div>

            {/* L2 — Định vị sinh viên (dữ liệu điểm thật từ Portal) */}
            {pos && !pos.available && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">{pos.message}</div>
            )}
            {pos?.available && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <div><div className="text-lg font-bold tabular-nums">{pos.gpa_10 ?? "—"}</div><div className="text-xs text-slate-500">GPA hệ 10</div></div>
                  <div><div className="text-lg font-bold tabular-nums">{pos.gpa_4 ?? "—"}</div><div className="text-xs text-slate-500">GPA hệ 4</div></div>
                  <div><div className="text-lg font-bold tabular-nums">{pos.tc_tich_luy ?? "—"}</div><div className="text-xs text-slate-500">TC tích luỹ</div></div>
                  <div><div className="text-lg font-bold tabular-nums">{pos.da_hoc_count}</div><div className="text-xs text-slate-500">Môn đã đạt</div></div>
                  {pos.canh_cao && <div className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">⚠ {pos.canh_cao}</div>}
                </div>
                <div className="mt-3 flex flex-wrap gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800">
                  <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Đã học</span>
                  <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-400" /> Sẵn sàng học</span>
                  <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-slate-400" /> Chưa đủ tiên quyết</span>
                  <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Đang nợ</span>
                </div>
              </div>
            )}

            {loadingCur && <div className="mt-4 flex items-center gap-2 text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Đang tải bản đồ…</div>}

            {cur.hoc_phan.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900">
                Ngành này chưa có dữ liệu La bàn. Chạy <code className="font-mono">php artisan db:seed --class=LabanSeeder</code> với file dữ liệu ngành.
              </div>
            ) : (
              <>
                {/* Thanh soát chất lượng PLO */}
                {ploQA.has && (
                  <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                      <div className="text-sm font-semibold">Soát chất lượng gán PLO <span className="font-normal text-slate-400">({ploQA.total} học phần có PLO)</span></div>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2 py-1 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"><span className="h-2 w-2 rounded-full bg-emerald-500" /> {ploQA.yes} đã kiểm (đề cương thật)</span>
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2 py-1 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"><span className="h-2 w-2 rounded-full bg-amber-500" /> {ploQA.no} áp chuẩn — chưa kiểm</span>
                        {ploQA.ref > 0 && <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2 py-1 text-slate-500 dark:bg-slate-800 dark:text-slate-400"><span className="h-2 w-2 rounded-full bg-slate-400" /> {ploQA.ref} thư viện</span>}
                      </div>
                    </div>
                    {ploQA.no > 0 && (
                      <div className="mt-3 flex items-start gap-2 border-t border-slate-100 pt-3 text-xs text-amber-700 dark:border-slate-800 dark:text-amber-300">
                        <span className="mt-0.5">⚠</span>
                        <span><b>Còn {ploQA.no}/{ploQA.total} học phần</b> có PLO gán tự động theo khuôn ("áp chuẩn"), <b>chưa soát bằng đề cương thật</b> — Bộ môn nên rà lại (bấm vào từng học phần để xem PLO &amp; mức đóng góp). Ví dụ môn "mềm" có thể bị gán nhầm PLO phần cứng (RF/anten, vi mạch).</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Bản đồ học phần theo 4 khối */}
                <h2 className="mb-3 mt-8 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <GitBranch className="h-4 w-4" /> Bản đồ chương trình đào tạo
                </h2>
                <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {cur.khoi.map((label, k) => {
                    const st = ks(k);
                    return (
                      <div key={k} className="flex max-h-[72vh] flex-col rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className={`mb-2 flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${st.bg} ${st.text}`}>
                          <span className={`h-2.5 w-2.5 rounded-full ${st.dot}`} /> {label}
                          <span className="ml-auto rounded-full bg-white/60 px-1.5 text-xs font-normal dark:bg-black/20">{byKhoi[k].length}</span>
                        </div>
                        <div className="flex flex-1 flex-col gap-2 overflow-y-auto pr-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-track]:bg-transparent dark:[&::-webkit-scrollbar-thumb]:bg-slate-700">
                          {byKhoi[k].map((h) => {
                            const stt = statusOf(h);
                            return (
                            <button
                              key={h.ma_mon}
                              onClick={() => setSelected(h)}
                              className={`rounded-xl border bg-white p-3 text-left text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ring-1 ${st.ring} border-slate-100 dark:border-slate-800 dark:bg-slate-900 ${stt ? STT[stt].edge : ""}`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{h.ma_mon}</span>
                                {stt
                                  ? <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${STT[stt].badge}`}>{STT[stt].label}</span>
                                  : <span className="text-[10px] text-slate-400">Kỳ {h.hoc_ky ?? "—"}</span>}
                              </div>
                              <div className="mt-0.5 font-medium leading-snug">{h.ten_mon}</div>
                              <div className="mt-1.5 flex flex-wrap items-center gap-1">
                                {h.so_tc && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">{h.so_tc} TC</span>}
                                {h.la_gateway && <span className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" title="Mở khoá — mở nhiều môn học sau"><Zap className="h-2.5 w-2.5" />Mở khoá</span>}
                                {h.la_bridge && <span className="inline-flex items-center gap-0.5 rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-700 dark:bg-violet-500/15 dark:text-violet-300" title={`Cầu nối — dùng chung ${h.so_nganh_chung ?? ""} ngành`}><Shuffle className="h-2.5 w-2.5" />Cầu nối</span>}
                                {!h.la_gateway && !h.la_bridge && h.vai_tro && <span className={`rounded px-1.5 py-0.5 text-[10px] ${st.bg} ${st.text}`}>{viTro(h.vai_tro)}</span>}
                                {h.plo_codes.length > 0 && canCu(h.can_cu) && canCu(h.can_cu)!.kiem !== "ref" && (
                                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${canCu(h.can_cu)!.badge}`} title={`Căn cứ gán PLO: ${h.can_cu}`}>
                                    {canCu(h.can_cu)!.kiem === "no" ? "⚠ PLO chưa kiểm" : "✓ PLO đã kiểm"}
                                  </span>
                                )}
                                {h.tien_quyet_ma.length > 0 && <span className="text-[10px] text-slate-400">◂ {h.tien_quyet_ma.join(", ")}</span>}
                              </div>
                            </button>
                            );
                          })}
                          {byKhoi[k].length === 0 && <p className="px-1 py-2 text-xs text-slate-400">—</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bản đồ CTĐT CHI TIẾT theo khối kiến thức (khung chính thức - nguồn A) */}
                {khung.length > 0 && (
                  <>
                    <h2 className="mb-1 mt-10 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <Layers className="h-4 w-4" /> Bản đồ CTĐT chi tiết — theo khối kiến thức
                    </h2>
                    <p className="mb-3 text-xs text-slate-400">Đúng khung chương trình chính thức của Nhà trường (nguồn A): phân khối, số tín chỉ từng khối và nhóm học phần tự chọn. Bấm để mở/gập từng khối.</p>
                    <div className="space-y-2">
                      {khung.map((b, bi) => b.level === 1 ? (
                        <div key={bi} className="mt-4 flex items-center gap-2 border-b-2 border-slate-200 pb-1.5 text-sm font-bold text-slate-700 first:mt-0 dark:border-slate-700 dark:text-slate-200">
                          {b.code && <span className="text-teal-600 dark:text-teal-400">{b.code}.</span>}
                          <span>{b.ten}</span>
                          {b.tc != null && <span className="ml-auto text-xs font-normal text-slate-400">{b.tc} TC</span>}
                        </div>
                      ) : (
                        <details key={bi} className="group rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" open={bi < 3}>
                          <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
                            <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
                            {b.code && <span className="shrink-0 rounded bg-teal-50 px-1.5 py-0.5 font-mono text-xs text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">{b.code}</span>}
                            <span className="min-w-0 flex-1 truncate">{b.ten}</span>
                            <span className="shrink-0 text-xs font-normal text-slate-400">{b.items.filter((i) => i.t === "hp").length} HP{b.tc != null ? ` · ${b.tc} TC` : ""}</span>
                          </summary>
                          <div className="border-t border-slate-100 px-3 py-1.5 dark:border-slate-800">
                            {b.items.map((it, ii) => it.t === "hp" ? (
                              <div key={ii} className="flex items-baseline gap-2.5 py-1 text-sm">
                                <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">{it.ma}</span>
                                <span className="flex-1 leading-snug text-slate-700 dark:text-slate-200">{it.ten}</span>
                                {it.tc != null && <span className="shrink-0 text-xs text-slate-400">{it.tc} TC</span>}
                              </div>
                            ) : (
                              <div key={ii} className="py-1 text-xs italic text-amber-600 dark:text-amber-400">— {it.ten}</div>
                            ))}
                          </div>
                        </details>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-slate-400">Nguồn: khung CTĐT chính thức Nhà trường (khung 14/08 toàn trường).</p>
                  </>
                )}

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

                {/* Dịch chuyển liên ngành (Internal Mobility Map) */}
                {mobility.length > 0 && (
                  <>
                    <h2 className="mb-1 mt-10 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <Shuffle className="h-4 w-4" /> Ngành liền kề — dịch chuyển không đổi hẳn ngành
                    </h2>
                    <p className="mb-3 text-xs text-slate-400">Xếp theo số học phần dùng chung với ngành này — càng nhiều càng dễ chuyển hướng mà vẫn tận dụng tín chỉ đã học.</p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {mobility.slice(0, 9).map((m) => (
                        <button key={m.nganh_id} onClick={() => setNganhId(m.nganh_id)}
                          className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-violet-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="truncate font-semibold leading-tight">{m.ten_nganh}</h3>
                            <span className="shrink-0 rounded-full bg-violet-50 px-2 py-0.5 text-xs font-bold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">{m.so_chung} chung</span>
                          </div>
                          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-violet-500" style={{ width: `${Math.min(100, m.ty_le)}%` }} /></div>
                          {m.mon_chung.length > 0 && <div className="mt-2 truncate text-[10px] text-slate-400" title={m.mon_chung.join(", ")}>Ví dụ chung: {m.mon_chung.slice(0, 5).join(", ")}</div>}
                        </button>
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
              {selected.vai_tro && <span className={`rounded px-2 py-0.5 ${ks(selected.khoi).bg} ${ks(selected.khoi).text}`}>{viTro(selected.vai_tro)}</span>}
              <span className="rounded bg-slate-100 px-2 py-0.5 dark:bg-slate-800">{selected.bat_buoc ? "Bắt buộc" : "Tự chọn"}</span>
            </div>
            {(selected.la_gateway || selected.la_bridge) && (
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {selected.la_gateway && <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"><Zap className="h-3.5 w-3.5" /> Mở khoá — mở nhiều môn học sau</span>}
                {selected.la_bridge && <span className="inline-flex items-center gap-1 rounded-lg bg-violet-50 px-2 py-1 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"><Shuffle className="h-3.5 w-3.5" /> Cầu nối — dùng chung {selected.so_nganh_chung ?? ""} ngành</span>}
              </div>
            )}
            {selected.tien_quyet_ma.length > 0 && (
              <div className="mt-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Học phần tiên quyết (học trước)</div>
                <div className="mt-1 flex flex-wrap gap-1.5">{selected.tien_quyet_ma.map((m) => <span key={m} className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs dark:bg-slate-800">{m}</span>)}</div>
              </div>
            )}
            {(selected.hoc_sau_ma?.length ?? 0) > 0 && (
              <div className="mt-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Mở khoá học phần sau</div>
                <div className="mt-1 flex flex-wrap gap-1.5">{selected.hoc_sau_ma!.map((m) => <span key={m} className="rounded-md bg-emerald-50 px-2 py-0.5 font-mono text-xs text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">{m}</span>)}</div>
              </div>
            )}
            {(selected.song_hanh_ma?.length ?? 0) > 0 && (
              <div className="mt-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Học song hành</div>
                <div className="mt-1 flex flex-wrap gap-1.5">{selected.song_hanh_ma!.map((m) => <span key={m} className="rounded-md bg-blue-50 px-2 py-0.5 font-mono text-xs text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">{m}</span>)}</div>
              </div>
            )}
            {selected.plo_codes.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Chuẩn đầu ra đóng góp (PLO)</div>
                  {canCu(selected.can_cu) && (
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${canCu(selected.can_cu)!.chip}`} title="Căn cứ gán PLO">
                      {selected.can_cu} · {canCu(selected.can_cu)!.short}
                    </span>
                  )}
                </div>
                <ul className="mt-1.5 flex flex-col gap-1.5">
                  {selected.plo_codes.map((p) => {
                    const lv = selected.plo_levels?.[p];
                    return (
                      <li key={p} className="flex items-center gap-2 text-sm">
                        <span className="shrink-0 rounded bg-teal-50 px-1.5 py-0.5 text-xs font-semibold text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">{p}</span>
                        {lv != null && <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${LV[lv] ?? LV[1]}`} title={LV_TITLE[lv] ?? ""}>mức {lv}</span>}
                        <span className="text-slate-600 dark:text-slate-300">{ploMap[p] ?? ""}</span>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-2 text-[10px] text-slate-400">Mức 1 giới thiệu · 2 luyện tập · 3 vận dụng · 4 thành thạo (cam kết cao nhất).</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* L3 — Cố vấn nghề nghiệp */}
      {advisor && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" onClick={() => setAdvisor(null)}>
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
          <div className="relative z-10 max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setAdvisor(null)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"><X className="h-5 w-5" /></button>
            <div className="flex items-center gap-2 text-lg font-bold"><Briefcase className="h-5 w-5 text-teal-600" /> Cố vấn nghề nghiệp</div>
            {!advisor.available ? (
              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">{advisor.message}</p>
            ) : (
              <>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Xếp hạng theo mức khớp giữa năng lực bạn đã tích luỹ và yêu cầu từng nghề — chỉ dựa trên dữ liệu học vụ thật của bạn.</p>
                <div className="mt-4 flex flex-col gap-4">
                  {advisor.careers?.map((c) => (
                    <div key={c.ten_vi} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{c.ten_vi}</h3>
                          {c.do_hot != null && <span className="flex text-amber-500">{Array.from({ length: Math.min(5, c.do_hot) }).map((_, i) => <Star key={i} className="h-3 w-3 fill-current" />)}</span>}
                        </div>
                        <span className="shrink-0 text-lg font-bold tabular-nums text-teal-700 dark:text-teal-300">{c.match_percent}%</span>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-teal-500" style={{ width: `${c.match_percent}%` }} /></div>
                      {c.plo_co.length > 0 && <div className="mt-3 text-xs"><span className="font-semibold text-emerald-600">Đã có: </span>{c.plo_co.map((p) => <span key={p} title={ploMap[p]} className="mr-1 inline-block rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">{p}</span>)}</div>}
                      {c.plo_thieu.length > 0 && <div className="mt-1.5 text-xs"><span className="font-semibold text-amber-600">Còn thiếu: </span>{c.plo_thieu.map((p) => <span key={p} title={ploMap[p]} className="mr-1 inline-block rounded bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">{p}</span>)}</div>}
                      {c.goi_y_mon.length > 0 && (
                        <div className="mt-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Gợi ý học để lấp khoảng trống</div>
                          <ul className="mt-1.5 flex flex-col gap-1 text-sm">
                            {c.goi_y_mon.map((m) => <li key={m.ma_mon} className="flex items-center gap-2"><span className="font-mono text-xs text-slate-500">{m.ma_mon}</span> <span className="flex-1 truncate">{m.ten_mon}</span> <span className="shrink-0 rounded bg-teal-50 px-1.5 py-0.5 text-[10px] text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">{m.plo}</span></li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                  {(advisor.careers?.length ?? 0) === 0 && <p className="text-sm text-slate-400">Ngành này chưa khai báo nghề đích trong La bàn.</p>}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* L3+ — Chatbot hội thoại tư vấn nghề */}
      {chatOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" onClick={() => setChatOpen(false)}>
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
          <div className="relative z-10 flex h-[82vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:h-[70vh] sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <div className="flex items-center gap-2 font-semibold"><MessageCircle className="h-5 w-5 text-teal-600" /> Cố vấn nghề nghiệp AI</div>
              <button onClick={() => setChatOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {chatMsgs.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${m.role === "user" ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"}`}>
                    {m.role === "assistant"
                      ? <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-headings:my-1"><ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown></div>
                      : <span className="whitespace-pre-wrap">{m.content}</span>}
                  </div>
                </div>
              ))}
              {chatSending && <div className="flex justify-start"><div className="rounded-2xl bg-slate-100 px-3.5 py-2 text-sm text-slate-400 dark:bg-slate-800"><Loader2 className="mr-1 inline h-4 w-4 animate-spin" /> đang soạn…</div></div>}
            </div>
            <form onSubmit={sendChat} className="flex gap-2 border-t border-slate-200 p-3 dark:border-slate-800">
              <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Hỏi về nghề nghiệp, hướng đi…"
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800" />
              <button type="submit" disabled={chatSending} className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"><Send className="h-4 w-4" /></button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabanMap;
