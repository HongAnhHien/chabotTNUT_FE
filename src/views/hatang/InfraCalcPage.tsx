// Phân hệ TÍNH TOÁN HẠ TẦNG & ROI (chỉ quyền quản trị).
// Đưa 2 công cụ đã thiết kế vào nền tảng:
//   Tab 1 — ROI Trợ giảng AI (pilot 300 SV + 10 GV, số thật TNUT).
//   Tab 2 — Hạ tầng PIAI 12.000 người dùng (VPS vs token AI), tái tạo báo cáo HA-TANG-VPS-PIAI-12000.
// Thuần client-side, không gọi API. Giọng: học thuật – kỹ thuật RIAT.
import { useMemo, useState, type FC, type ReactNode, type CSSProperties } from "react";
import { Link } from "react-router";
import { ArrowLeft, Calculator, Cpu, Server, Cloud, GraduationCap } from "lucide-react";

// ── Bảng màu (đồng bộ nền tảng) ──────────────────────────────────
const INK = "#0f172a", SOFT = "#64748b", FAINT = "#94a3b8", BORDER = "#e8edf3";
const ACC = "#0e7490", GOOD = "#16a34a", CRIT = "#dc2626", AMBER = "#b45309";
const CARD: CSSProperties = { background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16, padding: 18, boxShadow: "0 1px 2px rgba(15,23,42,.04)" };

// ── Tiện ích số ──────────────────────────────────────────────────
const nf = new Intl.NumberFormat("vi-VN");
function vnd(n: number): string {
  const a = Math.abs(n);
  if (a >= 1e9) return (n / 1e9).toFixed(2).replace(/\.?0+$/, "") + " tỷ";
  if (a >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + " tr";
  return nf.format(Math.round(n)) + " đ";
}
const usd = (n: number) => "$" + (n >= 100 ? Math.round(n).toLocaleString("en") : n.toFixed(1));
const PRICE = { mini: { in: 0.15, out: 0.6 }, "4o": { in: 2.5, out: 10 } } as const;
type Model = keyof typeof PRICE;

// ── Khối UI dùng lại ─────────────────────────────────────────────
const Stat: FC<{ label: string; value: ReactNode; sub?: ReactNode; color?: string }> = ({ label, value, sub, color = INK }) => (
  <div style={{ flex: "1 1 170px", minWidth: 150, ...CARD, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 2 }}>
    <div style={{ fontSize: 11.5, color: SOFT, fontWeight: 600 }}>{label}</div>
    <div style={{ fontSize: 25, fontWeight: 800, color, lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>{value}</div>
    {sub != null && <div style={{ fontSize: 11.5, color: FAINT, fontVariantNumeric: "tabular-nums" }}>{sub}</div>}
  </div>
);

const Slider: FC<{ label: string; val: number; set: (n: number) => void; min: number; max: number; step: number; fmt?: (n: number) => string }> =
  ({ label, val, set, min, max, step, fmt }) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
        <label style={{ fontSize: 13, color: SOFT, fontWeight: 500 }}>{label}</label>
        <span style={{ fontFamily: "ui-monospace,monospace", fontSize: 12.5, fontWeight: 700, color: INK }}>{fmt ? fmt(val) : val}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={val}
        onChange={(e) => set(+e.target.value)}
        style={{ width: "100%", accentColor: ACC, cursor: "pointer" }} />
    </div>
  );

const Seg: FC<{ label: string; options: { k: string; t: string }[]; val: string; set: (k: string) => void }> = ({ label, options, val, set }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ fontSize: 13, color: SOFT, fontWeight: 500, marginBottom: 5 }}>{label}</div>
    <div style={{ display: "flex", gap: 6 }}>
      {options.map((o) => (
        <button key={o.k} type="button" onClick={() => set(o.k)}
          style={{ flex: 1, fontSize: 12.5, fontWeight: 700, padding: "7px 4px", borderRadius: 8, cursor: "pointer",
            border: `1px solid ${val === o.k ? ACC : BORDER}`, background: val === o.k ? "#0e749015" : "#f8fafc", color: val === o.k ? ACC : SOFT }}>
          {o.t}
        </button>
      ))}
    </div>
  </div>
);

const Group: FC<{ title: string; children: ReactNode }> = ({ title, children }) => (
  <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 12, marginTop: 12 }}>
    <div style={{ fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: FAINT, fontWeight: 700, marginBottom: 10 }}>{title}</div>
    {children}
  </div>
);

