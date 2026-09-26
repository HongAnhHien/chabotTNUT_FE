// faceEngine — xử lý khuôn mặt NGAY TRÊN THIẾT BỊ cho enroll điểm danh (ĐH07).
// Ảnh không rời máy: chỉ trích ra vector đặc trưng (embedding) rồi gửi lên server.
//
// `embed()` đã nối MODEL THẬT: MediaPipe FaceLandmarker căn chỉnh 112×112 +
// MobileFaceNet/ArcFace ONNX 512-D (on-device). Khi CHƯA có file model trong
// public/models/ thì tự động dùng model DEV (descriptor điểm ảnh) để app không
// vỡ — thả file model vào là tự chuyển sang nhận diện thật. Phần còn lại (thu,
// chất lượng, gộp, gửi) giữ nguyên.

import * as ort from "onnxruntime-web/wasm"; // chỉ backend WASM (~11MB thay vì bản WebGPU ~28MB)
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

export const FACE_DIM = 512;

export type PoseGroup = 'front' | 'left' | 'right';

export interface FrameCapture {
  vec: Float32Array;
  group: PoseGroup;
  quality: QualityResult;
}

export interface QualityResult {
  brightness: number; // 0..1
  sharpness: number;  // 0..1 (variance Laplacian đã chuẩn hoá)
  ok: boolean;
}

export interface FaceTemplate {
  dim: number;
  embedding: number[];     // template gộp (L2-normalized)
  prototypes: number[][];  // [nghiêng trái, nghiêng phải] nếu đủ dữ liệu
  soAnh: number;           // số khung dùng để dựng
}

// ── Toán vector ──────────────────────────────────────────────────────────
export function l2normalize(v: Float32Array): Float32Array {
  let s = 0;
  for (let i = 0; i < v.length; i++) s += v[i] * v[i];
  const n = Math.sqrt(s) || 1;
  const out = new Float32Array(v.length);
  for (let i = 0; i < v.length; i++) out[i] = v[i] / n;
  return out;
}

export function cosine(a: Float32Array, b: Float32Array): number {
  let d = 0;
  for (let i = 0; i < a.length; i++) d += a[i] * b[i];
  return d; // đã L2-normalize nên tích vô hướng = cosine
}

function meanNormalize(list: Float32Array[]): Float32Array {
  const dim = list[0]?.length ?? FACE_DIM;
  const m = new Float32Array(dim);
  for (const v of list) for (let i = 0; i < dim; i++) m[i] += v[i];
  for (let i = 0; i < dim; i++) m[i] /= list.length || 1;
  return l2normalize(m);
}

// ── Chất lượng khung (ánh sáng + độ nét) ─────────────────────────────────
export function assessQuality(gray: Float32Array, w: number, h: number): QualityResult {
  let sum = 0;
  for (let i = 0; i < gray.length; i++) sum += gray[i];
  const mean = sum / gray.length;              // 0..1
  // Độ nét: phương sai Laplacian (gần đúng bằng gradient bậc 2).
  let lapSum = 0, lapSq = 0, n = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const lap = 4 * gray[i] - gray[i - 1] - gray[i + 1] - gray[i - w] - gray[i + w];
      lapSum += lap; lapSq += lap * lap; n++;
    }
  }
  const varLap = n > 0 ? lapSq / n - (lapSum / n) ** 2 : 0;
  const sharpness = Math.min(1, varLap * 60);  // hệ số kinh nghiệm
  const brightness = mean;
  const ok = brightness > 0.22 && brightness < 0.95 && sharpness > 0.06;
  return { brightness, sharpness, ok };
}

// ── Trích khung xám vuông giữa (nơi cắm căn chỉnh khuôn mặt thật) ─────────
function grabGray(video: HTMLVideoElement, canvas: HTMLCanvasElement, size: number): { gray: Float32Array; w: number } | null {
  const vw = video.videoWidth, vh = video.videoHeight;
  if (!vw || !vh) return null;
  const side = Math.min(vw, vh);
  const sx = (vw - side) / 2, sy = (vh - side) / 2;
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(video, sx, sy, side, side, 0, 0, size, size);
  const img = ctx.getImageData(0, 0, size, size).data;
  const gray = new Float32Array(size * size);
  for (let p = 0, g = 0; p < img.length; p += 4, g++) {
    gray[g] = (0.299 * img[p] + 0.587 * img[p + 1] + 0.114 * img[p + 2]) / 255;
  }
  return { gray, w: size };
}

