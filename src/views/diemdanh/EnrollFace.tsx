import { useEffect, useRef, useState, type FC } from "react";
import { Link } from "react-router";
import { ArrowLeft, Camera, Loader2, CheckCircle2, ShieldCheck, RotateCcw, ScanFace } from "lucide-react";
import axiosInstance from "@/infra/api/conflig/axiosInstance";
import { embed, drawThumb, buildTemplate, type FrameCapture, type PoseGroup, type QualityResult } from "@/lib/faceEngine";
import { useAuthStore, selectUser } from "@/views/pages/stores/auth_store";
import { ROLES } from "@/constants/roles";

interface Pose { name: string; hint: string; group: PoseGroup; }
const POSES: Pose[] = [
  { name: "Trực diện", hint: "Nhìn thẳng vào máy", group: "front" },
  { name: "Cúi xuống", hint: "Cúi nhẹ đầu xuống", group: "front" },
  { name: "Ngẩng lên", hint: "Ngẩng nhẹ đầu lên", group: "front" },
  { name: "Quay trái", hint: "Quay đầu sang trái", group: "left" },
  { name: "Quay phải", hint: "Quay đầu sang phải", group: "right" },
  { name: "Nghiêng cao trái", hint: "Ngẩng & nghiêng sang trái", group: "left" },
  { name: "Nghiêng cao phải", hint: "Ngẩng & nghiêng sang phải", group: "right" },
];
const CIRC = 2 * Math.PI * 54;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Phase = "consent" | "capturing" | "processing" | "done" | "error";

