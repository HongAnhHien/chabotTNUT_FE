import { type FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Users, MessageCircle, AlertTriangle, GraduationCap, Loader2, ChevronRight, ShieldAlert } from 'lucide-react';
import AdvisorApi from '@/infra/chat/advisor_api';
import { ProxyPermissionError } from '@/infra/api/checkProxyError';
import type { IClassRiskResponse, IAdoptionRateResponse, IRiskOverviewResponse } from '@/infra/api/interfaces/IAdvisor';
import { riskTheme, RISK_THEME } from './riskTheme';
import CSS from './advisor.styles';

function initials(name: string) {
  const parts = name.trim().split(' ');
  return (parts.pop()?.[0] ?? '?').toUpperCase();
}

const TeacherAdvisorDashboard: FC = () => {
  const navigate = useNavigate();
  const [classRisk, setClassRisk] = useState<IClassRiskResponse['data'] | null>(null);
  const [adoption,  setAdoption]  = useState<IAdoptionRateResponse['data'] | null>(null);
  const [overview,  setOverview]  = useState<IRiskOverviewResponse['data'] | null>(null);
  const [error,     setError]     = useState<string | null>(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    // adoption-rate không phụ thuộc class-risk (gọi Portal riêng) nên chạy song song luôn
    // để giảm thời gian chờ — cả 2 endpoint đều gọi Portal thật, khá chậm (5-10s/lần).
    // Chỉ risk-overview phải đợi class-risk xong trước vì nó đọc cache do class-risk ghi ra.
    const classRiskPromise = AdvisorApi.getClassRisk()
      .then(cr => {
        setClassRisk(cr.data);
        return AdvisorApi.getRiskOverview();
      })
      .then(o => setOverview(o.data));

    const adoptionPromise = AdvisorApi.getAdoptionRate().then(a => setAdoption(a.data));

    Promise.allSettled([classRiskPromise, adoptionPromise])
      .then(results => {
        for (const r of results) {
          if (r.status === 'rejected' && r.reason instanceof ProxyPermissionError) {
            setError(r.reason.message);
            break;
          }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="adv-card" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
        <style>{CSS}</style>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(120deg,#1e3a8a,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 20px rgba(67,56,202,0.25)' }}>
          <Loader2 size={26} color="white" style={{ animation: 'adv-spin 1s linear infinite' }} />
        </div>
        <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Đang tổng hợp dữ liệu lớp...</p>
        <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 6 }}>
          Lấy dữ liệu từ Cổng thông tin sinh viên, có thể mất ít giây.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="adv-card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
        <style>{CSS}</style>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#7f1d1d,#dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: '0 6px 16px rgba(220,38,38,0.25)' }}>
          <ShieldAlert size={22} color="white" />
        </div>
        <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Không có quyền xem</p>
        <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4 }}>{error}</p>
      </div>
    );
  }

  if (!classRisk || classRisk.total === 0) {
    return (
      <div className="adv-card" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
        <style>{CSS}</style>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 8px 20px rgba(37,99,235,0.25)' }}>
          <GraduationCap size={26} color="white" strokeWidth={1.8} />
        </div>
        <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>Chưa phụ trách lớp CVHT nào</p>
        <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4, maxWidth: 360, marginLeft: 'auto', marginRight: 'auto' }}>
          Tài khoản này hiện chưa là cố vấn học tập của lớp nào trong học kỳ hiện tại.
        </p>
      </div>
    );
  }

  const pieData = (Object.keys(RISK_THEME) as (keyof typeof RISK_THEME)[])
    .map(key => ({ key, theme: riskTheme(key), count: classRisk.summary[key as keyof typeof classRisk.summary] }))
    .filter(d => d.count > 0);

  const students = [...classRisk.students].sort((a, b) => b.risk.score - a.risk.score);

  const atRiskPct = overview ? overview.at_risk_rate : (classRisk.summary.can_tu_van_som + classRisk.summary.nguy_co_cao) / classRisk.total * 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <style>{CSS}</style>

      {/* ── Hero header ── */}
      <div className="adv-hero" style={{ background: 'linear-gradient(120deg,#1e3a8a 0%,#4338ca 55%,#7c3aed 100%)' }}>
        <div style={{ position: 'absolute', top: -40, right: -30, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: -60, right: 80, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
          <div style={{ width: 46, height: 46, borderRadius: 13, background: 'rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backdropFilter: 'blur(4px)' }}>
            <GraduationCap size={24} color="white" strokeWidth={1.8} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Cố vấn học tập</h1>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'rgba(255,255,255,0.85)' }}>
              Học kỳ {classRisk.nhhk} · {classRisk.total} sinh viên phụ trách
            </p>
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="adv-stats-grid">
        <div className="adv-stat-card">
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Users size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>Tổng SV phụ trách</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.15, letterSpacing: '-0.02em' }}>{classRisk.total}</div>
          </div>
        </div>

        <div className="adv-stat-card">
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MessageCircle size={18} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>Đã dùng chatbot</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.15, letterSpacing: '-0.02em' }}>{adoption ? `${adoption.rate}%` : '—'}</div>
            {adoption && <div style={{ fontSize: '0.7rem', color: '#2563eb', fontWeight: 600 }}>{adoption.da_dung}/{adoption.total_sv} SV</div>}
          </div>
        </div>

        <div className="adv-stat-card">
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#fff7ed', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle size={18} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>SV nguy cơ</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.15, letterSpacing: '-0.02em' }}>{overview ? `${overview.at_risk_rate}%` : `${atRiskPct.toFixed(1)}%`}</div>
            {overview && <div style={{ fontSize: '0.7rem', color: '#ea580c', fontWeight: 600 }}>{overview.at_risk_count} SV</div>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {/* ── Risk donut ── */}
        <div className="adv-card" style={{ padding: 20, gridColumn: 'span 1' }}>
          <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }}>Phân loại mức độ rủi ro</p>
          {pieData.length === 0 ? (
            <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Chưa có dữ liệu.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="count" nameKey="key" innerRadius="52%" outerRadius="74%" paddingAngle={3}>
                  {pieData.map((d, i) => <Cell key={i} fill={d.theme.accent} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: '0.72rem', borderRadius: 8, border: '1px solid #e2e8f0' }} formatter={(v: unknown) => [v as number, 'SV']} />
                <Legend
                  content={() => (
                    <ul style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '4px 12px', margin: 0, padding: '8px 0 0', listStyle: 'none' }}>
                      {pieData.map(d => (
                        <li key={d.key} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', fontWeight: 600, color: d.theme.accent }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.theme.accent, flexShrink: 0 }} />
                          {d.theme.label} ({d.count})
                        </li>
                      ))}
                    </ul>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── Student list ── */}
        <div className="adv-card" style={{ padding: 20, gridColumn: 'span 2' }}>
          <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }}>Danh sách sinh viên</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 340, overflowY: 'auto', paddingRight: 2 }}>
            {students.map((s, i) => {
              const theme = riskTheme(s.risk.level);
              return (
                <button
                  key={s.ma_sv}
                  onClick={() => navigate(`/teacher/advisor/${s.ma_sv}`)}
                  className="adv-student-row"
                  style={{ animationDelay: `${Math.min(i, 12) * 0.03}s` }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: theme.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 3px 8px ${theme.glow}` }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'white' }}>{initials(s.ho_ten)}</span>
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>{s.ho_ten}</span>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{s.ma_sv}</span>
                    </div>
                    <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: '#64748b' }}>
                      {s.ma_lop} · GPA tích lũy: <span style={{ fontWeight: 800, color: '#334155' }}>{s.diem_tbtl != null ? s.diem_tbtl.toFixed(2) : '—'}</span>
                    </p>
                  </div>

                  <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: theme.light, color: theme.accent, flexShrink: 0, whiteSpace: 'nowrap' }}>
                    {s.risk.label}
                  </span>
                  <ChevronRight size={16} color="#94a3b8" style={{ flexShrink: 0 }} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherAdvisorDashboard;
