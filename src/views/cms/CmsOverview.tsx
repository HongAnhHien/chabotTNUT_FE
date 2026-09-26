import { useEffect, useState, type FC, type ReactNode } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import {
  Building2, Layers, GraduationCap, Network, BookOpen, FileStack, BrainCircuit,
  Presentation, ListChecks, ClipboardCheck, MessagesSquare, Users, TrendingUp, Trophy,
} from "lucide-react";
import axiosInstance from "@/infra/api/conflig/axiosInstance";

interface Overview {
  to_chuc: { khoa: number; bo_mon: number; nganh: number; chuyen_nganh: number; hp_trong_ctdt: number; mon_danh_muc?: number };
  hoc_phan: { tong: number; da_gan: number; co_hoc_lieu: number; co_rag: number; suy_ra_khoa: number };
  tai_lieu: {
    tong: number; da_nap_rag: number; dung_luong: number;
    theo_loai: { loai: string; so: number }[];
    theo_thang: { thang: string; so: number }[];
  };
  ai: {
    bai_giang: number; bai_giang_duyet: number; cau_hoi: number; de_kiem_tra: number;
    luot_hoi: number; co_trich_dan: number; giang_vien: number;
  };
  theo_khoa: { ten_khoa: string; bo_mon: number; hoc_phan: number; co_hoc_lieu: number; tai_lieu: number }[];
  top_hoc_phan: { ma_mon: string; ten_mon?: string | null; files: number; ingested: number }[];
  cap_nhat: string;
}

const fmt = (n: number) => n.toLocaleString("vi-VN");
const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);
const fmtSize = (bytes: number) =>
  bytes >= 1024 ** 3 ? `${(bytes / 1024 ** 3).toFixed(1)} GB` : `${Math.round(bytes / 1024 ** 2)} MB`;

/** Số chạy từ 0 lên giá trị thật khi trang mở. */
const CountUp: FC<{ to: number }> = ({ to }) => {
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => fmt(Math.round(v)));
  useEffect(() => {
    const c = animate(mv, to, { duration: 1.4, ease: "easeOut" });
    return c.stop;
  }, [to, mv]);
  return <motion.span>{text}</motion.span>;
};

const LOAI_MAU: Record<string, string> = {
  pdf: "bg-rose-500", docx: "bg-sky-500", pptx: "bg-amber-500", xlsx: "bg-emerald-500", "ảnh": "bg-violet-500",
};

const Card: FC<{ title: string; icon: ReactNode; children: ReactNode; className?: string }> = ({ title, icon, children, className = "" }) => (
  <section className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}>
    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{icon}{title}</h3>
    {children}
  </section>
);

const Tile: FC<{ icon: ReactNode; label: string; value: number; sub?: string; tone: string }> = ({ icon, label, value, sub, tone }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
    <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}>{icon}</div>
    <div className="text-2xl font-bold tabular-nums tracking-tight"><CountUp to={value} /></div>
    <div className="text-xs font-medium text-slate-600 dark:text-slate-300">{label}</div>
    {sub && <div className="mt-0.5 text-[11px] text-slate-400">{sub}</div>}
  </div>
);

const Bar: FC<{ value: number; max: number; className?: string; delay?: number }> = ({ value, max, className = "bg-teal-500", delay = 0 }) => (
  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
    <motion.div
      className={`h-full rounded-full ${className}`}
      initial={{ width: 0 }}
      animate={{ width: `${max > 0 ? Math.max((value / max) * 100, value > 0 ? 2 : 0) : 0}%` }}
      transition={{ duration: 1, delay, ease: "easeOut" }}
    />
  </div>
);