// ── EMBED (DEV) — descriptor 512-D xác định từ điểm ảnh ───────────────────
// TODO(model thật): thay bằng suy luận ONNX ArcFace/MobileFaceNet trên crop đã
// căn chỉnh 5 điểm mốc. Giữ nguyên chữ ký (video, canvas) → không đụng UI.
function embedDev(gray: Float32Array, w: number): Float32Array {
  // gray là ảnh vuông w×w (w=64). Gộp khối 8×8 → lưới thô, rồi trải thành 512.
  const blk = 8, gw = Math.floor(w / blk); // 8
  const coarse = new Float32Array(gw * gw); // 64
  for (let by = 0; by < gw; by++) {
    for (let bx = 0; bx < gw; bx++) {
      let s = 0;
      for (let y = 0; y < blk; y++) for (let x = 0; x < blk; x++) s += gray[(by * blk + y) * w + (bx * blk + x)];
      coarse[by * gw + bx] = s / (blk * blk);
    }
  }
  // Trải 64 giá trị + gradient lân cận thành 512 chiều (đặc trưng cấu trúc thô).
  const out = new Float32Array(FACE_DIM);
  for (let i = 0; i < FACE_DIM; i++) {
    const a = coarse[i % coarse.length];
    const b = coarse[(i * 7 + 3) % coarse.length];
    const c = coarse[(i * 13 + 5) % coarse.length];
    out[i] = a - b + 0.5 * (a - c);
  }
  // Chuẩn hoá kỳ vọng 0 rồi L2.
  let mean = 0; for (let i = 0; i < out.length; i++) mean += out[i]; mean /= out.length;
  for (let i = 0; i < out.length; i++) out[i] -= mean;
  return l2normalize(out);
}

// ── MODEL THẬT: căn chỉnh (MediaPipe) + embedding ONNX 512-D ──────────────
// Thả file vào (không commit nếu license không cho phát tán):
//   public/models/face_embedding.onnx   — MobileFaceNet/ArcFace 512-D, input 112×112
//   public/models/face_landmarker.task   — MediaPipe FaceLandmarker
//   public/mediapipe/wasm/…              — copy từ node_modules/@mediapipe/tasks-vision/wasm
const EMBED_URL = "/models/face_embedding.onnx";
const LANDMARKER_URL = "/models/face_landmarker.task";
const MP_WASM = "/mediapipe/wasm"; // self-host (khỏi phụ thuộc CDN, chạy offline)

// 5 điểm mốc từ FaceLandmarker 468 (mắt trái · mắt phải · mũi · mép trái · mép phải).
// ⚠️ Kiểm chứng lại thứ tự trên dữ liệu thật TNUT trước khi nghiệm thu.
const LM_IDX = [33, 263, 1, 61, 291] as const;
// Template 5 điểm chuẩn ArcFace cho ảnh 112×112.
const ARC_REF: [number, number][] = [
  [38.2946, 51.6963], [73.5318, 51.5014], [56.0252, 71.7366], [41.5493, 92.3655], [70.7299, 92.2041],
];

let session: ort.InferenceSession | null = null;
let landmarker: FaceLandmarker | null = null;
let realReady: Promise<boolean> | null = null;
let alignCanvas: HTMLCanvasElement | null = null;

/** Nạp model thật 1 lần. Thiếu file/không nạp được → false (dùng DEV), không thử lại liên tục. */
function ensureReal(): Promise<boolean> {
  if (!realReady) {
    realReady = (async () => {
      try {
        session = await ort.InferenceSession.create(EMBED_URL, { executionProviders: ["wasm"] });
        const vision = await FilesetResolver.forVisionTasks(MP_WASM);
        landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: LANDMARKER_URL },
          runningMode: "VIDEO",
          numFaces: 1,
        });
        console.info("[faceEngine] Model ONNX + FaceLandmarker sẵn sàng → nhận diện THẬT.");
        return true;
      } catch (e) {
        console.warn("[faceEngine] Chưa có model thật, tạm dùng model DEV. Thả file vào public/models/. Chi tiết:", e);
        session = null; landmarker = null;
        return false;
      }
    })();
  }
  return realReady;
}

/** Trạng thái cho UI (đã sẵn sàng model thật hay đang chạy DEV). */
export function faceModelReady(): Promise<boolean> { return ensureReal(); }

/** 5 điểm mốc theo pixel trong hệ toạ độ video, hoặc null nếu không thấy mặt. */
function detectLandmarks(video: HTMLVideoElement): [number, number][] | null {
  if (!landmarker) return null;
  const res = landmarker.detectForVideo(video, performance.now());
  const f = res.faceLandmarks?.[0];
  if (!f) return null;
  const vw = video.videoWidth, vh = video.videoHeight;
  return LM_IDX.map((idx) => [f[idx].x * vw, f[idx].y * vh] as [number, number]);
}

