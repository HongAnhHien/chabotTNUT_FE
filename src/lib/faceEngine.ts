// faceEngine — xử lý khuôn mặt NGAY TRÊN THIẾT BỊ cho enroll điểm danh (ĐH07).
// Ảnh không rời máy: chỉ trích ra vector đặc trưng (embedding) rồi gửi lên server.
//
// Phần trích embedding hiện là DEV MODEL (descriptor xác định từ điểm ảnh) để
// toàn bộ luồng chạy & gửi vector thật ngay hôm nay. Khi có model on-device
// (MediaPipe căn chỉnh + ArcFace/MobileFaceNet ONNX 512-D) thì thay đúng 1 hàm
// `embed()` bên dưới — phần còn lại (thu, chất lượng, gộp, gửi) giữ nguyên.

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

export function embed(video: HTMLVideoElement, canvas: HTMLCanvasElement): { vec: Float32Array; quality: QualityResult } | null {
  const g = grabGray(video, canvas, 64);
  if (!g) return null;
  const quality = assessQuality(g.gray, g.w, g.w);
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
