import { type FC, useEffect, useMemo, useRef, useState } from "react";
import { compile, type MathFn } from "@/lib/mathExpr";

/**
 * Vẽ đồ thị hàm số từ khối ```plot```. Cú pháp trong khối:
 *   y = x^2 - 2          (nhiều dòng y= để vẽ nhiều hàm)
 *   f(x) = sin(x)        (chấp nhận "f(x) =" hoặc "y =" hoặc chỉ biểu thức)
 *   x: -5..5             (miền x, tuỳ chọn — mặc định -10..10)
 *   tangent: 1           (vẽ tiếp tuyến của hàm đầu tại x0, có thanh trượt)
 */

const COLORS = ["#2563eb", "#059669", "#d97706", "#9333ea", "#dc2626"];

interface Curve {
  expr: string;
  fn: MathFn;
  color: string;
}
interface Spec {
  curves: Curve[];
  domain: [number, number];
  tangent: number | null;
  error: string | null;
}

function parseSpec(src: string): Spec {
  const lines = src.split("\n").map((l) => l.trim()).filter(Boolean);
  const curves: Curve[] = [];
  let domain: [number, number] = [-10, 10];
  let tangent: number | null = null;
  let error: string | null = null;
  let ci = 0;

  for (const line of lines) {
    const low = line.toLowerCase();
    const mDom = low.match(/^x\s*:\s*(-?[\d.]+)\s*\.\.\s*(-?[\d.]+)/);
    if (mDom) {
      const a = Number(mDom[1]);
      const b = Number(mDom[2]);
      if (isFinite(a) && isFinite(b) && a < b) domain = [a, b];
      continue;
    }
    const mTan = low.match(/^tangent\s*:\s*(-?[\d.]+)/);
    if (mTan) {
      const t = Number(mTan[1]);
      if (isFinite(t)) tangent = t;
      continue;
    }
    // biểu thức: bỏ tiền tố "y =" / "f(x) ="
    const expr = line.replace(/^[a-zA-Z]+\s*(\([^)]*\))?\s*=\s*/, "").trim();
    if (!expr) continue;
    try {
      curves.push({ expr, fn: compile(expr), color: COLORS[ci % COLORS.length] });
      ci++;
    } catch (e) {
      error = e instanceof Error ? e.message : "Biểu thức không hợp lệ.";
    }
  }

  if (curves.length === 0 && !error) error = "Chưa có hàm số để vẽ.";
  return { curves, domain, tangent, error };
}

// Phạm vi y tự động, bỏ đuôi cực trị (tiệm cận) để đồ thị không bị dẹt.
function autoYRange(curves: Curve[], [a, b]: [number, number]): [number, number] {
  const ys: number[] = [];
  const N = 400;
  for (const c of curves) {
    for (let i = 0; i <= N; i++) {
      const x = a + ((b - a) * i) / N;
      const y = c.fn(x);
      if (isFinite(y)) ys.push(y);
    }
  }
  if (ys.length === 0) return [-10, 10];
  ys.sort((p, q) => p - q);
  const lo = ys[Math.floor(ys.length * 0.02)];
  const hi = ys[Math.floor(ys.length * 0.98)];
  let min = Math.min(lo, 0);
  let max = Math.max(hi, 0);
  if (min === max) { min -= 1; max += 1; }
  const pad = (max - min) * 0.1;
  return [min - pad, max + pad];
}