const EnrollFace: FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const workRef = useRef<HTMLCanvasElement | null>(null);
  const thumbRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const framesRef = useRef<FrameCapture[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Rào chắn NĐ13 — SV chỉ đăng ký khuôn mặt của CHÍNH MÌNH: khoá mã SV theo tài khoản Portal.
  const user = useAuthStore(selectUser);
  const isStudent = (user?.role as string) === ROLES.STUDENT;
  // Mã SV = student_code (Portal), fallback username. KHÔNG dùng portal_code (là portal_id nội bộ).
  const myCode =
    (user as { profile?: { student_code?: string } } | null)?.profile?.student_code
    || user?.username
    || "";

  const [phase, setPhase] = useState<Phase>("consent");
  const [maSv, setMaSv] = useState("");

  // Với SV: mã SV luôn = mã Portal của chính mình (không cho gõ tay).
  useEffect(() => { if (isStudent && myCode) setMaSv(myCode); }, [isStudent, myCode]);
  const [agree, setAgree] = useState(false);
  const [poseIdx, setPoseIdx] = useState(0);
  const [ring, setRing] = useState(0);
  const [quality, setQuality] = useState<QualityResult | null>(null);
  const [doneFlags, setDoneFlags] = useState<boolean[]>(Array(POSES.length).fill(false));
  const [result, setResult] = useState<{ dim: number; nproto: number; soAnh: number; kb: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };
  useEffect(() => () => stopCamera(), []);

  const start = async () => {
    if (isStudent && myCode.trim().length < 3) { setError("Tài khoản chưa gắn mã sinh viên Portal — liên hệ giáo vụ."); return; }
    if (maSv.trim().length < 3) { setError("Nhập mã sinh viên hợp lệ."); return; }
    if (!agree) { setError("Cần đồng ý xử lý dữ liệu sinh trắc (NĐ13)."); return; }
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) { setError("Trình duyệt không hỗ trợ camera."); setPhase("error"); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 640 }, audio: false });
      streamRef.current = stream;
      const v = videoRef.current!;
      v.srcObject = stream;
      await v.play();
      await runEnroll();
    } catch {
      setError("Không truy cập được camera. Kiểm tra quyền camera của trình duyệt.");
      setPhase("error");
    }
  };

  const runEnroll = async () => {
    framesRef.current = [];
    setDoneFlags(Array(POSES.length).fill(false));
    setPhase("capturing");
    const v = videoRef.current!, work = workRef.current!;

    for (let i = 0; i < POSES.length; i++) {
      setPoseIdx(i); setRing(0);
      const pose = POSES[i];
      const t0 = performance.now(), dur = 1500;
      while (performance.now() - t0 < dur) {
        const e = embed(v, work);
        if (e) {
          framesRef.current.push({ vec: e.vec, group: pose.group, quality: e.quality });
          setQuality(e.quality);
        }
        const th = thumbRefs.current[i];
        if (th) drawThumb(v, th);
        setRing(Math.min(1, (performance.now() - t0) / dur));
        await sleep(200);
      }
      setRing(1);
      setDoneFlags((prev) => { const n = [...prev]; n[i] = true; return n; });
      await sleep(280);
    }
    finish();
  };

  const finish = () => {
    setPhase("processing");
    const tpl = buildTemplate(framesRef.current);
    stopCamera();
    if (!tpl) {
      setError("Chất lượng khung chưa đạt (ánh sáng/độ nét). Vui lòng thử lại nơi đủ sáng, giữ máy chắc.");
      setPhase("error");
      return;
    }
    const nproto = tpl.prototypes.length;
    const kb = (((1 + nproto) * tpl.dim * 2) / 1024).toFixed(1); // float16 = 2 byte/chiều
    axiosInstance
      .post("/diem-danh/khuon-mat/enroll", {
        ma_sinh_vien: maSv.trim(),
        dim: tpl.dim,
        embedding: tpl.embedding,
        prototypes: tpl.prototypes,
        so_anh: tpl.soAnh,
        nguon: "tu_thu_thap",
        dong_y_nd13: true,
      })
      .then(() => { setResult({ dim: tpl.dim, nproto, soAnh: tpl.soAnh, kb }); setPhase("done"); })
      .catch((e) => { setError(e?.response?.data?.message ?? "Không gửi được dữ liệu enroll (cần quyền GV/Khoa/Trường/Admin)."); setPhase("error"); });
  };

  const reset = () => {
    stopCamera(); framesRef.current = [];
    setPhase("consent"); setRing(0); setQuality(null); setResult(null); setError(null);
    setDoneFlags(Array(POSES.length).fill(false)); setPoseIdx(0);
  };

  const qc = (label: string, on: boolean | undefined) => (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${on ? "bg-emerald-400 text-emerald-950" : "bg-white/10 text-white/60"}`}>{label}</span>
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-5 flex items-center gap-3">
        <Link to="/diem-danh" className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"><ArrowLeft className="h-4 w-4" /></Link>
        <div>
          <h1 className="flex items-center gap-2 text-lg font-bold"><ScanFace className="h-5 w-5 text-teal-600" /> Đăng ký khuôn mặt</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Quét 7 góc · xử lý ngay trên máy · chỉ gửi vector, không gửi ảnh.</p>
        </div>
      </div>

      {error && phase !== "error" && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">{error}</div>}

      {/* Sân quay */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0A1420] shadow-xl" style={{ aspectRatio: "3 / 4" }}>
        <video ref={videoRef} playsInline muted className="absolute inset-0 h-full w-full object-cover" style={{ transform: "scaleX(-1)", opacity: phase === "capturing" ? 0.92 : 0.3 }} />
        <canvas ref={workRef} className="hidden" />

        {/* Vòng hướng + tiến trình */}
        {phase === "capturing" && (
          <>
            <svg viewBox="0 0 120 120" className="absolute left-1/2 top-[38%] w-[62%] max-w-[240px] -translate-x-1/2 -translate-y-1/2">
              <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="4" />
              <circle cx="60" cy="60" r="54" fill="none" stroke="#37e0a0" strokeWidth="4" strokeLinecap="round"
                strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - ring)} transform="rotate(-90 60 60)" style={{ filter: "drop-shadow(0 0 5px rgba(55,224,160,.7))" }} />
              <ellipse cx="60" cy="62" rx="30" ry="40" fill="none" stroke="rgba(120,214,222,.5)" strokeWidth="2" strokeDasharray="5 7" />
            </svg>
            <div className="absolute inset-x-0 top-[70%] text-center text-white">
              <div className="text-base font-bold">{POSES[poseIdx].name}</div>
              <div className="text-xs text-white/60">{POSES[poseIdx].hint}</div>
            </div>
            <div className="absolute inset-x-0 top-[80%] flex flex-wrap justify-center gap-1.5 px-4">
              {qc("Ánh sáng", quality ? quality.brightness > 0.22 && quality.brightness < 0.95 : false)}
              {qc("Độ nét", quality ? quality.sharpness > 0.06 : false)}
              {qc("Khung đạt", quality?.ok)}
            </div>
          </>
        )}

        {/* Lớp phủ đồng ý */}
        {phase === "consent" && (
          <div className="absolute inset-0 flex flex-col justify-center gap-3 bg-[#0A1420]/95 p-6 text-white">
            <div className="flex items-center gap-2 text-teal-300"><ShieldCheck className="h-5 w-5" /><span className="text-xs font-semibold uppercase tracking-wider">Đồng ý xử lý dữ liệu (NĐ13)</span></div>
            <h2 className="text-lg font-extrabold">Đăng ký khuôn mặt để điểm danh</h2>
            <ul className="space-y-1.5 text-sm text-white/80">
              <li>• Xử lý <b>ngay trên thiết bị</b> — ảnh không rời máy.</li>
              <li>• Chỉ lưu <b>vector đặc trưng</b>, không lưu ảnh gốc.</li>
              <li>• Có quyền <b>xoá</b> bất cứ lúc nào.</li>
            </ul>
            {isStudent ? (
              <div className="mt-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white/90">
                Mã SV: <b>{myCode || "(chưa gắn mã Portal)"}</b>
                <span className="mt-0.5 block text-[11px] text-white/50">Khoá theo tài khoản đăng nhập — bạn chỉ đăng ký khuôn mặt của chính mình.</span>
              </div>
            ) : (
              <input value={maSv} onChange={(e) => setMaSv(e.target.value)} placeholder="Mã sinh viên (VD: K205480106xxx)"
                className="mt-1 rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-sm text-white placeholder-white/40 outline-none focus:border-teal-400" />
            )}
            <label className="flex items-start gap-2 text-xs text-white/80">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 accent-teal-400" />
              Tôi đồng ý cho xử lý dữ liệu sinh trắc khuôn mặt phục vụ điểm danh học phần.
            </label>
            {error && <div className="rounded-lg bg-rose-500/20 px-3 py-2 text-xs text-rose-200">{error}</div>}
            <button onClick={start} className="mt-1 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-bold text-emerald-950 active:translate-y-px">Đồng ý &amp; bắt đầu quét</button>
          </div>
        )}

        {phase === "processing" && (
          <div className="absolute inset-0 grid place-items-center bg-[#0A1420]/90 text-white">
            <div className="text-center">
              <Loader2 className="mx-auto h-7 w-7 animate-spin text-emerald-400" />
              <p className="mt-3 text-sm">Lọc chất lượng · khử trùng lặp · gộp vector…</p>
            </div>
          </div>
        )}

        {phase === "done" && result && (
          <div className="absolute inset-0 flex flex-col justify-center gap-3 bg-[#0A1420]/96 p-6 text-white">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            <h2 className="text-lg font-extrabold">Đã tạo mẫu khuôn mặt</h2>
            <p className="text-sm text-white/75">Mã SV <b>{maSv}</b> · {result.soAnh} khung · 1 template + {result.nproto} prototype.</p>
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-2xl font-extrabold text-emerald-400">≈ {result.kb} KB</span>
              <span className="text-xs text-white/50">{result.dim}-D · float16 · đã gửi vector</span>
            </div>
            <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold">
              <span className="rounded-full bg-emerald-400 px-2.5 py-0.5 text-emerald-950">✓ Ảnh không rời máy</span>
              <span className="rounded-full bg-emerald-400 px-2.5 py-0.5 text-emerald-950">✓ On-device</span>
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-white/80">NĐ13 · đã đồng ý</span>
            </div>
            <button onClick={reset} className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white"><RotateCcw className="h-4 w-4" /> Đăng ký người khác</button>
          </div>
        )}

        {phase === "error" && (
          <div className="absolute inset-0 flex flex-col justify-center gap-3 bg-[#0A1420]/95 p-6 text-center text-white">
            <Camera className="mx-auto h-8 w-8 text-rose-400" />
            <p className="text-sm text-white/85">{error}</p>
            <button onClick={reset} className="mx-auto rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold">Thử lại</button>
          </div>
        )}
      </div>

      {/* Dải thumbnail 7 góc */}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {POSES.map((p, i) => (
          <div key={i} className={`relative rounded-lg border p-0.5 ${doneFlags[i] ? "border-emerald-400" : poseIdx === i && phase === "capturing" ? "border-slate-400" : "border-slate-200 dark:border-slate-700"}`} title={p.name}>
            <canvas ref={(el) => { thumbRefs.current[i] = el; }} width={40} height={52} className="block rounded bg-slate-900/80" />
            {doneFlags[i] && <span className="absolute -right-1.5 -top-1.5 grid h-4 w-4 place-items-center rounded-full bg-emerald-400 text-[9px] font-bold text-emerald-950">✓</span>}
          </div>
        ))}
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        Bản triển khai on-device. Phần trích đặc trưng hiện dùng model DEV; thay bằng model ArcFace/MobileFaceNet ONNX ở <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">src/lib/faceEngine.ts</code> để đạt độ chính xác production.
      </p>
    </div>
  );
};

export default EnrollFace;
