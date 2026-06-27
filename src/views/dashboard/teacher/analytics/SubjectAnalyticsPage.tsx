import { type FC, useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell,
} from 'recharts';
import { ArrowLeft, Loader2, BookOpen, Users, Bot, AlertTriangle, CheckCircle, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import TeacherApi from '@/infra/teacher/teacher_api';
import type { ISubjectAnalytics, IClassAnalytics } from '@/infra/api/interfaces/ITeacher';
import CSS from './analytics.styles';
import ClassAnalyticsView from './ClassAnalyticsView';

const SCORE_DIST_COLORS = ['#dc2626','#ea580c','#d97706','#84cc16','#16a34a','#15803d','#94a3b8'];

function fmtDay(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth()+1}`;
}

// ── Shared stat card ─────────────────────────────────────
const StatCard: FC<{ icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string; color?: string }> = ({ icon, label, value, sub, color = '#2563eb' }) => (
  <div className="an-stat-card">
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <div style={{ width:32, height:32, borderRadius:9, background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        {icon}
      </div>
      <span style={{ fontSize:'0.72rem', fontWeight:600, color:'#64748b' }}>{label}</span>
    </div>
    <div style={{ fontSize:'1.4rem', fontWeight:800, color:'#0f172a', lineHeight:1.1 }}>{value}</div>
    {sub && <div style={{ fontSize:'0.7rem', color:'#94a3b8' }}>{sub}</div>}
  </div>
);

const ChartCard: FC<{ title: string; children: React.ReactNode; style?: React.CSSProperties }> = ({ title, children, style }) => (
  <div className="an-chart-card" style={style}>
    <div style={{ fontSize:'0.74rem', fontWeight:700, color:'#1e293b', marginBottom:10 }}>{title}</div>
    {children}
  </div>
);

// ── Class accordion ──────────────────────────────────────
const COLORS = ['#2563eb','#7c3aed','#059669','#ea580c','#0891b2','#db2777','#d97706','#4f46e5'];

const ClassAccordion: FC<{ cls: IClassAnalytics; colorIdx: number }> = ({ cls, colorIdx }) => {
  const [open, setOpen] = useState(false);
  const color = COLORS[colorIdx % COLORS.length];
  const pct   = cls.assignments.completion_rate;
  return (
    <div className="an-class-accordion">
      <div className="an-class-acc-header" onClick={() => setOpen(v => !v)}>
        <div style={{ width:8, height:8, borderRadius:'50%', background:color, flexShrink:0 }} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <span style={{ fontWeight:700, fontSize:'0.88rem', color:'#0f172a' }}>{cls.ten_lop}</span>
            <span style={{ fontSize:'0.7rem', color:'#64748b' }}>{cls.total_students} học sinh</span>
            {cls.attention_count > 0 && (
              <span style={{ fontSize:'0.66rem', fontWeight:700, color:'#ea580c', background:'rgba(234,88,12,0.1)', borderRadius:20, padding:'1px 8px' }}>
                {cls.attention_count} cần chú ý
              </span>
            )}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:6 }}>
            <div style={{ flex:1, height:4, borderRadius:2, background:'#e2e8f0', overflow:'hidden' }}>
              <div style={{ height:'100%', borderRadius:2, width:`${pct}%`, background: pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444', transition:'width .5s ease' }} />
            </div>
            <span style={{ fontSize:'0.68rem', color:'#64748b', whiteSpace:'nowrap', flexShrink:0 }}>{pct.toFixed(0)}%</span>
          </div>
        </div>
        <ChevronDown size={15} color="#94a3b8" style={{ flexShrink:0, transition:'transform .22s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </div>
      {open && (
        <div style={{ borderTop:'1px solid #f1f5f9', background:'#f8fafc', padding:'16px 18px', animation:'an-expand .22s ease both' }}>
          <ClassAnalyticsView data={cls} compact />
        </div>
      )}
    </div>
  );
};

// ── Page ─────────────────────────────────────────────────
const SubjectAnalyticsPage: FC = () => {
  const { maMon }    = useParams<{ maMon: string }>();
  const navigate     = useNavigate();
  const [params]     = useSearchParams();
  const hocKy        = params.get('hoc_ky') ? Number(params.get('hoc_ky')) : undefined;

  const [data,    setData]    = useState<ISubjectAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!maMon) return;
    TeacherApi.getSubjectAnalytics(maMon, hocKy)
      .then(res => setData(res.data))
      .catch(() => toast.error('Không thể tải dữ liệu môn học.'))
      .finally(() => setLoading(false));
  }, [maMon, hocKy]);

  const aiPct  = data && data.total_students > 0 ? Math.round(data.ai_users / data.total_students * 100) : 0;
  const ch     = data?.charts;

  return (
    <div style={{ minHeight:'100%', background:'#f4f6fb' }}>
      <style>{CSS}</style>

      {/* Sticky header */}
      <div className="an-sticky-header">
        <div className="an-header-inner">
          <button className="an-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={13} /> Quay lại
          </button>
          {data && (
            <>
              <div style={{ width:1, height:20, background:'#e2e8f0', flexShrink:0 }} />
              <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
                <div style={{ width:32, height:32, borderRadius:9, background:'linear-gradient(135deg,#1e3a8a,#2563eb)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <BookOpen size={16} color="white" strokeWidth={1.8} />
                </div>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontWeight:800, fontSize:'0.95rem', color:'#0f172a' }}>{data.ten_mon}</div>
                  <div style={{ fontSize:'0.7rem', color:'#64748b', marginTop:1 }}>{data.ma_mon} · {data.total_classes} lớp</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="an-content">
        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', alignItems:'center', padding:'5rem', gap:10, color:'#64748b', fontSize:'0.85rem' }}>
            <Loader2 size={20} color="#2563eb" style={{ animation:'an-spin 1s linear infinite' }} />
            Đang tải...
          </div>
        ) : data ? (
          <>
            {/* Stat cards */}
            <div className="an-stat-grid">
              <StatCard icon={<Users         size={15} color="#2563eb" />} label="Học sinh"   color="#2563eb" value={data.total_students} sub={`${data.total_classes} lớp`} />
              <StatCard icon={<Bot           size={15} color="#7c3aed" />} label="Dùng AI"    color="#7c3aed" value={data.ai_users}       sub={`${aiPct}% tổng`} />
              <StatCard icon={<AlertTriangle size={15} color="#ea580c" />} label="Cần chú ý"  color="#ea580c" value={data.attention_count} sub={data.attention_count > 0 ? 'học sinh' : 'Tốt'} />
              <StatCard icon={<CheckCircle   size={15} color="#16a34a" />} label="Hoàn thành" color="#16a34a" value={`${data.assignments.completion_rate.toFixed(0)}%`} sub={`${data.assignments.total_submitted} lượt nộp`} />
            </div>

            {/* Overall progress */}
            <div className="an-card" style={{ padding:'14px 18px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#1e293b' }}>Tỉ lệ hoàn thành toàn môn</span>
                <span style={{ fontSize:'0.78rem', fontWeight:700, color: data.assignments.completion_rate >= 80 ? '#16a34a' : data.assignments.completion_rate >= 50 ? '#d97706' : '#dc2626' }}>
                  {data.assignments.completion_rate.toFixed(1)}%
                </span>
              </div>
              <div className="an-progress-bar" style={{ height:10 }}>
                <div className="an-progress-fill" style={{ width:`${data.assignments.completion_rate}%`, background: data.assignments.completion_rate >= 80 ? '#22c55e' : data.assignments.completion_rate >= 50 ? '#f59e0b' : '#ef4444' }} />
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:5 }}>
                <span style={{ fontSize:'0.68rem', color:'#94a3b8' }}>{data.assignments.total} bài kiểm tra</span>
                <span style={{ fontSize:'0.68rem', color:'#94a3b8' }}>{data.assignments.total_submitted} lượt nộp</span>
              </div>
            </div>

            {/* Subject-level charts */}
            {ch && (
              <>
                {/* Row 1: Score by class + Attention by class */}
                <div className="an-chart-grid">
                  {ch.score_by_class.length > 0 && (
                    <ChartCard title="So sánh các lớp">
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={ch.score_by_class} margin={{ top:4, right:4, left:-20, bottom:0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="label" tick={{ fontSize:9, fill:'#94a3b8' }} tickLine={false} axisLine={false} />
                          <YAxis domain={[0,100]} tick={{ fontSize:9, fill:'#94a3b8' }} tickLine={false} axisLine={false} unit="%" />
                          <Tooltip
                            contentStyle={{ fontSize:'0.72rem', borderRadius:8, border:'1px solid #e2e8f0' }}
                            formatter={(v: unknown) => [`${(v as number).toFixed(1)}%`, '']}
                          />
                          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:'0.7rem' }} />
                          <Bar dataKey="completion_rate" name="Hoàn thành" fill="#2563eb" radius={[4,4,0,0]} maxBarSize={28} opacity={0.85} />
                          <Bar dataKey="ai_rate"         name="Dùng AI"    fill="#7c3aed" radius={[4,4,0,0]} maxBarSize={28} opacity={0.85} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartCard>
                  )}

                  {ch.attention_by_class.length > 0 && (
                    <ChartCard title="Cảnh báo theo lớp">
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={ch.attention_by_class} margin={{ top:4, right:4, left:-20, bottom:0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="label" tick={{ fontSize:9, fill:'#94a3b8' }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fontSize:9, fill:'#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                          <Tooltip
                            contentStyle={{ fontSize:'0.72rem', borderRadius:8, border:'1px solid #e2e8f0' }}
                            formatter={(v: unknown) => [v as number, 'Học sinh']}
                          />
                          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:'0.7rem' }} />
                          <Bar dataKey="nhe"         name="Cần chú ý"   fill="#d97706" stackId="a" />
                          <Bar dataKey="nguy_co"     name="Nguy cơ"      fill="#ea580c" stackId="a" />
                          <Bar dataKey="rat_nguy_co" name="Rất nguy cơ" fill="#dc2626" stackId="a" radius={[4,4,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartCard>
                  )}
                </div>

                {/* Row 2: Score distribution + Submission trend */}
                <div className="an-chart-grid">
                  {ch.score_distribution.length > 0 && (
                    <ChartCard title="Phân bố điểm toàn môn">
                      <ResponsiveContainer width="100%" height={170}>
                        <BarChart data={ch.score_distribution} margin={{ top:4, right:4, left:-28, bottom:0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="label" tick={{ fontSize:9, fill:'#94a3b8' }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fontSize:9, fill:'#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                          <Tooltip
                            contentStyle={{ fontSize:'0.72rem', borderRadius:8, border:'1px solid #e2e8f0' }}
                            formatter={(v: unknown) => [v as number, 'Học sinh']}
                          />
                          <Bar dataKey="count" radius={[4,4,0,0]} maxBarSize={36}>
                            {ch.score_distribution.map((_, i) => (
                              <Cell key={i} fill={SCORE_DIST_COLORS[i] ?? '#94a3b8'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartCard>
                  )}

                  {ch.submission_trend.length > 0 && (
                    <ChartCard title="Xu hướng nộp bài">
                      <ResponsiveContainer width="100%" height={170}>
                        <LineChart data={ch.submission_trend} margin={{ top:4, right:8, left:-28, bottom:0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="date" tickFormatter={fmtDay} tick={{ fontSize:9, fill:'#94a3b8' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                          <YAxis tick={{ fontSize:9, fill:'#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                          <Tooltip
                            contentStyle={{ fontSize:'0.72rem', borderRadius:8, border:'1px solid #e2e8f0' }}
                            formatter={(v: unknown) => [v as number, 'Bài nộp']}
                            labelFormatter={d => typeof d === 'string' ? d : String(d)}
                          />
                          <Line dataKey="count" stroke="#2563eb" strokeWidth={2} dot={false} activeDot={{ r:4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartCard>
                  )}
                </div>
              </>
            )}

            {/* By class accordion */}
            {data.by_class.length > 0 && (
              <div className="an-section">
                <div style={{ fontSize:'0.82rem', fontWeight:700, color:'#1e293b', marginBottom:10 }}>Chi tiết theo lớp</div>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {data.by_class.map((cls, i) => (
                    <ClassAccordion key={cls.id_to_hoc} cls={cls} colorIdx={i} />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="an-card" style={{ padding:'3rem', textAlign:'center', color:'#94a3b8', fontSize:'0.85rem' }}>
            Không có dữ liệu
          </div>
        )}
      </div>
    </div>
  );
};

export default SubjectAnalyticsPage;