const Card: FC<{ title: string; desc?: string; children: ReactNode; right?: ReactNode }> = ({ title, desc, children, right }) => (
  <div style={{ ...CARD, marginTop: 16 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
      <div style={{ fontSize: 15.5, fontWeight: 800, color: INK }}>{title}</div>{right}
    </div>
    {desc && <div style={{ fontSize: 12.5, color: SOFT, margin: "3px 0 14px" }}>{desc}</div>}
    {!desc && <div style={{ height: 12 }} />}
    {children}
  </div>
);

const Bar: FC<{ label: string; value: string; pct: number; color: string }> = ({ label, value, pct, color }) => (
  <div style={{ display: "grid", gridTemplateColumns: "150px 1fr auto", alignItems: "center", gap: 12, marginBottom: 10 }}>
    <span style={{ fontSize: 13, color: SOFT }}>{label}</span>
    <div style={{ height: 22, background: "#eef2f7", borderRadius: 6, overflow: "hidden", border: `1px solid ${BORDER}` }}>
      <div style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: "100%", background: color, borderRadius: "5px 0 0 5px", transition: "width .3s" }} />
    </div>
    <span style={{ fontFamily: "ui-monospace,monospace", fontSize: 13, fontWeight: 700, color: INK, whiteSpace: "nowrap" }}>{value}</span>
  </div>
);

