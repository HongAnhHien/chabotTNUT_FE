import { useEffect, useMemo, useState, type FC } from "react";
import { Loader2, Sparkles, X } from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "@/infra/api/conflig/axiosInstance";

type TinCay = "cao" | "trung_binh" | "thap" | null;
interface GoiY {
  id: string;
  ma_mon: string;
  ten_mon?: string | null;
  khoa?: string | null;
  nguon_khoa?: string | null;
  bo_mon_id: string | null;
  bo_mon?: string | null;
  nguon?: string | null;
  tin_cay: TinCay;
  ly_do?: string | null;
}

const TIN_CAY: Record<Exclude<TinCay, null>, { label: string; cls: string }> = {
  cao: { label: "Cao", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30" },
  trung_binh: { label: "Trung bình", cls: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/30" },
  thap: { label: "Thấp", cls: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30" },
};

interface Props {
  boMonOptions: { id: string; label: string }[];
  onClose: () => void;
  onDone: () => void;
}

/**
 * Gán bộ môn hàng loạt: hệ thống gợi ý (GV phụ trách → từ khoá tên môn → tiền tố mã môn),
 * cán bộ rà soát, sửa và chọn trước khi áp dụng. Mặc định chỉ tick gợi ý tin cậy Cao/Trung bình.
 */
const BulkAssignBoMon: FC<Props> = ({ boMonOptions, onClose, onDone }) => {
  const [items, setItems] = useState<GoiY[] | null>(null);
  const [chon, setChon] = useState<Record<string, string>>({}); // subject_id → bo_mon_id đang chọn
  const [tick, setTick] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axiosInstance
      .get("/cms/bo-mon/goi-y")
      .then((r) => {
        const thuTu = { cao: 0, trung_binh: 1, thap: 2 } as const;
        const list: GoiY[] = [...(r.data?.data?.items ?? [])].sort(
          (a: GoiY, b: GoiY) => (a.tin_cay ? thuTu[a.tin_cay] : 3) - (b.tin_cay ? thuTu[b.tin_cay] : 3),
        );
        setItems(list);
        setChon(Object.fromEntries(list.filter((i) => i.bo_mon_id).map((i) => [i.id, i.bo_mon_id as string])));
        setTick(Object.fromEntries(list.map((i) => [i.id, i.tin_cay === "cao" || i.tin_cay === "trung_binh"])));
      })
      .catch(() => {
        toast.error("Không tải được gợi ý bộ môn.");
        onClose();
      });
    // chỉ tải gợi ý một lần khi mở hộp thoại
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dem = useMemo(() => {
    const d = { cao: 0, trung_binh: 0, thap: 0, khong: 0 };
    items?.forEach((i) => (i.tin_cay ? d[i.tin_cay]++ : d.khong++));
    return d;
  }, [items]);

  const duocChon = (items ?? []).filter((i) => tick[i.id] && chon[i.id]);

  const tickTheo = (muc: TinCay[]) =>
    setTick(Object.fromEntries((items ?? []).map((i) => [i.id, muc.includes(i.tin_cay) && !!chon[i.id]])));

  const apDung = async () => {
    if (duocChon.length === 0) return;
    setSaving(true);
    try {
      const res = await axiosInstance.post("/cms/subjects/bo-mon-hang-loat", {
        items: duocChon.map((i) => ({ subject_id: i.id, bo_mon_id: chon[i.id] })),
      });
      toast.success(res.data?.message ?? `Đã gán ${duocChon.length} học phần.`);
      onDone();
    } catch {
      toast.error("Gán hàng loạt không thành công.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold"><Sparkles className="h-5 w-5 text-teal-600" /> Gán bộ môn hàng loạt</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Gợi ý theo thứ tự: bộ môn của GV phụ trách → từ khoá tên học phần (trong khoa phụ trách) → tiền tố mã môn.
              Rà soát, đổi bộ môn nếu cần rồi bấm Áp dụng.
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Đóng"><X className="h-5 w-5" /></button>
        </div>

        {!items ? (
          <div className="flex items-center gap-2 p-8 text-slate-500"><Loader2 className="h-5 w-5 animate-spin" /> Đang phân tích {"…"}</div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-5 py-3 text-xs dark:border-slate-800">
              <span className={`rounded-full px-2 py-0.5 ring-1 ${TIN_CAY.cao.cls}`}>Cao {dem.cao}</span>
              <span className={`rounded-full px-2 py-0.5 ring-1 ${TIN_CAY.trung_binh.cls}`}>Trung bình {dem.trung_binh}</span>
              <span className={`rounded-full px-2 py-0.5 ring-1 ${TIN_CAY.thap.cls}`}>Thấp {dem.thap}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-500 dark:bg-slate-800">Không có gợi ý {dem.khong}</span>
              <span className="mx-1 h-4 w-px bg-slate-200 dark:bg-slate-700" />
              <button onClick={() => tickTheo(["cao"])} className="rounded-md px-2 py-1 text-teal-700 hover:bg-teal-50 dark:text-teal-300 dark:hover:bg-teal-500/10">Chỉ chọn Cao</button>
              <button onClick={() => tickTheo(["cao", "trung_binh"])} className="rounded-md px-2 py-1 text-teal-700 hover:bg-teal-50 dark:text-teal-300 dark:hover:bg-teal-500/10">Cao + Trung bình</button>
              <button onClick={() => tickTheo(["cao", "trung_binh", "thap"])} className="rounded-md px-2 py-1 text-teal-700 hover:bg-teal-50 dark:text-teal-300 dark:hover:bg-teal-500/10">Tất cả có gợi ý</button>
              <button onClick={() => tickTheo([])} className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">Bỏ chọn</button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-2">
              {items.length === 0 && <p className="p-6 text-center text-sm text-slate-500">Mọi học phần đều đã được gán bộ môn.</p>}
              {items.map((i) => {
                const tc = i.tin_cay ? TIN_CAY[i.tin_cay] : null;
                const bm = chon[i.id] ?? "";
                return (
                  <div key={i.id} className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg px-2 py-2 text-sm sm:flex-nowrap ${tick[i.id] ? "bg-teal-50/60 dark:bg-teal-500/5" : ""}`}>
                    <input
                      type="checkbox"
                      className="h-4 w-4 shrink-0 accent-teal-600"
                      checked={!!tick[i.id] && !!bm}
                      disabled={!bm}
                      onChange={(e) => setTick((t) => ({ ...t, [i.id]: e.target.checked }))}
                    />
                    <div className="min-w-0 flex-1 basis-48">
                      <div className="truncate"><span className="font-mono text-xs text-slate-500">{i.ma_mon}</span> <span className="font-medium">{i.ten_mon ?? "—"}</span></div>
                      <div className="truncate text-[11px] text-slate-400">
                        {i.nguon ? <>Nguồn: {i.nguon}</> : <span className="text-amber-600 dark:text-amber-400">{i.ly_do}</span>}
                        {i.khoa && <> · {i.khoa} (theo {i.nguon_khoa})</>}
                      </div>
                    </div>
                    {tc ? (
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ring-1 ${tc.cls}`}>{tc.label}</span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500 dark:bg-slate-800">—</span>
                    )}
                    <select
                      value={bm}
                      onChange={(e) => {
                        const v = e.target.value;
                        setChon((c) => ({ ...c, [i.id]: v }));
                        setTick((t) => ({ ...t, [i.id]: !!v }));
                      }}
                      className="w-full shrink-0 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs sm:w-72 dark:border-slate-700 dark:bg-slate-800"
                    >
                      <option value="">— Chưa chọn bộ môn —</option>
                      {boMonOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                    </select>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-5 py-3 dark:border-slate-800">
              <span className="text-sm text-slate-600 dark:text-slate-300">
                Đã chọn <b>{duocChon.length}</b> / {items.length} học phần
              </span>
              <div className="flex gap-2">
                <button onClick={onClose} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">Huỷ</button>
                <button
                  onClick={apDung}
                  disabled={saving || duocChon.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />} Áp dụng gán {duocChon.length} học phần
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BulkAssignBoMon;
