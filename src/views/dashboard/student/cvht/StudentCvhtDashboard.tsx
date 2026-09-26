import { type FC, type ReactNode, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  GraduationCap, MessageCircle, RefreshCw, TrendingUp, BookOpenCheck, AlertTriangle, ShieldAlert,
  ClipboardCheck, CalendarClock, NotebookPen, Bell, Sparkles, Compass, ListChecks, Route, Link2,
  CalendarDays, FileSearch, Scale, Award, Loader2,
} from 'lucide-react';
import CvhtApi, { type ICvhtChuyenCan, type ICvhtLichThi, type ICvhtTongQuan } from '@/infra/cvht/cvht_api';

const ADVISOR_CHAT = '/student/chat/advisor';

/** Toàn bộ việc chatbot CVHT làm được cho SV (khớp bộ công cụ của dịch vụ CVHT). */
const TINH_NANG: { icon: typeof GraduationCap; ten: string; mo_ta: string; hoi: string }[] = [
  { icon: TrendingUp,    ten: 'Kết quả học tập',     mo_ta: 'Điểm từng môn, GPA kỳ & tích luỹ, xếp loại',     hoi: 'Kết quả học tập và GPA tích luỹ của tôi hiện nay thế nào? Xếp loại học lực ra sao?' },
  { icon: ShieldAlert,   ten: 'Cảnh báo học vụ',     mo_ta: 'Nguy cơ cảnh báo, điều kiện theo quy chế',        hoi: 'Tôi có đang bị cảnh báo học vụ không? Theo quy chế thì điều kiện bị cảnh báo là gì và tôi cần làm gì để tránh?' },
  { icon: ListChecks,    ten: 'Tiến độ CTĐT',         mo_ta: 'Đã tích luỹ bao nhiêu TC, còn thiếu nhóm nào',    hoi: 'Tiến độ chương trình đào tạo của tôi: đã tích luỹ bao nhiêu tín chỉ, còn thiếu những học phần/nhóm nào?' },
  { icon: Route,         ten: 'Môn kỳ sau',           mo_ta: 'Gợi ý học phần nên đăng ký kỳ tới',               hoi: 'Kỳ tới tôi nên đăng ký những môn nào cho đúng tiến độ?' },
  { icon: Link2,         ten: 'Môn tiên quyết',       mo_ta: 'Điều kiện tiên quyết/học trước của học phần',     hoi: 'Tôi muốn đăng ký một môn, hãy kiểm tra giúp tôi các môn tiên quyết/học trước của nó.' },
  { icon: CalendarDays,  ten: 'TKB tuần / học kỳ',    mo_ta: 'Thời khoá biểu tuần này và cả học kỳ',            hoi: 'Thời khoá biểu tuần này của tôi?' },
  { icon: CalendarClock, ten: 'Lịch thi',             mo_ta: 'Ngày giờ, phòng thi các học phần',                hoi: 'Lịch thi học kỳ này của tôi?' },
  { icon: FileSearch,    ten: 'Đăng ký môn học',      mo_ta: 'Các học phần đã đăng ký kỳ này',                  hoi: 'Học kỳ này tôi đã đăng ký những môn nào, tổng bao nhiêu tín chỉ?' },
  { icon: Scale,         ten: 'Quy chế đào tạo',      mo_ta: 'Tra cứu quy chế, học lại, cải thiện điểm',        hoi: 'Theo quy chế đào tạo, quy định về học lại và học cải thiện điểm như thế nào?' },
  { icon: Award,         ten: 'Điều kiện tốt nghiệp', mo_ta: 'Đối chiếu điều kiện xét tốt nghiệp',              hoi: 'Điều kiện xét tốt nghiệp là gì và tôi hiện còn thiếu điều kiện nào?' },
  { icon: Compass,       ten: 'Định hướng nghề',      mo_ta: 'Tư vấn nghề theo năng lực đã tích luỹ',           hoi: 'Với kết quả học tập hiện tại, tôi phù hợp với những hướng nghề nghiệp nào và nên bồi dưỡng thêm gì?' },
];