// ═══════════════ TAB 1 — ROI TRỢ GIẢNG AI (pilot) ═══════════════
const RoiTab: FC = () => {
  const [sv, setSv] = useState(300), [gv, setGv] = useState(10), [mo, setMo] = useState(4);
  const [taiPer, setTaiPer] = useState(4), [cvhtPer, setCvhtPer] = useState(6), [days, setDays] = useState(20);
  const [mTai, setMTai] = useState<Model>("mini"), [mCvht, setMCvht] = useState<Model>("4o");
  const [rate, setRate] = useState(100000), [hrs, setHrs] = useState(20), [tuit, setTuit] = useState(7500000), [drop, setDrop] = useState(1.5);
  const [setup, setSetup] = useState(42000000), [infra, setInfra] = useState(3120000), [cvHours, setCvHours] = useState(60);
  const tin = 2500, tout = 500, fx = 26000;

  const c = useMemo(() => {
    const taiReq = sv * taiPer * days + gv * (taiPer * 2) * days;
    const cvhtReq = sv * cvhtPer * 3 + gv * 20;
    const reqM = taiReq + cvhtReq;
    const cost = (req: number, m: Model) => req * (tin / 1e6 * PRICE[m].in + tout / 1e6 * PRICE[m].out);
    const aiUSD = (cost(taiReq, mTai) + cost(cvhtReq, mCvht)) * 1.15;
    const aiVND = aiUSD * fx;
    const opexM = aiVND + infra;
    const pilotCost = setup + opexM * mo;
    const costPerReq = reqM > 0 ? aiVND / reqM : 0;
    const bGV = gv * hrs * rate * mo, bCV = cvHours * 120000 * mo, hard = bGV + bCV;
    const ret = sv * (drop / 100) * tuit, totalBen = hard + ret;
    const roiHard = pilotCost > 0 ? (hard - pilotCost) / pilotCost * 100 : 0;
    const roiTot = pilotCost > 0 ? (totalBen - pilotCost) / pilotCost * 100 : 0;
    const monthlyHard = hard / mo;
    const payback = monthlyHard - opexM > 0 ? setup / (monthlyHard - opexM) : null;
    return { reqM, aiUSD, aiVND, opexM, pilotCost, costPerReq, bGV, bCV, hard, ret, totalBen, roiHard, roiTot, payback };
  }, [sv, gv, mo, taiPer, cvhtPer, days, mTai, mCvht, rate, hrs, tuit, drop, setup, infra, cvHours]);

  const modelOpts = [{ k: "mini", t: "gpt-4o-mini" }, { k: "4o", t: "gpt-4o" }];
  const maxc = Math.max(c.aiVND, infra, c.opexM);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,320px) minmax(0,1fr)", gap: 18, alignItems: "start" }} className="infra-grid">
      <form style={{ ...CARD, paddingTop: 4 }} onSubmit={(e) => e.preventDefault()}>
        <Group title="Quy mô & kỳ thử nghiệm">
          <Slider label="Sinh viên" val={sv} set={setSv} min={50} max={2000} step={10} />
          <Slider label="Giảng viên" val={gv} set={setGv} min={2} max={80} step={1} />
          <Slider label="Thời lượng pilot (tháng)" val={mo} set={setMo} min={1} max={12} step={1} />
        </Group>
        <Group title="Cường độ dùng (trung bình)">
          <Slider label="Câu hỏi Trợ giảng / SV / ngày" val={taiPer} set={setTaiPer} min={1} max={12} step={1} />
          <Slider label="Phiên Cố vấn / SV / tháng" val={cvhtPer} set={setCvhtPer} min={1} max={20} step={1} />
          <Slider label="Ngày học / tháng" val={days} set={setDays} min={10} max={26} step={1} />
        </Group>
        <Group title="Model AI">
          <Seg label="Trợ giảng (TAI)" options={modelOpts} val={mTai} set={(k) => setMTai(k as Model)} />
          <Seg label="Cố vấn (CVHT)" options={modelOpts} val={mCvht} set={(k) => setMCvht(k as Model)} />
        </Group>
        <Group title="Giá trị quy đổi (ROI)">
          <Slider label="Đơn giá giờ giảng GV (đ/giờ)" val={rate} set={setRate} min={80000} max={400000} step={10000} fmt={(n) => nf.format(n) + "đ"} />
          <Slider label="Giờ GV tiết kiệm / GV / tháng" val={hrs} set={setHrs} min={0} max={60} step={2} fmt={(n) => n + " giờ"} />
          <Slider label="Học phí / SV / học kỳ (đ)" val={tuit} set={setTuit} min={0} max={25000000} step={500000} fmt={vnd} />
          <Slider label="Giảm bỏ/rớt nhờ cảnh báo sớm" val={drop} set={setDrop} min={0} max={5} step={0.5} fmt={(n) => n + "%"} />
        </Group>
        <Group title="Chi phí (nâng cao)">
          <Slider label="Thiết lập một lần (đ)" val={setup} set={setSetup} min={0} max={120000000} step={1000000} fmt={vnd} />
          <Slider label="Hạ tầng / tháng (đ)" val={infra} set={setInfra} min={1000000} max={8000000} step={100000} fmt={vnd} />
          <Slider label="Giờ cố vấn tiết kiệm / tháng" val={cvHours} set={setCvHours} min={0} max={200} step={10} fmt={(n) => n + " giờ"} />
        </Group>
      </form>

      <div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Stat label="ROI (lợi ích cứng)" value={(c.roiHard >= 0 ? "+" : "") + Math.round(c.roiHard) + "%"} sub={`gồm giữ chân: ${c.roiTot >= 0 ? "+" : ""}${Math.round(c.roiTot)}%`} color={c.roiHard >= 0 ? GOOD : CRIT} />
          <Stat label="Hoàn vốn" value={c.payback ? c.payback.toFixed(1) : "—"} sub="tháng" />
          <Stat label="Chi phí / câu hỏi AI" value={c.costPerReq < 1000 ? Math.round(c.costPerReq) + "đ" : vnd(c.costPerReq)} sub="mỗi lượt" color={ACC} />
          <Stat label="Tổng chi phí pilot" value={vnd(c.pilotCost)} sub={`${mo} tháng · ${vnd(c.pilotCost / sv)}/SV`} />
          <Stat label="Lượt AI / tháng" value={c.reqM >= 1000 ? (c.reqM / 1000).toFixed(1) + "k" : c.reqM} sub={`${Math.round(c.reqM / days)} lượt/ngày`} />
        </div>

        <Card title="Chi phí vận hành / tháng" desc="Nút cổ chai ở OpenAI API (co giãn sẵn) → hạ tầng gần như miễn phí về năng lực; tiền thật là token AI.">
          <Bar label="AI (OpenAI API)" value={vnd(c.aiVND)} pct={c.aiVND / maxc * 100} color={ACC} />
          <Bar label="Hạ tầng máy chủ" value={vnd(infra)} pct={infra / maxc * 100} color="#2f6f8f" />
          <Bar label="Tổng OPEX/tháng" value={vnd(c.opexM)} pct={c.opexM / maxc * 100} color={SOFT} />
          <div style={{ fontSize: 12, color: FAINT, marginTop: 12, paddingLeft: 12, borderLeft: `2px solid ${BORDER}` }}>
            ≈ {usd(c.aiUSD)}/tháng token · tải nhẹ, 1 máy chủ 8 vCPU/16GB dư sức (mở tới ~5.000 SV chỉ cần 16 vCPU/32GB).
          </div>
        </Card>

        <Card title="Bài toán ROI / học kỳ" desc="Chi phí thực so với giá trị lao động quy đổi. Giá trị giữ chân để riêng vì mang tính tiềm năng — pilot dùng để ĐO lại.">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="infra-vs">
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: 12, padding: "14px 16px", background: "#fdf2f2" }}>
              <div style={{ fontSize: 11.5, letterSpacing: ".05em", textTransform: "uppercase", fontWeight: 700, color: CRIT, marginBottom: 4 }}>Tổng chi phí pilot</div>
              <div style={{ fontFamily: "ui-monospace,monospace", fontSize: 23, fontWeight: 800 }}>{vnd(c.pilotCost)}</div>
              <ul style={{ margin: "8px 0 0", paddingLeft: 16, fontSize: 12, color: SOFT }}>
                <li>Thiết lập một lần: {vnd(setup)}</li><li>Vận hành cả kỳ: {vnd(c.opexM * mo)}</li>
              </ul>
            </div>
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: 12, padding: "14px 16px", background: "#f0fdf4" }}>
              <div style={{ fontSize: 11.5, letterSpacing: ".05em", textTransform: "uppercase", fontWeight: 700, color: GOOD, marginBottom: 4 }}>Lợi ích quy đổi</div>
              <div style={{ fontFamily: "ui-monospace,monospace", fontSize: 23, fontWeight: 800 }}>{vnd(c.totalBen)}</div>
              <ul style={{ margin: "8px 0 0", paddingLeft: 16, fontSize: 12, color: SOFT }}>
                <li>Giờ GV tiết kiệm: {vnd(c.bGV)}</li><li>Cố vấn tự động hoá: {vnd(c.bCV)}</li><li>Giữ chân SV (tiềm năng): {vnd(c.ret)}</li>
              </ul>
            </div>
          </div>
          <div style={{ fontSize: 12, color: FAINT, marginTop: 12, paddingLeft: 12, borderLeft: `2px solid ${BORDER}` }}>
            ROI "lợi ích cứng" chỉ tính giờ GV + cố vấn tiết kiệm (không gồm giữ chân). Nhập đơn giá giờ giảng & học phí thật của TNUT để ra số chính xác.
          </div>
        </Card>
      </div>
    </div>
  );
};

