import { useEffect, useRef, useState, type FC } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Smartphone, Loader2, CheckCircle2, ScanLine } from "lucide-react";
import axiosInstance from "@/infra/api/conflig/axiosInstance";
import { embed } from "@/lib/faceEngine";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Phase = "ready" | "scanning" | "sending" | "done" | "error";
interface Matched { ma_sinh_vien: string; ho_ten?: string | null; do_tin_cay: number }

const QuetDienThoai: FC = () => {
  const { buoiId } = useParams<{ buoiId: string }>();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const workRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [phase, setPhase] = useState<Phase>("ready");
  const [progress, setProgress] = useState(0);
  const [matched, setMatched] = useState<Matched[]>([]);
  const [summary, setSummary] = useState<{ khop: number; query: number; coMat: number; tong: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stopCamera = () => { streamRef.current?.getTracks().forEach((t) => t.stop()); streamRef.current = null; };
  useEffect(() => () => stopCamera(), []);

  const scan = async () => {
    setError(null); setMatched([]); setSummary(null);
    if (!navigator.mediaDevices?.getUserMedia) { setError("Trình duyệt không hỗ trợ camera."); setPhase("error"); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: 640, height: 640 }, audio: false });
      streamRef.current = stream;
      const v = videoRef.current!; v.srcObject = stream; await v.play();
      setPhase("scanning"); setProgress(0);

      const work = workRef.current!;
      const embeddings: number[][] = [];
      const t0 = performance.now(), dur = 4000;
      while (performance.now() - t0 < dur) {
        const e = await embed(v, work);
        if (e && e.quality.ok) embeddings.push(Array.from(e.vec));
        setProgress(Math.min(1, (performance.now() - t0) / dur));
        await sleep(280); // suy luận ONNX nặng hơn DEV → giãn nhịp
      }
      stopCamera();

      if (embeddings.length === 0) { setError("Không bắt được khung mặt rõ. Thử lại nơi đủ sáng, đưa camera về phía sinh viên."); setPhase("error"); return; }

      setPhase("sending");
      const res = await axiosInstance.post(`/diem-danh/buoi/${buoiId}/quet`, { embeddings });
      const kq = res.data?.data?.ket_qua; const bang = res.data?.data?.bang?.buoi;
      setMatched(kq?.khop ?? []);
      setSummary({ khop: kq?.so_khop ?? 0, query: kq?.so_query ?? embeddings.length, coMat: (bang?.so_co_mat ?? 0) + (bang?.so_muon ?? 0), tong: bang?.tong_sv ?? 0 });
      setPhase("done");
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? "Không quét/điểm danh được. Kiểm tra quyền camera hoặc buổi đã đóng.");
      setPhase("error");
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <div className="mb-5 flex items-center gap-3">
        <Link to="/diem-danh" className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"><ArrowLeft className="h-4 w-4" /></Link>
        <div>
          <h1 className="flex items-center gap-2 text-lg font-bold"><Smartphone className="h-5 w-5 text-teal-600" /> Điểm danh bằng điện thoại</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Dự phòng khi camera cố định/điện hỏng · quét mặt SV để điểm danh · ảnh không rời máy.</p>
        </div>
      </div>

      {error && phase !== "error" && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">{error}</div>}

      <div className="relative overflow-hidden rounded-3xl bg-[#0A1420] shadow-xl" style={{ aspectRatio: "3 / 4" }}>
        <video ref={videoRef} playsInline muted className="absolute inset-0 h-full w-full object-cover" style={{ opacity: phase === "scanning" ? 0.95 : 0.25 }} />
        <canvas ref={workRef} className="hidden" />

        {phase === "scanning" && (
          <div className="absolute inset-0">
            <div className="absolute inset-x-8 top-1/2 h-0.5 -translate-y-1/2 bg-emerald-400 shadow-[0_0_12px_#37e0a0]" />
            <div className="absolute inset-x-0 bottom-16 text-center text-white">
              <ScanLine className="mx-auto h-6 w-6 text-emerald-400" />
              <div className="mt-1 text-sm font-semibold">Đang quét lớp… {Math.round(progress * 100)}%</div>
              <div className="text-xs text-white/60">Đưa camera lướt qua các khuôn mặt</div>
            </div>
          </div>
        )}

        {phase === "ready" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center text-white">
            <Smartphone className="h-10 w-10 text-emerald-400" />
            <p className="text-sm text-white/80">Hướng camera điện thoại về phía sinh viên, bấm quét ~4 giây. Hệ sẽ đối chiếu với khuôn mặt đã đăng ký của lớp và điểm danh những em nhận ra.</p>
            <button onClick={scan} className="rounded-xl bg-emerald-400 px-5 py-3 text-sm font-bold text-emerald-950 active:translate-y-px">Bắt đầu quét</button>
          </div>
        )}

        {phase === "sending" && (
          <div className="absolute inset-0 grid place-items-center bg-[#0A1420]/90 text-white">
            <div className="text-center"><Loader2 className="mx-auto h-7 w-7 animate-spin text-emerald-400" /><p className="mt-3 text-sm">Đối chiếu &amp; điểm danh…</p></div>
          </div>
        )}

        {phase === "done" && summary && (
          <div className="absolute inset-0 flex flex-col justify-center gap-3 bg-[#0A1420]/96 p-6 text-white">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            <h2 className="text-lg font-extrabold">Đã điểm danh {summary.khop} em qua quét</h2>
            <p className="text-sm text-white/75">Lớp hiện có mặt {summary.coMat}/{summary.tong}. (Quét {summary.query} khung)</p>
            <div className="max-h-40 space-y-1 overflow-y-auto">
              {matched.map((m) => (
                <div key={m.ma_sinh_vien} className="flex items-center justify-between rounded-lg bg-white/8 px-3 py-1.5 text-sm">
                  <span>{m.ho_ten ?? m.ma_sinh_vien} <span className="text-white/50">· {m.ma_sinh_vien}</span></span>
                  <span className="text-emerald-300">{Math.round(m.do_tin_cay * 100)}%</span>
                </div>
              ))}
              {matched.length === 0 && <p className="text-sm text-white/60">Chưa khớp được em nào — thử lại gần hơn / đủ sáng.</p>}
            </div>
            <div className="flex gap-2">
              <button onClick={scan} className="flex-1 rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-bold text-emerald-950">Quét tiếp</button>
              <Link to="/diem-danh" className="flex-1 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-center text-sm font-semibold text-white">Xong</Link>
            </div>
          </div>
        )}

        {phase === "error" && (
          <div className="absolute inset-0 flex flex-col justify-center gap-3 bg-[#0A1420]/95 p-6 text-center text-white">
            <Smartphone className="mx-auto h-8 w-8 text-rose-400" />
            <p className="text-sm text-white/85">{error}</p>
            <button onClick={() => setPhase("ready")} className="mx-auto rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold">Thử lại</button>
          </div>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        Nhận diện dùng model DEV nên độ chính xác còn thấp — gắn model ONNX (xem hướng dẫn tích hợp) để chính xác thật. Kết quả quét vẫn cho phép giảng viên chỉnh tay ở bảng điểm danh.
      </p>
    </div>
  );
};

export default QuetDienThoai;