const RISK_COLOR: Record<string, { fg: string; bg: string }> = {
  green:  { fg: '#059669', bg: 'rgba(5,150,105,0.08)' },
  yellow: { fg: '#ca8a04', bg: 'rgba(202,138,4,0.09)' },
  orange: { fg: '#ea580c', bg: 'rgba(234,88,12,0.09)' },
  red:    { fg: '#dc2626', bg: 'rgba(220,38,38,0.08)' },
};
const CC_COLOR: Record<string, string> = { green: '#059669', amber: '#d97706', orange: '#ea580c', red: '#dc2626', gray: '#94a3b8' };
const HINH_THUC: Record<string, string> = { truc_tiep: 'Trực tiếp', online: 'Online', dien_thoai: 'Điện thoại' };

const card: React.CSSProperties = { background: 'white', border: '1px solid rgba(37,99,235,0.1)', borderRadius: 16, boxShadow: '0 6px 24px rgba(37,99,235,0.05)', padding: '1.1rem 1.2rem', minWidth: 0 };
const muted: React.CSSProperties = { color: '#64748b', fontSize: '0.8rem' };

const fmt = (v: number | null | undefined, d = 2) => (v == null ? '—' : v.toFixed(d));
const fmtNgay = (s: string | null) => {
  if (!s) return '—';
  const d = new Date(s.replace(' ', 'T'));
  return isNaN(d.getTime()) ? s : new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
};

const Title: FC<{ icon: ReactNode; children: ReactNode; right?: ReactNode }> = ({ icon, children, right }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
    <span style={{ color: '#2563eb', display: 'flex' }}>{icon}</span>
    <span style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '0.92rem', flex: 1 }}>{children}</span>
    {right}
  </div>
);

/** Biểu đồ đường GPA theo kỳ (thang 4): GPA học kỳ + GPA tích luỹ. */
const GpaChart: FC<{ ky: { nhan: string; hk: number | null; tl: number | null }[] }> = ({ ky }) => {
  const W = 520, H = 190, L = 30, R = 10, T = 12, B = 34;
  const n = ky.length;
  const x = (i: number) => L + (n <= 1 ? (W - L - R) / 2 : (i * (W - L - R)) / (n - 1));
  const y = (v: number) => T + (1 - v / 4) * (H - T - B);
  const duong = (k: 'hk' | 'tl') => ky.map((p, i) => (p[k] == null ? null : `${x(i)},${y(p[k] as number)}`)).filter(Boolean).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }} role="img" aria-label="GPA theo học kỳ">
      {[0, 1, 2, 3, 4].map(v => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="#eef2f7" />
          <text x={L - 6} y={y(v) + 4} fontSize="10" textAnchor="end" fill="#94a3b8">{v}</text>
        </g>
      ))}
      <line x1={L} x2={W - R} y1={y(2)} y2={y(2)} stroke="#fca5a5" strokeDasharray="4 4" />
      <polyline points={duong('tl')} fill="none" stroke="#2563eb" strokeWidth="2.5" />
      <polyline points={duong('hk')} fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="5 3" />
      {ky.map((p, i) => (
        <g key={i}>
          {p.tl != null && <circle cx={x(i)} cy={y(p.tl)} r="3.5" fill="#2563eb"><title>{`${p.nhan}: tích luỹ ${p.tl.toFixed(2)}`}</title></circle>}
          {p.hk != null && <circle cx={x(i)} cy={y(p.hk)} r="3" fill="#f59e0b"><title>{`${p.nhan}: học kỳ ${p.hk.toFixed(2)}`}</title></circle>}
          <text x={x(i)} y={H - 12} fontSize="9.5" textAnchor="middle" fill="#64748b">{p.nhan}</text>
        </g>
      ))}
    </svg>
  );
};

