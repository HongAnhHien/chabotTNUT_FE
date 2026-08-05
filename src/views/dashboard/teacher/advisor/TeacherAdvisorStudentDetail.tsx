import { type FC, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Loader2, GraduationCap, MessageCircle, Lightbulb, AlertTriangle, ShieldAlert, TrendingUp, TrendingDown, Layers, CreditCard, Megaphone } from 'lucide-react';
import AdvisorApi from '@/infra/chat/advisor_api';
import { ProxyPermissionError } from '@/infra/api/checkProxyError';
import type { IPortalStudentInfo, IAdvisorHistoryItem } from '@/infra/api/interfaces/IAdvisor';
import { riskTheme, RISK_FALLBACK } from './riskTheme';
import CSS from './advisor.styles';

// Đây là ĐIỂM PHẠT quy đổi (nghịch chiều: GPA/tiến độ càng kém → điểm càng cao),
// KHÔNG phải giá trị GPA thật — dễ nhầm với card GPA tích lũy/GPA HK gần ở trên.
// Trọng số tối đa theo RISK_SCORING.md.
// Tổng max = 100đ (2026-08-05): tuong_tac đã bị bỏ khỏi response, canh_cao cap tối đa 5đ
// (0 cảnh báo → 0/5, 1 → 4/5, ≥2 → 5/5) thay vì không giới hạn như trước.
const COMPONENT_CFG: Record<string, { label: string; max: number; icon: FC<{ size?: number; color?: string }>; accent: string; light: string }> = {
  gpa_tich_luy: { label: 'GPA tích lũy',      max: 30, icon: TrendingUp,   accent: '#2563eb', light: '#eff6ff' },
  gpa_hk_gan:   { label: 'GPA học kỳ gần',    max: 25, icon: TrendingDown, accent: '#7c3aed', light: '#f5f3ff' },
  tien_do:      { label: 'Tiến độ học',       max: 20, icon: Layers,       accent: '#0891b2', light: '#f0f9ff' },
  tc_no:        { label: 'Tín chỉ nợ',        max: 20, icon: CreditCard,   accent: '#ea580c', light: '#fff7ed' },
  canh_cao:     { label: 'Cảnh báo học vụ',   max: 5,  icon: Megaphone,    accent: '#dc2626', light: '#fef2f2' },
};

function fmtDate(unixSec: number) {
  const d = new Date(unixSec * 1000);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function initials(name: string) {
  const parts = name.trim().split(' ');
  return (parts.pop()?.[0] ?? '?').toUpperCase();
}

const BackBtn: FC<{ onClick: () => void; label: string }> = ({ onClick, label }) => (
  <button
    onClick={onClick}
    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 600, color: '#64748b', background: 'white', border: '1px solid #e2e8f0', borderRadius: 20, padding: '6px 14px', cursor: 'pointer', transition: 'all .15s', width: 'fit-content' }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.color = '#334155'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; }}
  >
    <ArrowLeft size={13} /> {label}
  </button>
);