const CmsOverview: FC = () => {
  const [d, setD] = useState<Overview | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    axiosInstance.get("/cms/overview").then((r) => setD(r.data?.data ?? null)).catch(() => setErr(true));
  }, []);

  if (err) return null; // khối tổng quan là phần phụ — lỗi thì vẫn để cây học liệu hoạt động
  if (!d) return <div className="mt-6 h-40 animate-pulse rounded-2xl bg-slate-200/60 dark:bg-slate-800/60" />;

  const { to_chuc: tc, hoc_phan: hp, tai_lieu: tl, ai } = d;
  const maxThang = Math.max(1, ...tl.theo_thang.map((t) => t.so));
  const maxKhoa = Math.max(1, ...d.theo_khoa.map((k) => k.hoc_phan));
  const maxTop = Math.max(1, ...d.top_hoc_phan.map((t) => t.files));
  const tyLeRag = pct(tl.da_nap_rag, tl.tong);

  return (
    <div className="mt-6 flex flex-col gap-4">
      {/* Hero: cơ cấu tổ chức thật */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-700 via-teal-600 to-cyan-700 p-5 text-white shadow-md sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-cyan-300/20 blur-2xl" />
        <div className="relative">
          <div className="text-xs font-medium uppercase tracking-widest text-teal-100">Kho học liệu số · Trường ĐH Kỹ thuật Công nghiệp</div>
          <h2 className="mt-1 text-xl font-bold sm:text-2xl">Toàn bộ cơ cấu đào tạo trong một cây học liệu</h2>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { icon: <Building2 className="h-4 w-4" />, v: tc.khoa, l: "Khoa" },
              { icon: <Layers className="h-4 w-4" />, v: tc.bo_mon, l: "Bộ môn" },
              { icon: <GraduationCap className="h-4 w-4" />, v: tc.nganh, l: "Ngành đào tạo" },
              { icon: <Network className="h-4 w-4" />, v: tc.chuyen_nganh, l: "Chuyên ngành" },
              { icon: <BookOpen className="h-4 w-4" />, v: tc.hp_trong_ctdt, l: "Học phần trong CTĐT" },
              ...(tc.mon_danh_muc ? [{ icon: <ListChecks className="h-4 w-4" />, v: tc.mon_danh_muc, l: "Môn trong danh mục" }] : []),
            ].map((x) => (
              <div key={x.l} className="rounded-xl bg-white/10 px-3 py-2.5 ring-1 ring-white/15 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 text-teal-100">{x.icon}<span className="text-xs">{x.l}</span></div>
                <div className="mt-1 text-3xl font-extrabold tabular-nums tracking-tight"><CountUp to={x.v} /></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* KPI học liệu + AI */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile icon={<BookOpen className="h-4 w-4" />} tone="bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300"
          label="Học phần trên hệ thống" value={hp.tong} sub={`${hp.co_hoc_lieu} học phần đã có học liệu`} />
        <Tile icon={<FileStack className="h-4 w-4" />} tone="bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300"
          label="Tài liệu giảng dạy" value={tl.tong} sub={`Tổng dung lượng ${fmtSize(tl.dung_luong)}`} />
        <Tile icon={<Presentation className="h-4 w-4" />} tone="bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
          label="Bài giảng AI soạn" value={ai.bai_giang} sub={`${ai.bai_giang_duyet} bài GV đã duyệt`} />
        <Tile icon={<ListChecks className="h-4 w-4" />} tone="bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
          label="Câu hỏi ngân hàng đề" value={ai.cau_hoi} sub="Rút đề luyện tập & kiểm tra" />
        <Tile icon={<ClipboardCheck className="h-4 w-4" />} tone="bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
          label="Đề / bài kiểm tra" value={ai.de_kiem_tra} sub="Sinh từ học liệu môn" />
        <Tile icon={<MessagesSquare className="h-4 w-4" />} tone="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
          label="Lượt hỏi trợ giảng AI" value={ai.luot_hoi} sub={`${fmt(ai.co_trich_dan)} câu trả lời trích nguồn học liệu`} />
        <Tile icon={<BrainCircuit className="h-4 w-4" />} tone="bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300"
          label="Tài liệu đã nạp trợ giảng" value={tl.da_nap_rag} sub={`${tyLeRag}% kho đã được AI “đọc”`} />
        <Tile icon={<Users className="h-4 w-4" />} tone="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
          label="Giảng viên được phân công" value={ai.giang_vien} sub="Dạy chung theo mã học phần" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Phễu số hoá */}
        <Card title="Hành trình số hoá học phần" icon={<TrendingUp className="h-4 w-4 text-teal-600" />}>
          {[
            { l: "Có trong CTĐT toàn trường", v: tc.hp_trong_ctdt, c: "bg-slate-400" },
            { l: "Đã tạo trên hệ thống", v: hp.tong, c: "bg-teal-400" },
            { l: "Đã có học liệu", v: hp.co_hoc_lieu, c: "bg-teal-500" },
            { l: "Trợ giảng AI trả lời được", v: hp.co_rag, c: "bg-teal-700" },
          ].map((x, i) => (
            <div key={x.l} className="mb-2.5 last:mb-0">
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-300">{x.l}</span>
                <span className="font-semibold tabular-nums">{fmt(x.v)}</span>
              </div>
              <Bar value={x.v} max={tc.hp_trong_ctdt || hp.tong} className={x.c} delay={i * 0.15} />
            </div>
          ))}
          <p className="mt-3 text-[11px] text-slate-400">Mỗi học phần được số hoá là một môn sinh viên có gia sư AI 24/7.</p>
        </Card>

        {/* Nhịp tải lên 12 tháng */}
        <Card title="Nhịp tải học liệu 12 tháng" icon={<FileStack className="h-4 w-4 text-sky-600" />}>
          <div className="flex h-32 items-end gap-1.5">
            {tl.theo_thang.map((t, i) => (
              <div key={t.thang} className="group flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${t.thang}: ${t.so} tài liệu`}>
                <span className="text-[10px] tabular-nums text-slate-500 opacity-0 group-hover:opacity-100">{t.so}</span>
                <motion.div
                  className={`w-full rounded-t ${t.so > 0 ? "bg-sky-500" : "bg-slate-200 dark:bg-slate-800"}`}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max((t.so / maxThang) * 100, 3)}%` }}
                  transition={{ duration: 0.8, delay: i * 0.05 }}
                />
              </div>
            ))}
          </div>
          <div className="mt-1 flex gap-1.5">
            {tl.theo_thang.map((t) => (
              <span key={t.thang} className="flex-1 text-center text-[10px] text-slate-400">T{Number(t.thang.slice(5))}</span>
            ))}
          </div>
          {/* Định dạng */}
          <div className="mt-4 flex h-2.5 overflow-hidden rounded-full">
            {tl.theo_loai.map((x) => (
              <div key={x.loai} className={LOAI_MAU[x.loai] ?? "bg-slate-400"} style={{ width: `${pct(x.so, tl.tong)}%` }} title={`${x.loai}: ${x.so}`} />
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
            {tl.theo_loai.map((x) => (
              <span key={x.loai} className="inline-flex items-center gap-1">
                <span className={`h-2 w-2 rounded-full ${LOAI_MAU[x.loai] ?? "bg-slate-400"}`} />{x.loai.toUpperCase()} {x.so}
              </span>
            ))}
          </div>
        </Card>

        {/* Phủ theo khoa */}
        <Card title="Học phần & học liệu theo khoa" icon={<Building2 className="h-4 w-4 text-teal-600" />}>
          <div className="flex flex-col gap-2.5">
            {[...d.theo_khoa].sort((a, b) => b.hoc_phan - a.hoc_phan).map((k, i) => (
              <div key={k.ten_khoa}>
                <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
                  <span className="truncate text-slate-700 dark:text-slate-200">{k.ten_khoa.replace(/^Khoa /, "")}</span>
                  <span className="shrink-0 tabular-nums text-slate-500">
                    {k.bo_mon} BM · <b className="text-slate-700 dark:text-slate-200">{k.hoc_phan}</b> HP · {k.tai_lieu} tài liệu
                  </span>
                </div>
                <Bar value={k.hoc_phan} max={maxKhoa} delay={i * 0.08} />
              </div>
            ))}
          </div>
          {hp.suy_ra_khoa > 0 && (
            <p className="mt-3 text-[11px] text-slate-400">
              {hp.suy_ra_khoa} học phần chưa gán bộ môn được xếp khoa tự động theo đồ thị CTĐT.
            </p>
          )}
        </Card>

        {/* Top học phần */}
        <Card title="Học phần giàu học liệu nhất" icon={<Trophy className="h-4 w-4 text-amber-500" />}>
          <ol className="flex flex-col gap-2.5">
            {d.top_hoc_phan.map((t, i) => (
              <li key={t.ma_mon} className="flex items-center gap-3">
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? "bg-amber-400 text-white" : "bg-slate-100 text-slate-500 dark:bg-slate-800"}`}>{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2 text-xs">
                    <span className="truncate font-medium">{t.ten_mon ?? t.ma_mon}</span>
                    <span className="shrink-0 tabular-nums text-slate-500">{t.files} tài liệu · {t.ingested} AI</span>
                  </div>
                  <div className="mt-1"><Bar value={t.files} max={maxTop} className="bg-amber-400" delay={i * 0.1} /></div>
                </div>
              </li>
            ))}
            {d.top_hoc_phan.length === 0 && <li className="text-xs text-slate-400">Chưa có học phần nào có tài liệu.</li>}
          </ol>
        </Card>
      </div>

      <p className="text-right text-[11px] text-slate-400">
        Số liệu trực tiếp từ CSDL · cập nhật {new Date(d.cap_nhat).toLocaleString("vi-VN")}
      </p>
    </div>
  );
};

export default CmsOverview;