/** Ước lượng phép biến đổi tương tự (xoay+co giãn+dịch) src→dst theo bình phương tối thiểu. */
function estimateSimilarity(src: [number, number][], dst: [number, number][]) {
  const n = src.length;
  let mx = 0, my = 0, Mx = 0, My = 0;
  for (let i = 0; i < n; i++) { mx += src[i][0]; my += src[i][1]; Mx += dst[i][0]; My += dst[i][1]; }
  mx /= n; my /= n; Mx /= n; My /= n;
  let sxx = 0, sxy = 0, d = 0;
  for (let i = 0; i < n; i++) {
    const x = src[i][0] - mx, y = src[i][1] - my;
    const X = dst[i][0] - Mx, Y = dst[i][1] - My;
    sxx += x * X + y * Y;
    sxy += x * Y - y * X;
    d += x * x + y * y;
  }
  const a = sxx / (d || 1), b = sxy / (d || 1);
  const tx = Mx - (a * mx - b * my);
  const ty = My - (b * mx + a * my);
  return { a, b, tx, ty }; // x'=a·x−b·y+tx ; y'=b·x+a·y+ty
}

/** Warp khuôn mặt về 112×112 đã align → Float32 NCHW (1,3,112,112), RGB, chuẩn hoá (x−127.5)/128. */
function alignTo112(video: HTMLVideoElement, src: [number, number][]): Float32Array {
  if (!alignCanvas) alignCanvas = document.createElement("canvas");
  const c = alignCanvas; c.width = 112; c.height = 112;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  const { a, b, tx, ty } = estimateSimilarity(src, ARC_REF);
  ctx.setTransform(a, b, -b, a, tx, ty); // similarity: khớp 5 điểm về ARC_REF
  ctx.drawImage(video, 0, 0);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const px = ctx.getImageData(0, 0, 112, 112).data;
  const area = 112 * 112;
  const out = new Float32Array(3 * area);
  for (let i = 0, p = 0; i < area; i++, p += 4) {
    out[i] = (px[p] - 127.5) / 128;             // R
    out[area + i] = (px[p + 1] - 127.5) / 128;  // G
    out[2 * area + i] = (px[p + 2] - 127.5) / 128; // B
  }
  return out;
}

/** Suy luận ONNX → embedding 512-D đã L2-normalize. */
async function embedOnnx(aligned: Float32Array): Promise<Float32Array> {
  const s = session!;
  const input = new ort.Tensor("float32", aligned, [1, 3, 112, 112]);
  const res = await s.run({ [s.inputNames[0]]: input });
  const v = res[s.outputNames[0]].data as Float32Array;
  return l2normalize(v.length > FACE_DIM ? v.slice(0, FACE_DIM) : v);
}

export async function embed(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
): Promise<{ vec: Float32Array; quality: QualityResult } | null> {
  const g = grabGray(video, canvas, 64);
  if (!g) return null;
  const quality = assessQuality(g.gray, g.w, g.w);

  if (await ensureReal()) {
    try {
      const pts = detectLandmarks(video);
      if (!pts) return null; // không thấy mặt trong khung này → bỏ qua
      const aligned = alignTo112(video, pts);
      const vec = await embedOnnx(aligned);
      return { vec, quality };
    } catch (e) {
      console.warn("[faceEngine] Lỗi suy luận thật, tạm dùng DEV cho khung này:", e);
    }
  }
  return { vec: embedDev(g.gray, g.w), quality };
}

// Vẽ khung hiện tại vào canvas thumbnail (chỉ hiển thị cục bộ, không lưu/gửi).
export function drawThumb(video: HTMLVideoElement, canvas: HTMLCanvasElement): void {
  const vw = video.videoWidth, vh = video.videoHeight;
  if (!vw || !vh) return;
  const side = Math.min(vw, vh);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.save();
  ctx.translate(canvas.width, 0); ctx.scale(-1, 1); // gương cho tự nhiên
  ctx.drawImage(video, (vw - side) / 2, (vh - side) / 2, side, side, 0, 0, canvas.width, canvas.height);
  ctx.restore();
}

// ── Gộp các khung → template + 2 prototype (khử trùng lặp bằng cosine) ────
export function buildTemplate(frames: FrameCapture[]): FaceTemplate | null {
  const good = frames.filter((f) => f.quality.ok);
  if (good.length < 3) return null;

  // Khử trùng lặp: bỏ khung quá giống khung đã giữ (cosine > 0.985).
  const kept: FrameCapture[] = [];
  for (const f of good) {
    if (kept.every((k) => cosine(k.vec, f.vec) < 0.985)) kept.push(f);
  }

  const all = kept.map((f) => f.vec);
  const template = meanNormalize(all);

  const prototypes: number[][] = [];
  const left = kept.filter((f) => f.group === 'left').map((f) => f.vec);
  const right = kept.filter((f) => f.group === 'right').map((f) => f.vec);
  if (left.length >= 2) prototypes.push(Array.from(meanNormalize(left)));
  if (right.length >= 2) prototypes.push(Array.from(meanNormalize(right)));

  return {
    dim: FACE_DIM,
    embedding: Array.from(template),
    prototypes,
    soAnh: kept.length,
  };
}