const StudentCvhtDashboard: FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<ICvhtTongQuan | null>(null);
  const [thi, setThi] = useState<ICvhtLichThi[] | null>(null);
  const [cc, setCc] = useState<ICvhtChuyenCan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hoi = (q: string) => navigate(`${ADVISOR_CHAT}?q=${encodeURIComponent(q)}`);

  const load = useCallback(() => {
    setLoading(true); setError(null);
    CvhtApi.tongQuan().then(setData).catch(() => setError('Không tải được dữ liệu cố vấn học tập.')).finally(() => setLoading(false));
    CvhtApi.lichThi().then(setThi).catch(() => setThi([]));
    CvhtApi.chuyenCan().then(setCc).catch(() => setCc(null));
  }, []);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const hv = data?.hoc_vu;
  const rr = data?.rui_ro;
  const lichSu = hv?.lich_su ?? [];
  const kyChart = lichSu.length
    ? lichSu.map(k => ({ nhan: k.ten_hoc_ky ? k.ten_hoc_ky.replace(/^Học kỳ\s*/i, 'HK').replace(/\s*-\s*Năm học\s*/i, ' ').slice(0, 14) : String(k.hoc_ky ?? ''), hk: k.gpa_hk_4, tl: k.gpa_tl_4 }))
    : (data?.moc_gpa ?? []).map(m => ({ nhan: m.hoc_ky ?? fmtNgay(m.ngay), hk: m.dtb_hk, tl: m.diem_tbtl }));
  const tcChuan = hv?.tc_chuan ?? 155;
  const tcPct = hv?.tc_tich_luy != null ? Math.min(100, Math.round((hv.tc_tich_luy / tcChuan) * 100)) : null;
  const rc = RISK_COLOR[rr?.color ?? 'green'];

  return (
    <div style={{ minHeight: '100%', background: '#eef4ff', fontFamily: "'Be Vietnam Pro',system-ui,sans-serif", padding: '1.5rem 1rem' }}>
      <style>{`
        .cvht-grid4 { display:grid; gap:14px; grid-template-columns:repeat(4,minmax(0,1fr)); }
        .cvht-grid2 { display:grid; gap:14px; grid-template-columns:minmax(0,1fr) minmax(0,1fr); }
        .cvht-grid3 { display:grid; gap:14px; grid-template-columns:repeat(3,minmax(0,1fr)); }
        .cvht-feat { display:grid; gap:10px; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); }
        .cvht-tile { text-align:left; border:1px solid #e2e8f0; background:#f8fafc; border-radius:12px; padding:10px 12px; cursor:pointer; transition:all .15s; font-family:inherit; }
        .cvht-tile:hover { border-color:#93c5fd; background:#eff6ff; transform:translateY(-1px); }
        .cvht-btn { display:inline-flex; align-items:center; gap:6px; border-radius:10px; font-weight:700; font-size:.8rem; cursor:pointer; padding:8px 14px; font-family:inherit; }
        @media (max-width: 900px) { .cvht-grid4 { grid-template-columns:repeat(2,minmax(0,1fr)); } .cvht-grid2, .cvht-grid3 { grid-template-columns:minmax(0,1fr); } }
        @keyframes cvht-spin { to { transform: rotate(360deg); } }
      `}</style>
      <div style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Tiêu đề */}
        <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', border: 'none', color: 'white' }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={26} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>Cố vấn học tập của tôi</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.85, marginTop: 2 }}>
              {data ? <>{data.ho_ten} · {data.ma_sv}{data.cvht ? <> · CVHT: <b>{data.cvht}</b></> : null}{data.hoc_ky_hien_tai ? <> · HK {data.hoc_ky_hien_tai}</> : null}</> : 'Theo dõi học vụ, rủi ro học tập và tư vấn từ CVHT'}
            </div>
          </div>
          <button className="cvht-btn" onClick={load} disabled={loading} style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
            <RefreshCw size={14} style={loading ? { animation: 'cvht-spin 1s linear infinite' } : undefined} /> Làm mới
          </button>
          <button className="cvht-btn" onClick={() => navigate(ADVISOR_CHAT)} style={{ background: 'white', color: '#1e3a8a', border: 'none' }}>
            <MessageCircle size={14} /> Hỏi chatbot CVHT
          </button>
        </div>

        {loading && !data && <div style={{ ...card, display: 'flex', gap: 8, alignItems: 'center', color: '#64748b' }}><Loader2 size={16} style={{ animation: 'cvht-spin 1s linear infinite' }} /> Đang lấy dữ liệu học vụ từ Cổng thông tin…</div>}
        {error && <div style={{ ...card, color: '#dc2626' }}>{error}</div>}

        {data && (
          <>
            {!hv?.available && (
              <div style={{ ...card, borderColor: 'rgba(217,119,6,0.35)', background: 'rgba(217,119,6,0.06)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: '0.83rem', color: '#92400e', lineHeight: 1.55 }}>
                  <b>Chưa có dữ liệu điểm từ Portal.</b> {hv?.message}
                  {data.moc_gpa.length > 0 && <> Đang hiển thị {data.moc_gpa.length} mốc GPA do CVHT đã đồng bộ.</>}
                </div>
              </div>
            )}

            {/* KPI học vụ */}
            <div className="cvht-grid4">
              <div style={card}>
                <div style={muted}>GPA tích luỹ (hệ 4)</div>
                <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#1e3a8a' }}>{fmt(hv?.gpa_4)}</div>
                <div style={muted}>Hệ 10: {fmt(hv?.gpa_10)} · HK gần nhất: {fmt(hv?.gpa_hk_gan)}</div>
              </div>
              <div style={card}>
                <div style={muted}>Tín chỉ tích luỹ</div>
                <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#1e3a8a' }}>{hv?.tc_tich_luy ?? '—'}<span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}> / {tcChuan}</span></div>
                <div style={{ height: 6, background: '#e2e8f0', borderRadius: 4, marginTop: 6, overflow: 'hidden' }}>
                  <div style={{ width: `${tcPct ?? 0}%`, height: '100%', background: '#2563eb' }} />
                </div>
                <div style={{ ...muted, marginTop: 4 }}>{tcPct != null ? `${tcPct}% chương trình` : 'Chưa có số liệu'}{rr && rr.hk_cham >= 1 ? ` · chậm ~${rr.hk_cham} HK` : ''}</div>
              </div>
              <div style={card}>
                <div style={muted}>Môn nợ (chưa đạt)</div>
                <div style={{ fontSize: '1.7rem', fontWeight: 800, color: (hv?.mon_no?.length ?? 0) > 0 ? '#dc2626' : '#059669' }}>{hv?.available ? hv.mon_no?.length ?? 0 : '—'}</div>
                <div style={muted}>{hv?.available ? `${hv.tc_no ?? 0} tín chỉ · đã đạt ${hv.so_mon_dat ?? 0} môn` : 'Chưa có số liệu'}</div>
              </div>
              <div style={card}>
                <div style={muted}>Cảnh báo học vụ</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, marginTop: 6, color: hv?.canh_cao ? '#dc2626' : '#059669' }}>
                  {hv?.available ? (hv.canh_cao ? hv.canh_cao.replace(/<\/br>/g, '; ') : 'Không có') : '—'}
                </div>
                <button className="cvht-btn" onClick={() => hoi(TINH_NANG[1].hoi)} style={{ marginTop: 8, padding: '5px 10px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>Hỏi về cảnh báo</button>
              </div>
            </div>

            {/* Rủi ro + GPA theo kỳ */}
            <div className="cvht-grid2">
              <div style={{ ...card, borderColor: rr ? rc.fg + '44' : undefined }}>
                <Title icon={<ShieldAlert size={17} />}>Mức rủi ro học tập</Title>
                {rr ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '2rem', fontWeight: 800, color: rc.fg }}>{rr.score}</span>
                      <span style={{ ...muted }}>/ 100 điểm</span>
                      <span style={{ padding: '3px 10px', borderRadius: 20, background: rc.bg, color: rc.fg, fontWeight: 800, fontSize: '0.78rem' }}>{rr.label}</span>
                    </div>
                    <div style={{ position: 'relative', display: 'flex', height: 8, borderRadius: 5, margin: '10px 0 14px' }}>
                      {[['#059669', 20], ['#ca8a04', 15], ['#ea580c', 14], ['#dc2626', 51]].map(([c, w], i) => <div key={i} style={{ width: `${w}%`, background: c as string, opacity: 0.25 }} />)}
                      <div style={{ position: 'absolute', left: `calc(${Math.min(rr.score, 100)}% - 2px)`, top: -3, width: 4, height: 14, background: rc.fg, borderRadius: 2 }} />
                    </div>
                    {rr.components.map(c => (
                      <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', marginBottom: 6 }}>
                        <span style={{ width: 150, color: '#334155' }}>{c.ten}</span>
                        <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${(c.diem / c.toi_da) * 100}%`, height: '100%', background: c.diem === 0 ? '#10b981' : rc.fg }} />
                        </div>
                        <span style={{ width: 44, textAlign: 'right', color: '#64748b' }}>{c.diem}/{c.toi_da}</span>
                      </div>
                    ))}
                    <div style={{ ...muted, fontSize: '0.72rem', marginTop: 6 }}>Cùng công thức CVHT dùng để theo dõi lớp: ≤20 bình thường · ≤35 cần theo dõi · ≤49 cần tư vấn sớm · &gt;49 nguy cơ cao. Điểm càng thấp càng an toàn.</div>
                  </>
                ) : <div style={muted}>Cần dữ liệu điểm từ Portal để tính mức rủi ro.</div>}
              </div>

              <div style={card}>
                <Title icon={<TrendingUp size={17} />}>GPA theo học kỳ</Title>
                {kyChart.length > 0 ? (
                  <>
                    <GpaChart ky={kyChart} />
                    <div style={{ display: 'flex', gap: 14, ...muted, fontSize: '0.72rem' }}>
                      <span><b style={{ color: '#2563eb' }}>━</b> GPA tích luỹ</span>
                      <span><b style={{ color: '#f59e0b' }}>┅</b> GPA học kỳ</span>
                      <span><b style={{ color: '#fca5a5' }}>┅</b> ngưỡng 2.0</span>
                    </div>
                  </>
                ) : <div style={muted}>Chưa có lịch sử điểm theo kỳ.</div>}
              </div>
            </div>

            {/* Môn nợ · Lịch thi · Chuyên cần */}
            <div className="cvht-grid3">
              <div style={card}>
                <Title icon={<BookOpenCheck size={17} />}>Môn cần học lại</Title>
                {hv?.available && (hv.mon_no?.length ?? 0) === 0 && <div style={{ ...muted, color: '#059669' }}>Không có môn nợ. Tốt lắm!</div>}
                {!hv?.available && <div style={muted}>Chưa có số liệu.</div>}
                {(hv?.mon_no ?? []).slice(0, 6).map(m => (
                  <div key={m.ma_mon} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: '0.8rem', padding: '6px 0', borderBottom: '1px dashed #eef2f7' }}>
                    <span style={{ color: '#1e293b' }}>{m.ten_mon || m.ma_mon}</span><span style={{ color: '#dc2626', fontWeight: 700, whiteSpace: 'nowrap' }}>{m.so_tc} TC</span>
                  </div>
                ))}
                {(hv?.mon_no?.length ?? 0) > 0 && (
                  <button className="cvht-btn" onClick={() => hoi('Tôi đang nợ các môn: ' + (hv?.mon_no ?? []).map(m => m.ten_mon || m.ma_mon).join(', ') + '. Hãy lập giúp tôi kế hoạch học lại hợp lý.')}
                    style={{ marginTop: 10, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>Lập kế hoạch học lại</button>
                )}
              </div>

              <div style={card}>
                <Title icon={<CalendarClock size={17} />}>Lịch thi sắp tới</Title>
                {thi == null && <div style={muted}>Đang tải…</div>}
                {thi && thi.length === 0 && <div style={muted}>Chưa có lịch thi sắp tới.</div>}
                {(thi ?? []).slice(0, 5).map((e, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '6px 0', borderBottom: '1px dashed #eef2f7', fontSize: '0.8rem' }}>
                    <span style={{ minWidth: 48, textAlign: 'center', padding: '3px 6px', borderRadius: 8, fontWeight: 800, fontSize: '0.72rem', background: e.days_left <= 3 ? '#fee2e2' : '#eff6ff', color: e.days_left <= 3 ? '#dc2626' : '#2563eb' }}>{e.days_left === 0 ? 'Hôm nay' : `${e.days_left} ngày`}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ color: '#1e293b', fontWeight: 600 }}>{e.ten_mon ?? e.ma_mon}</span><br />
                      <span style={muted}>{fmtNgay(e.ngay_thi)}{e.gio_bat_dau ? ` · ${e.gio_bat_dau}` : ''}{e.phong_thi ? ` · ${e.phong_thi}` : ''}</span>
                    </span>
                  </div>
                ))}
              </div>

              <div style={card}>
                <Title icon={<ClipboardCheck size={17} />} right={<button className="cvht-btn" onClick={() => navigate('/student/attendance')} style={{ padding: '3px 8px', background: 'none', border: 'none', color: '#2563eb' }}>Chi tiết</button>}>Chuyên cần</Title>
                {!cc || cc.tong_buoi === 0 ? <div style={muted}>Chưa có buổi điểm danh nào được ghi nhận.</div> : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ fontSize: '1.7rem', fontWeight: 800, color: CC_COLOR[cc.mau] ?? '#1e3a8a' }}>{cc.diem_chuyen_can ?? '—'}</span>
                      <span style={muted}>điểm chuyên cần · {cc.muc}</span>
                    </div>
                    <div style={muted}>Có mặt {cc.ty_le_co_mat ?? '—'}% · vắng {cc.vang}/{cc.tong_buoi} buổi</div>
                    {cc.canh_bao.slice(0, 2).map((c, i) => <div key={i} style={{ fontSize: '0.76rem', color: '#dc2626', marginTop: 4 }}>⚠ {c}</div>)}
                  </>
                )}
              </div>
            </div>

            {/* Sổ tư vấn · Thông báo · Khuyến nghị */}
            <div className="cvht-grid2">
              <div style={card}>
                <Title icon={<NotebookPen size={17} />}>Sổ tư vấn với CVHT</Title>
                {data.so_tu_van.length === 0 && <div style={muted}>Chưa có buổi tư vấn nào được CVHT ghi nhận.</div>}
                {data.so_tu_van.slice(0, 5).map(l => (
                  <div key={l.id} style={{ borderLeft: '3px solid ' + (l.trang_thai === 'hoan_thanh' ? '#10b981' : '#f59e0b'), padding: '4px 0 4px 10px', marginBottom: 10 }}>
                    <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{fmtNgay(l.ngay)} · {HINH_THUC[l.hinh_thuc] ?? l.hinh_thuc}{l.ten_cvht ? ` · ${l.ten_cvht}` : ''} · <b style={{ color: l.trang_thai === 'hoan_thanh' ? '#059669' : '#d97706' }}>{l.trang_thai === 'hoan_thanh' ? 'Hoàn thành' : 'Đang theo dõi'}</b></div>
                    <div style={{ fontSize: '0.82rem', color: '#1e293b', marginTop: 2 }}>{l.noi_dung}</div>
                    {l.khuyen_nghi && <div style={{ fontSize: '0.8rem', color: '#1d4ed8', marginTop: 2 }}>→ Khuyến nghị: {l.khuyen_nghi}</div>}
                    {l.ket_qua && <div style={{ fontSize: '0.78rem', color: '#059669', marginTop: 2 }}>✓ Kết quả: {l.ket_qua}</div>}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
                <div style={card}>
                  <Title icon={<Bell size={17} />}>Thông báo từ CVHT</Title>
                  {data.thong_bao.length === 0 && <div style={muted}>Chưa có thông báo nào từ CVHT.</div>}
                  {data.thong_bao.slice(0, 4).map(t => (
                    <div key={t.id} style={{ padding: '6px 0', borderBottom: '1px dashed #eef2f7' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: t.da_doc ? 600 : 800, color: '#1e293b' }}>{!t.da_doc && <span style={{ color: '#2563eb' }}>● </span>}{t.tieu_de}</div>
                      <div style={{ fontSize: '0.78rem', color: '#475569' }}>{t.noi_dung}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{t.luc}</div>
                    </div>
                  ))}
                </div>
                <div style={card}>
                  <Title icon={<Sparkles size={17} />}>Khuyến nghị gần nhất của chatbot</Title>
                  {data.khuyen_nghi?.summary
                    ? <div style={{ fontSize: '0.82rem', color: '#1e293b', lineHeight: 1.55 }}>{data.khuyen_nghi.summary}<div style={{ ...muted, fontSize: '0.7rem', marginTop: 4 }}>{new Date(data.khuyen_nghi.created_at * 1000).toLocaleString('vi-VN')}</div></div>
                    : <div style={muted}>Chưa có — hãy trò chuyện với chatbot CVHT để nhận khuyến nghị.</div>}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Hỏi CVHT — đủ mọi chức năng của chatbot cố vấn */}
        <div style={card}>
          <Title icon={<MessageCircle size={17} />}>Chatbot CVHT làm được gì cho bạn — bấm để hỏi ngay</Title>
          <div className="cvht-feat">
            {TINH_NANG.map(f => (
              <button key={f.ten} className="cvht-tile" onClick={() => hoi(f.hoi)} title={f.hoi}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 800, fontSize: '0.82rem', color: '#1e3a8a' }}><f.icon size={15} color="#2563eb" /> {f.ten}</div>
                <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 3 }}>{f.mo_ta}</div>
              </button>
            ))}
            <button className="cvht-tile" onClick={() => navigate('/laban')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 800, fontSize: '0.82rem', color: '#1e3a8a' }}><Compass size={15} color="#7c3aed" /> La bàn nghề nghiệp</div>
              <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 3 }}>Bản đồ CTĐT, định vị năng lực & % khớp nghề</div>
            </button>
          </div>
          <div style={{ ...muted, fontSize: '0.72rem', marginTop: 8 }}>Chatbot tra cứu trực tiếp Cổng thông tin bằng tài khoản của bạn. Mọi số liệu trên trang này chỉ bạn và CVHT của bạn xem được.</div>
        </div>
      </div>
    </div>
  );
};

export default StudentCvhtDashboard;