const TeacherAdvisorStudentDetail: FC = () => {
  const { maSv } = useParams<{ maSv: string }>();
  const navigate = useNavigate();

  const [info,    setInfo]    = useState<IPortalStudentInfo | null>(null);
  const [history, setHistory] = useState<IAdvisorHistoryItem[]>([]);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [error,   setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!maSv) return;
    Promise.allSettled([
      AdvisorApi.getPortalStudentInfo(maSv),
      AdvisorApi.getUserHistory(maSv, 10),
      AdvisorApi.getLastRecommendation(maSv),
    ]).then(([infoRes, historyRes, recRes]) => {
      if (infoRes.status === 'fulfilled') {
        setInfo(infoRes.value.data);
      } else if (infoRes.reason instanceof ProxyPermissionError) {
        setError(infoRes.reason.message);
      }
      if (historyRes.status === 'fulfilled') setHistory(historyRes.value.data.history);
      if (recRes.status === 'fulfilled') setRecommendation(recRes.value.data.recommendation);
    }).finally(() => setLoading(false));
  }, [maSv]);

  if (loading) {
    return (
      <div className="adv-card" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
        <style>{CSS}</style>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(120deg,#1e3a8a,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 20px rgba(67,56,202,0.25)' }}>
          <Loader2 size={26} color="white" style={{ animation: 'adv-spin 1s linear infinite' }} />
        </div>
        <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Đang lấy dữ liệu sinh viên...</p>
        <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 6 }}>
          Tra cứu trực tiếp từ Cổng thông tin, có thể mất vài giây.
        </p>
      </div>
    );
  }

  if (error || !info) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <style>{CSS}</style>
        <BackBtn onClick={() => navigate('/teacher/advisor')} label="Quay lại" />
        <div className="adv-card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#7f1d1d,#dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: '0 6px 16px rgba(220,38,38,0.25)' }}>
            <AlertTriangle size={22} color="white" />
          </div>
          <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Không thể xem sinh viên này</p>
          <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4 }}>{error ?? 'Không tìm thấy dữ liệu.'}</p>
        </div>
      </div>
    );
  }

  const theme = info.risk ? riskTheme(info.risk.level) : RISK_FALLBACK;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <style>{CSS}</style>

      <BackBtn onClick={() => navigate('/teacher/advisor')} label="Quay lại danh sách" />

      {/* ── Hero header ── */}
      <div className="adv-hero" style={{ background: theme.grad }}>
        <div style={{ position: 'absolute', top: -40, right: -30, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 50, height: 50, borderRadius: 14, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backdropFilter: 'blur(4px)' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>{initials(info.ho_ten ?? maSv ?? '?')}</span>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'white', letterSpacing: '-0.01em' }}>{info.ho_ten ?? maSv}</p>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'rgba(255,255,255,0.85)' }}>{info.ma_sv ?? maSv} · {info.ma_lop}</p>
            </div>
          </div>
          {info.risk && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 700, padding: '7px 14px', borderRadius: 20, background: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(4px)' }}>
              <ShieldAlert size={13} /> {info.risk.label} · {info.risk.score} điểm
            </span>
          )}
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="adv-stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        {[
          { label: 'GPA tích lũy', value: info.diem_tbtl != null ? info.diem_tbtl.toFixed(1) : '—', tint: '#eff6ff', ink: '#2563eb' },
          { label: 'GPA HK gần',   value: info.dtb_hoc_ky_truoc != null ? info.dtb_hoc_ky_truoc.toFixed(1) : '—', tint: '#f5f3ff', ink: '#7c3aed' },
          { label: 'TC đã học',    value: info.tong_tc_da_hoc ?? '—', tint: '#f0fdf4', ink: '#16a34a' },
          { label: 'TC nợ',        value: info.so_tc_da_hoc_chua_dat ?? '—', tint: '#fff7ed', ink: '#ea580c' },
        ].map(s => (
          <div key={s.label} className="adv-stat-card">
            <div style={{ width: 42, height: 42, borderRadius: 12, background: s.tint, color: s.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <GraduationCap size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>{s.label}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.15, letterSpacing: '-0.02em' }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Risk components ── */}
      {info.risk && (
        <div className="adv-card" style={{ padding: 20 }}>
          <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>Thành phần điểm rủi ro</p>
          <p style={{ fontSize: '0.74rem', color: '#94a3b8', margin: '0 0 14px' }}>
            Điểm phạt quy đổi — GPA/tiến độ càng kém thì điểm càng cao (không phải giá trị GPA thật).
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            {Object.entries(info.risk.components).map(([key, val]) => {
              const cfg = COMPONENT_CFG[key];
              if (!cfg) return null;
              const Icon = cfg.icon;
              const pct = Math.min(100, Math.round((val / cfg.max) * 100));
              return (
                <div key={key} className="adv-component-card" style={{ background: cfg.light, border: `1px solid ${cfg.accent}22` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                    <Icon size={14} color={cfg.accent} />
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569' }}>{cfg.label}</span>
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: cfg.accent, marginBottom: 6 }}>
                    {val}<span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8' }}>/{cfg.max}</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 6, background: 'rgba(15,23,42,0.06)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, borderRadius: 6, background: cfg.accent, transition: 'width .5s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Recommendation ── */}
      <div className="adv-card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: 'linear-gradient(135deg,#78350f,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 3px 8px rgba(217,119,6,0.25)' }}>
            <Lightbulb size={14} color="white" />
          </div>
          <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Khuyến nghị gần nhất</p>
        </div>
        {recommendation ? (
          <p style={{ fontSize: '0.82rem', color: '#334155', whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.6 }}>{recommendation}</p>
        ) : (
          <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0 }}>Chưa có khuyến nghị nào cho sinh viên này.</p>
        )}
      </div>

      {/* ── History ── */}
      <div className="adv-card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 3px 8px rgba(37,99,235,0.25)' }}>
            <MessageCircle size={14} color="white" />
          </div>
          <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Lịch sử hỏi CVHT gần đây</p>
        </div>
        {history.length === 0 ? (
          <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0 }}>Chưa có lịch sử trò chuyện.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <p style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic', margin: '0 0 4px' }}>
              Vì lý do bảo mật, hệ thống không hiển thị nội dung câu hỏi/trả lời gốc — chỉ hiển thị thống kê.
            </p>
            {history.map((h, i) => (
              <div key={i} className="adv-history-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: '#64748b' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb', flexShrink: 0 }} />
                  {fmtDate(h.created_at)}
                </span>
                <span style={{ fontSize: '0.74rem', color: '#334155', fontWeight: 500 }}>{h.query_len} ký tự hỏi → {h.response_len} ký tự trả lời</span>
                {h.used_portal_data && (
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#059669', background: 'rgba(5,150,105,0.1)', borderRadius: 20, padding: '2px 8px' }}>
                    Dùng dữ liệu Portal
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherAdvisorStudentDetail;