const FunctionPlot: FC<{ source: string }> = ({ source }) => {
  const spec = useMemo(() => parseSpec(source), [source]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [tanX, setTanX] = useState<number | null>(spec.tangent);

  useEffect(() => { setTanX(spec.tangent); }, [spec.tangent]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(Math.max(280, Math.floor(w)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const tanInfo = useMemo(() => {
    if (tanX == null || spec.curves.length === 0) return null;
    const f = spec.curves[0].fn;
    const h = 1e-4;
    const y0 = f(tanX);
    const slope = (f(tanX + h) - f(tanX - h)) / (2 * h);
    if (!isFinite(y0) || !isFinite(slope)) return null;
    return { x0: tanX, y0, slope };
  }, [tanX, spec.curves]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const height = 300;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const [xa, xb] = spec.domain;
    const [ya, yb] = autoYRange(spec.curves, spec.domain);
    const pad = 8;
    const X = (x: number) => pad + ((x - xa) / (xb - xa)) * (width - 2 * pad);
    const Y = (y: number) => height - pad - ((y - ya) / (yb - ya)) * (height - 2 * pad);

    // lưới
    ctx.strokeStyle = "rgba(37,99,235,0.08)";
    ctx.lineWidth = 1;
    ctx.font = "10px system-ui, sans-serif";
    ctx.fillStyle = "#94a3b8";
    const niceStep = (range: number) => {
      const raw = range / 8;
      const p = Math.pow(10, Math.floor(Math.log10(raw)));
      const n = raw / p;
      return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * p;
    };
    const sx = niceStep(xb - xa);
    for (let x = Math.ceil(xa / sx) * sx; x <= xb; x += sx) {
      ctx.beginPath(); ctx.moveTo(X(x), pad); ctx.lineTo(X(x), height - pad); ctx.stroke();
      if (Math.abs(x) > 1e-9) ctx.fillText(String(+x.toFixed(2)), X(x) + 2, Y(0) - 3 > height - 4 ? height - 4 : Y(0) - 3);
    }
    const sy = niceStep(yb - ya);
    for (let y = Math.ceil(ya / sy) * sy; y <= yb; y += sy) {
      ctx.beginPath(); ctx.moveTo(pad, Y(y)); ctx.lineTo(width - pad, Y(y)); ctx.stroke();
      if (Math.abs(y) > 1e-9) ctx.fillText(String(+y.toFixed(2)), X(0) + 3 < 4 ? 4 : X(0) + 3, Y(y) - 2);
    }

    // trục
    ctx.strokeStyle = "rgba(15,23,42,0.35)";
    ctx.lineWidth = 1.2;
    if (ya <= 0 && yb >= 0) { ctx.beginPath(); ctx.moveTo(pad, Y(0)); ctx.lineTo(width - pad, Y(0)); ctx.stroke(); }
    if (xa <= 0 && xb >= 0) { ctx.beginPath(); ctx.moveTo(X(0), pad); ctx.lineTo(X(0), height - pad); ctx.stroke(); }

    // đường cong
    const N = Math.max(400, width);
    for (const c of spec.curves) {
      ctx.strokeStyle = c.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      let started = false;
      let prevY = NaN;
      for (let i = 0; i <= N; i++) {
        const x = xa + ((xb - xa) * i) / N;
        const y = c.fn(x);
        if (!isFinite(y) || y < ya - (yb - ya) || y > yb + (yb - ya)) { started = false; continue; }
        const px = X(x), py = Y(y);
        if (!started || Math.abs(y - prevY) > (yb - ya)) { ctx.moveTo(px, py); started = true; }
        else ctx.lineTo(px, py);
        prevY = y;
      }
      ctx.stroke();
    }

    // tiếp tuyến
    if (tanInfo) {
      const { x0, y0, slope } = tanInfo;
      const tanY = (x: number) => y0 + slope * (x - x0);
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(X(xa), Y(tanY(xa)));
      ctx.lineTo(X(xb), Y(tanY(xb)));
      ctx.stroke();
      ctx.setLineDash([]);
      // điểm tiếp xúc
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.arc(X(x0), Y(y0), 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [spec, width, tanInfo]);

  if (spec.error && spec.curves.length === 0) {
    return (
      <div style={{ margin: "8px 0", padding: "10px 12px", borderRadius: 10, background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.2)", color: "#b91c1c", fontSize: "0.8rem" }}>
        Không vẽ được đồ thị: {spec.error}
      </div>
    );
  }

  return (
    <div ref={wrapRef} style={{ margin: "10px 0", padding: 12, borderRadius: 12, background: "white", border: "1px solid rgba(37,99,235,0.15)", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", marginBottom: 8, fontSize: "0.76rem" }}>
        {spec.curves.map((c, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#334155" }}>
            <span style={{ width: 14, height: 3, borderRadius: 2, background: c.color, display: "inline-block" }} />
            y = {c.expr}
          </span>
        ))}
      </div>
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", borderRadius: 8 }} />
      {tanInfo && spec.tangent != null && (
        <div style={{ marginTop: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.76rem", color: "#334155", flexWrap: "wrap" }}>
            <span style={{ fontWeight: 600, color: "#d97706" }}>Tiếp tuyến tại x₀ = {(+tanInfo.x0.toFixed(2))}</span>
            <span style={{ fontFamily: "monospace" }}>
              y = {(+tanInfo.slope.toFixed(3))}·(x − {(+tanInfo.x0.toFixed(2))}) + {(+tanInfo.y0.toFixed(3))}
            </span>
          </div>
          <input
            type="range"
            min={spec.domain[0]}
            max={spec.domain[1]}
            step={(spec.domain[1] - spec.domain[0]) / 200}
            value={tanX ?? spec.domain[0]}
            onChange={(e) => setTanX(Number(e.target.value))}
            style={{ width: "100%", marginTop: 6, accentColor: "#f59e0b" }}
            aria-label="Trượt điểm tiếp xúc"
          />
        </div>
      )}
    </div>
  );
};

export default FunctionPlot;