// ═══════════════ TAB 2 — HẠ TẦNG 12.000 (VPS vs Token) ═══════════════
const PA = {
  PA1: { name: "PA1 — Gộp 1 VPS", cfg: "16 vCPU / 32GB / 500GB NVMe · Docker Compose", cost: 8, note: "Rẻ, đơn giản; 1 điểm chết, khó scale. Hợp giai đoạn đầu." },
  PA2: { name: "PA2 — Cụm tách tầng ⭐", cfg: "~48–56 vCPU / 112–128GB / ~1TB · scale ngang App/AI", cost: 45, note: "Khuyến nghị chính thức toàn trường; HA một phần." },
  PA3: { name: "PA3 — HA production", cfg: "~90–120 vCPU · replica set, autoscale, monitoring", cost: 100, note: "Toàn trường HA; hoặc mua server ~1,5–2,5 tỷ." },
} as const;
type PAKey = keyof typeof PA;

const InfraTab: FC = () => {
  const [N, setN] = useState(12000), [pctConc, setPctConc] = useState(15), [aiChat, setAiChat] = useState(20);
  const [reqPerUser, setReqPerUser] = useState(40), [pct4o, setPct4o] = useState(5);
  const [miniRate, setMiniRate] = useState(77), [o4Rate, setO4Rate] = useState(1300);
  const [pa, setPa] = useState<PAKey>("PA2");
  // Mua vs Thuê (khi tự host LLM trên GPU)
  const [genGpu, setGenGpu] = useState(3000), [gpuPrice, setGpuPrice] = useState(28000), [gpuHourly, setGpuHourly] = useState(1.9);
  const [staff, setStaff] = useState(45000000), [depr, setDepr] = useState(48);
  const tout = 500, fx = 26000;

  const c = useMemo(() => {
    const concurrent = N * pctConc / 100;
    const webRpsReal = concurrent / 30;
    const webRpsDesign = webRpsReal * 2.5;
    const aiConc = concurrent * aiChat / 100;
    const aiQps = aiConc / 60;
    const aiInflight = aiQps * 6;
    const reqMonth = N * reqPerUser;
    const req4o = reqMonth * pct4o / 100, reqMini = reqMonth - req4o;
    const costMini = reqMini * miniRate, cost4o = req4o * o4Rate, tokenM = costMini + cost4o;
    const avgReq = reqMonth > 0 ? tokenM / reqMonth : 0;
    const vps = PA[pa].cost * 1e6;
    const total = tokenM + vps;

    // ── Mua server vs Thuê (nếu tự host LLM trên GPU) ──
    const outSec = aiQps * tout;
    const gpu = Math.max(4, Math.ceil(outSec / genGpu) + 2);
    const capexUSD = gpu * gpuPrice + Math.ceil(gpu / 4) * 25000 + 36000 + 25000 + 20000;
    const capexVND = capexUSD * fx;
    const opexBuy = (gpu * 0.7 + 3) * 730 * 3000 * 1.5 + staff + 12e6 + 10e6;
    const deprM = capexVND / depr;
    const tcoBuy = deprM + opexBuy, tco4Buy = capexVND + opexBuy * 48;
    const cloudGpuVND = gpu * gpuHourly * 730 * fx;
    const tcoCloud = cloudGpuVND + 39e6, tco4Cloud = tcoCloud * 48;
    const tcoApi = tokenM + 40e6, tco4Api = tcoApi * 48;
    const t4 = [tco4Buy, tco4Cloud, tco4Api];
    let best = 0; for (let i = 1; i < 3; i++) if (t4[i] < t4[best]) best = i;
    const beCloud = tcoCloud - opexBuy > 0 ? capexVND / (tcoCloud - opexBuy) : null;
    const beApi = tcoApi - opexBuy > 0 ? capexVND / (tcoApi - opexBuy) : null;

    return { concurrent, webRpsReal, webRpsDesign, aiConc, aiQps, aiInflight, reqMonth, reqMini, req4o, costMini, cost4o, tokenM, avgReq, vps, total,
      gpu, capexVND, opexBuy, deprM, tcoBuy, tco4Buy, cloudGpuVND, tcoCloud, tco4Cloud, tcoApi, tco4Api, best, beCloud, beApi };
  }, [N, pctConc, aiChat, reqPerUser, pct4o, miniRate, o4Rate, pa, genGpu, gpuPrice, gpuHourly, staff, depr]);

  const maxCost = Math.max(c.tokenM, c.vps);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,320px) minmax(0,1fr)", gap: 18, alignItems: "start" }} className="infra-grid">
      <form style={{ ...CARD, paddingTop: 4 }} onSubmit={(e) => e.preventDefault()}>
        <Group title="Tải hệ thống toàn trường">
          <Slider label="Tổng người dùng" val={N} set={setN} min={2000} max={40000} step={500} fmt={(n) => nf.format(n)} />
          <Slider label="% đồng thời giờ cao điểm" val={pctConc} set={setPctConc} min={5} max={30} step={1} fmt={(n) => n + "%"} />
          <Slider label="% đồng thời đang chat AI" val={aiChat} set={setAiChat} min={5} max={50} step={1} fmt={(n) => n + "%"} />
          <Slider label="Lượt hỏi AI / người / tháng" val={reqPerUser} set={setReqPerUser} min={10} max={120} step={5} />
        </Group>
        <Group title="Chi phí token AI">
          <Slider label="% lượt dùng gpt-4o (còn lại: mini)" val={pct4o} set={setPct4o} min={0} max={30} step={1} fmt={(n) => n + "%"} />
          <Slider label="Đơn giá 1 lượt mini (đ)" val={miniRate} set={setMiniRate} min={40} max={200} step={1} fmt={(n) => n + "đ"} />
          <Slider label="Đơn giá 1 lượt gpt-4o (đ)" val={o4Rate} set={setO4Rate} min={600} max={2500} step={50} fmt={(n) => nf.format(n) + "đ"} />
        </Group>
        <Group title="Phương án hạ tầng VPS">
          <Seg label="Chọn phương án" options={[{ k: "PA1", t: "PA1" }, { k: "PA2", t: "PA2 ⭐" }, { k: "PA3", t: "PA3" }]} val={pa} set={(k) => setPa(k as PAKey)} />
          <div style={{ fontSize: 12, color: SOFT, lineHeight: 1.5 }}><b style={{ color: INK }}>{PA[pa].name}</b><br />{PA[pa].cfg}<br /><span style={{ color: FAINT }}>{PA[pa].note}</span></div>
        </Group>
        <Group title="Mua vs Thuê — tự host GPU">
          <Slider label="Tốc độ sinh / GPU (token/s)" val={genGpu} set={setGenGpu} min={1000} max={6000} step={250} fmt={(n) => nf.format(n)} />
          <Slider label="Giá 1 GPU (USD, H100)" val={gpuPrice} set={setGpuPrice} min={12000} max={40000} step={1000} fmt={(n) => "$" + nf.format(n)} />
          <Slider label="Thuê GPU cloud ($/GPU/giờ)" val={gpuHourly} set={setGpuHourly} min={1} max={4} step={0.1} fmt={(n) => "$" + n} />
          <Slider label="Nhân sự vận hành / tháng (đ)" val={staff} set={setStaff} min={0} max={120000000} step={5000000} fmt={vnd} />
          <Slider label="Khấu hao (tháng)" val={depr} set={setDepr} min={24} max={72} step={6} fmt={(n) => n + " th"} />
        </Group>
      </form>

      <div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Stat label="Đồng thời cao điểm" value={nf.format(Math.round(c.concurrent))} sub={`${pctConc}% của ${nf.format(N)}`} />
          <Stat label="Web RPS (thiết kế ×2,5)" value={Math.round(c.webRpsDesign)} sub={`thực ~${Math.round(c.webRpsReal)} req/s`} color={ACC} />
          <Stat label="Câu hỏi AI / giây" value={c.aiQps.toFixed(1)} sub={`~${Math.round(c.aiInflight)} in-flight`} />
          <Stat label="Lượt AI / tháng" value={(c.reqMonth / 1000).toFixed(0) + "k"} sub={`TB ${Math.round(c.avgReq)}đ/lượt`} />
          <Stat label="GPU (nếu tự host)" value={c.gpu} sub="H100 80GB" color={ACC} />
        </div>

        <Card title="Chi phí / tháng — Token AI vs VPS" desc="Đòn bẩy lớn nhất là tỷ lệ mini/gpt-4o (4o đắt ~17×). Ở kiến trúc hiện tại KHÔNG cần GPU (LLM qua API, e5 embed local).">
          <Bar label="Token AI (OpenAI)" value={vnd(c.tokenM)} pct={c.tokenM / maxCost * 100} color={ACC} />
          <Bar label={`VPS ${pa}`} value={vnd(c.vps)} pct={c.vps / maxCost * 100} color="#2f6f8f" />
          <div style={{ borderTop: `2px solid ${BORDER}`, marginTop: 8, paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontWeight: 800, color: INK }}>TỔNG VẬN HÀNH / THÁNG</span>
            <span style={{ fontFamily: "ui-monospace,monospace", fontSize: 20, fontWeight: 800, color: ACC }}>{vnd(c.total)}</span>
          </div>
          <div style={{ fontSize: 12, color: c.tokenM > c.vps ? AMBER : FAINT, marginTop: 10, paddingLeft: 12, borderLeft: `2px solid ${BORDER}` }}>
            {c.tokenM > c.vps
              ? `⚠️ Token AI (${vnd(c.tokenM)}) > VPS (${vnd(c.vps)}) → ưu tiên kiểm soát token: mặc định mini, router độ khó, trần ngân sách, cache câu lặp.`
              : `VPS đang lớn hơn token — tải AI còn thấp, dư địa tăng cường độ dùng.`}
          </div>
        </Card>

        <Card title="Mua server vs Thuê — chi phí sở hữu" desc="Nếu tự host LLM trên GPU (thay vì gọi API). Ô viền xanh là rẻ nhất theo TCO 4 năm với giả định hiện tại — kéo % dùng AI để thấy điểm lật.">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }} className="infra-vs">
            {([
              { n: "Mua server (tự host GPU)", tco: c.tcoBuy, lines: [["CAPEX ban đầu", vnd(c.capexVND)], ["Vận hành/tháng", vnd(c.opexBuy)], ["Khấu hao/tháng", vnd(c.deprM)]], cap: `Cần ${c.gpu} GPU · TCO 4 năm ${vnd(c.tco4Buy)}` },
              { n: "Thuê GPU cloud (tự host)", tco: c.tcoCloud, lines: [["CAPEX", "0đ"], ["GPU cloud/tháng", vnd(c.cloudGpuVND)], ["App/DB VPS/tháng", vnd(39e6)]], cap: `$${gpuHourly}/GPU/giờ (cam kết) · TCO 4 năm ${vnd(c.tco4Cloud)}` },
              { n: "Thuê VPS + OpenAI API", tco: c.tcoApi, lines: [["CAPEX", "0đ"], ["Token API/tháng", vnd(c.tokenM)], ["VPS/tháng", vnd(40e6)]], cap: `TCO 4 năm ${vnd(c.tco4Api)}` },
            ] as { n: string; tco: number; lines: [string, string][]; cap: string }[]).map((o, i) => {
              const isBest = i === c.best;
              return (
                <div key={i} style={{ position: "relative", border: `1px solid ${isBest ? GOOD : BORDER}`, boxShadow: isBest ? `0 0 0 1.5px ${GOOD}` : "none", borderRadius: 14, padding: "16px 16px 14px", background: "#fff" }}>
                  {isBest && <span style={{ position: "absolute", top: -10, left: 14, fontSize: 10, fontWeight: 800, letterSpacing: ".05em", background: GOOD, color: "#fff", padding: "3px 9px", borderRadius: 99 }}>RẺ NHẤT 4 NĂM</span>}
                  <div style={{ fontSize: 14, fontWeight: 800, color: INK, marginTop: isBest ? 6 : 0 }}>{o.n}</div>
                  <div style={{ fontFamily: "ui-monospace,monospace", fontSize: 23, fontWeight: 800, color: ACC, margin: "8px 0 2px" }}>{vnd(o.tco)}<small style={{ fontSize: 11, color: FAINT, fontWeight: 500 }}> /tháng</small></div>
                  {o.lines.map(([k, v], j) => (
                    <div key={j} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12, color: SOFT, padding: "6px 0", borderTop: `1px solid ${BORDER}`, marginTop: j === 0 ? 8 : 0 }}>
                      <span>{k}</span><b style={{ fontFamily: "ui-monospace,monospace", color: INK, fontWeight: 700 }}>{v}</b>
                    </div>
                  ))}
                  <div style={{ fontSize: 11, color: FAINT, marginTop: 8, lineHeight: 1.4 }}>{o.cap}</div>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 12, color: FAINT, marginTop: 12, paddingLeft: 12, borderLeft: `2px solid ${BORDER}` }}>
            Điểm hoà vốn Mua vs {c.beCloud ? `Thuê GPU cloud ~${Math.round(c.beCloud)} tháng` : "Thuê GPU cloud: không (thuê rẻ hơn)"} · vs Thuê+API {c.beApi ? `~${Math.round(c.beApi)} tháng` : "không (API rẻ hơn — chưa cần mua GPU)"}. Mua server lợi thế NĐ13 (dữ liệu không rời trường); cần PoC + load test trước khi đầu tư.
          </div>
        </Card>

        <Card title="Cơ cấu token theo model" desc="Tách chi phí mini và gpt-4o theo tỷ lệ đang chọn.">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
            <thead><tr>
              <th style={{ textAlign: "left", padding: "8px 6px", borderBottom: `1px solid ${BORDER}`, color: FAINT, fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em" }}>Model</th>
              <th style={{ textAlign: "right", padding: "8px 6px", borderBottom: `1px solid ${BORDER}`, color: FAINT, fontSize: 11 }}>Lượt/tháng</th>
              <th style={{ textAlign: "right", padding: "8px 6px", borderBottom: `1px solid ${BORDER}`, color: FAINT, fontSize: 11 }}>Chi phí/tháng</th>
            </tr></thead>
            <tbody style={{ fontFamily: "ui-monospace,monospace" }}>
              <tr><td style={{ padding: "8px 6px", borderBottom: `1px solid ${BORDER}` }}>gpt-4o-mini</td><td style={{ textAlign: "right", padding: "8px 6px", borderBottom: `1px solid ${BORDER}` }}>{nf.format(Math.round(c.reqMini))}</td><td style={{ textAlign: "right", padding: "8px 6px", borderBottom: `1px solid ${BORDER}` }}>{vnd(c.costMini)}</td></tr>
              <tr><td style={{ padding: "8px 6px", borderBottom: `1px solid ${BORDER}` }}>gpt-4o</td><td style={{ textAlign: "right", padding: "8px 6px", borderBottom: `1px solid ${BORDER}` }}>{nf.format(Math.round(c.req4o))}</td><td style={{ textAlign: "right", padding: "8px 6px", borderBottom: `1px solid ${BORDER}` }}>{vnd(c.cost4o)}</td></tr>
              <tr style={{ fontWeight: 800 }}><td style={{ padding: "10px 6px" }}>Tổng token</td><td style={{ textAlign: "right", padding: "10px 6px" }}>{nf.format(Math.round(c.reqMonth))}</td><td style={{ textAlign: "right", padding: "10px 6px", color: ACC }}>{vnd(c.tokenM)}</td></tr>
            </tbody>
          </table>
          <div style={{ fontSize: 12, color: FAINT, marginTop: 10, paddingLeft: 12, borderLeft: `2px solid ${BORDER}` }}>
            Mặc định (12.000 người · 5% dùng 4o) tái tạo báo cáo hạ tầng 12.000: ~66,3 tr/tháng token, ~138đ/lượt. Đơn giá/lượt cần xác nhận lại tại thời điểm ký/nạp quỹ.
          </div>
        </Card>
      </div>
    </div>
  );
};

// ═══════════════ TRANG ═══════════════
const InfraCalcPage: FC = () => {
  const [tab, setTab] = useState<"roi" | "infra">("roi");
  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(50rem 26rem at 90% -6%, rgba(14,116,144,.08), transparent 60%), linear-gradient(180deg,#f7f8fc,#eef1f8)" }}>
      <style>{`@media(max-width:820px){.infra-grid{grid-template-columns:1fr!important}.infra-vs{grid-template-columns:1fr!important}}`}</style>
      <header style={{ color: "#fff", background: "linear-gradient(135deg,#0e7490 0%,#155e75 100%)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <span style={{ display: "grid", placeItems: "center", height: 38, width: 38, borderRadius: 11, background: "rgba(255,255,255,.16)" }}><Calculator size={19} /></span>
            <div style={{ lineHeight: 1.25, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 800 }}>Tính toán hạ tầng &amp; ROI</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.8)" }}>Công cụ hoạch định năng lực & chi phí PIAI-TNUT · quyền quản trị</div>
            </div>
          </div>
          <Link to="/atlas" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,.25)", background: "rgba(255,255,255,.12)", color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none" }}><ArrowLeft size={15} /> Về Atlas</Link>
        </div>
      </header>

      <main style={{ maxWidth: 1120, margin: "0 auto", padding: 20 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <button type="button" onClick={() => setTab("roi")} style={tabBtn(tab === "roi")}><GraduationCap size={15} /> ROI Trợ giảng AI · Pilot 300 SV</button>
          <button type="button" onClick={() => setTab("infra")} style={tabBtn(tab === "infra")}><Server size={15} /> Hạ tầng 12.000 · VPS · Mua vs Thuê</button>
        </div>
        <div style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 8, color: SOFT, fontSize: 12.5 }}>
          {tab === "roi" ? <Cpu size={15} color={ACC} /> : <Cloud size={15} color={ACC} />}
          {tab === "roi"
            ? "Chi phí AI = token/lượt (không GPU). Số mặc định: mức trung bình cho 300 SV + 10 GV / 1 học kỳ (đơn giá thật TNUT)."
            : "12.000 người ≠ đồng thời. Ở kiến trúc hiện tại LLM qua API, embed e5 local → không cần GPU; token AI thường > VPS."}
        </div>
        {tab === "roi" ? <RoiTab /> : <InfraTab />}
        <div style={{ fontSize: 11.5, color: FAINT, textAlign: "center", marginTop: 26, paddingTop: 14, borderTop: `1px solid ${BORDER}` }}>
          Ước tính thiết kế (band ±20–30%) · gpt-4o-mini $0,15/$0,60 · gpt-4o $2,50/$10 mỗi 1M token · tỷ giá 26.000đ · © Viện RIAT / TNUT
        </div>
      </main>
    </div>
  );
};

function tabBtn(active: boolean): CSSProperties {
  return {
    display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13.5, fontWeight: 700, padding: "10px 16px", borderRadius: 11, cursor: "pointer",
    border: `1px solid ${active ? ACC : BORDER}`, background: active ? "#fff" : "#f8fafc", color: active ? ACC : SOFT,
    boxShadow: active ? "0 1px 2px rgba(15,23,42,.06)" : "none",
  };
}

export default InfraCalcPage;
