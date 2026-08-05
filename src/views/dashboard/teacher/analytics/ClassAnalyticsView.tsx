import { type FC, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Users, Bot, AlertTriangle, CheckCircle, ChevronDown, Clock, CalendarDays } from 'lucide-react';
import type { IClassAnalytics, IAttentionStudent, IScheduleItem } from '@/infra/api/interfaces/ITeacher';

// ── Constants ────────────────────────────────────────────
const WARN_CFG = {
  rat_nguy_co: { color:'#dc2626', bg:'rgba(220,38,38,0.09)', cls:'',       label:'Rất nguy cơ' },
  nguy_co:     { color:'#ea580c', bg:'rgba(234,88,12,0.09)',  cls:'orange',  label:'Nguy cơ' },
  nhe:         { color:'#d97706', bg:'rgba(217,119,6,0.09)',  cls:'yellow',  label:'Cần chú ý' },
} as const;

const EXAM_TYPE: Record<string, string> = {
  giua_ky:         'Giữa kỳ',
  kiem_tra_chuong: 'Kiểm tra chương',
  on_luyen_chuong: 'Ôn luyện chương',
};

const SCORE_COLORS = ['#dc2626','#ea580c','#d97706','#84cc16','#16a34a','#15803d','#94a3b8'];

const WARN_COLORS: Record<string, string> = {
  'Bình thường':      '#22c55e',
  'Cần chú ý':        '#d97706',
  'Nguy cơ':          '#ea580c',
  'Rất nguy cơ':      '#dc2626',
  'Chưa có đánh giá': '#94a3b8',
};

const AI_COLORS = ['#7c3aed','#94a3b8'];

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
}
function fmtDay(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth()+1}`;
}
function isPast(iso: string) { return new Date(iso) < new Date(); }

// ── Sub-components ───────────────────────────────────────
export const StatCard: FC<{ icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string; color?: string }> = ({ icon, label, value, sub, color = '#2563eb' }) => (
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

const AttentionRow: FC<{ student: IAttentionStudent }> = ({ student }) => {
  const [open, setOpen] = useState(false);
  const w = WARN_CFG[student.warning_level];
  return (
    <div
      className={`an-attention-row ${w.cls}`}
      style={{ cursor:'pointer' }}
      onClick={() => setOpen(v => !v)}
    >
      <div style={{ width:8, height:8, borderRadius:'50%', background:w.color, flexShrink:0, marginTop:5 }} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          <span style={{ fontWeight:700, fontSize:'0.84rem', color:'#0f172a' }}>{student.ho_ten}</span>
          <span style={{ fontSize:'0.7rem', color:'#94a3b8' }}>{student.ma_sinh_vien}</span>
          <span style={{ fontSize:'0.7rem', fontWeight:700, color:w.color, background:w.bg, borderRadius:20, padding:'1px 8px', whiteSpace:'nowrap' }}>
            {w.label}
          </span>
          {student.avg_score > 0 && (
            <span style={{ fontSize:'0.7rem', color:'#64748b' }}>TB: <b>{student.avg_score.toFixed(1)}</b></span>
          )}
          {student.pending_assignments > 0 && (
            <span style={{ fontSize:'0.7rem', color:'#64748b' }}>{student.pending_assignments} bài chưa nộp</span>
          )}
        </div>
        {open && (
          <ul style={{ margin:'8px 0 0', paddingLeft:16, display:'flex', flexDirection:'column', gap:3 }}>
            {student.warnings.map((msg, i) => (
              <li key={i} style={{ fontSize:'0.76rem', color:'#475569' }}>{msg}</li>
            ))}
          </ul>
        )}
      </div>
      <ChevronDown size={14} color="#94a3b8" style={{ flexShrink:0, marginTop:3, transition:'transform .2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
    </div>
  );
};

const ScheduleCard: FC<{ item: IScheduleItem }> = ({ item }) => {
  const [open, setOpen] = useState(false);
  const pct = item.total_students > 0 ? Math.round(item.submitted / item.total_students * 100) : 0;
  const overdue = isPast(item.due_at);
  return (
    <div className="an-schedule-card">
      <div className="an-schedule-header" onClick={() => setOpen(v => !v)}>
        <div style={{ width:36, height:36, borderRadius:9, background: overdue ? 'rgba(220,38,38,0.08)' : 'rgba(37,99,235,0.08)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <CalendarDays size={16} color={overdue ? '#dc2626' : '#2563eb'} />
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:7, flexWrap:'wrap' }}>
            <span style={{ fontWeight:700, fontSize:'0.86rem', color:'#0f172a' }}>{item.title}</span>
            <span style={{ fontSize:'0.7rem', fontWeight:700, color:'#7c3aed', background:'rgba(124,58,237,0.08)', borderRadius:5, padding:'1px 7px' }}>
              {EXAM_TYPE[item.exam_type] ?? item.exam_type}
            </span>
            {overdue && item.pending_count > 0 && (
              <span style={{ fontSize:'0.7rem', fontWeight:700, color:'#dc2626', background:'rgba(220,38,38,0.08)', borderRadius:5, padding:'1px 7px' }}>
                {item.pending_count} chưa nộp
              </span>
            )}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:5, flexWrap:'wrap' }}>
            <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:'0.72rem', color:'#64748b' }}>
              <Clock size={11} />{fmtDate(item.available_from)} → {fmtDate(item.due_at)}
            </span>
            <span style={{ fontSize:'0.72rem', color:'#64748b' }}>{item.submitted}/{item.total_students} đã nộp</span>
          </div>
          <div style={{ marginTop:6 }}>
            <div className="an-progress-bar">
              <div className="an-progress-fill" style={{ width:`${pct}%`, background: pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444' }} />
            </div>
          </div>
        </div>
        {item.pending_count > 0 && (
          <ChevronDown size={14} color="#94a3b8" style={{ flexShrink:0, transition:'transform .2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
        )}
      </div>
      {open && item.pending_students.length > 0 && (
        <div style={{ borderTop:'1px solid #f1f5f9', background:'#fafbfd', padding:'10px 14px', animation:'an-expand .2s ease both' }}>
          <div style={{ fontSize:'0.7rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>
            Chưa nộp ({item.pending_students.length})
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {item.pending_students.map(s => (
              <div key={s.ma_sinh_vien} style={{ display:'flex', alignItems:'center', gap:8, fontSize:'0.78rem' }}>
                <div style={{ width:24, height:24, borderRadius:7, background:'rgba(220,38,38,0.08)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span style={{ fontSize:'0.7rem', fontWeight:700, color:'#dc2626' }}>{s.ho_ten.split(' ').pop()?.[0] ?? '?'}</span>
                </div>
                <span style={{ fontWeight:600, color:'#1e293b' }}>{s.ho_ten}</span>
                <span style={{ color:'#94a3b8', fontSize:'0.72rem' }}>{s.ma_sinh_vien}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Chart helper ─────────────────────────────────────────
const ChartCard: FC<{ title: string; children: React.ReactNode; style?: React.CSSProperties }> = ({ title, children, style }) => (
  <div className="an-chart-card" style={style}>
    <div style={{ fontSize:'0.74rem', fontWeight:700, color:'#1e293b', marginBottom:10 }}>{title}</div>
    {children}
  </div>
);

// ── Main view ─────────────────────────────────────────────
interface Props { data: IClassAnalytics; compact?: boolean }

const ClassAnalyticsView: FC<Props> = ({ data, compact = false }) => {
  const aiPct       = data.total_students > 0 ? Math.round(data.ai_users / data.total_students * 100) : 0;
  const completion  = data.assignments.completion_rate;
  const ch          = data.charts;
  const chartH      = compact ? 150 : 180;
  // "Chưa có đánh giá" hiển thị cuối cùng (sau "Rất nguy cơ") — tách biệt khỏi
  // dải mức độ cảnh báo chính (Bình thường → Rất nguy cơ) đứng liền nhau trước.
  const warningBreakdown = ch
    ? [...ch.warning_breakdown].sort((a, b) =>
        (a.level === 'chua_danh_gia' ? 1 : 0) - (b.level === 'chua_danh_gia' ? 1 : 0)
      )
    : [];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap: compact ? 14 : 20 }}>

      {/* ── Stat cards ── */}
      <div className="an-stat-grid">
        <StatCard icon={<Users       size={15} color="#2563eb" />} label="Học sinh"   color="#2563eb" value={data.total_students} />
        <StatCard icon={<Bot         size={15} color="#7c3aed" />} label="Dùng AI"    color="#7c3aed" value={data.ai_users}       sub={`${aiPct}% tổng lớp`} />
        <StatCard icon={<AlertTriangle size={15} color="#ea580c" />} label="Cần chú ý" color="#ea580c" value={data.attention_count} sub={data.attention_count > 0 ? 'học sinh' : 'Tốt'} />
        <StatCard icon={<CheckCircle size={15} color="#16a34a" />} label="Hoàn thành" color="#16a34a" value={`${completion.toFixed(0)}%`} sub={`${data.assignments.total_submitted} lượt nộp`} />
      </div>

      {/* ── Overall progress ── */}
      <div className="an-card" style={{ padding:'14px 18px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
          <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#1e293b' }}>Tỉ lệ hoàn thành bài tập</span>
          <span style={{ fontSize:'0.78rem', fontWeight:700, color: completion >= 80 ? '#16a34a' : completion >= 50 ? '#d97706' : '#dc2626' }}>
            {completion.toFixed(1)}%
          </span>
        </div>
        <div className="an-progress-bar" style={{ height:10 }}>
          <div className="an-progress-fill" style={{ width:`${completion}%`, background: completion >= 80 ? '#22c55e' : completion >= 50 ? '#f59e0b' : '#ef4444' }} />
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:5 }}>
          <span style={{ fontSize:'0.7rem', color:'#94a3b8' }}>{data.assignments.total} bài kiểm tra</span>
          <span style={{ fontSize:'0.7rem', color:'#94a3b8' }}>{data.assignments.total_submitted} lượt nộp</span>
        </div>
      </div>

      {/* ── Charts ── */}
      {ch && (
        <>
          {/* Row 1: Score distribution + AI usage */}
          <div className="an-chart-grid">

            <ChartCard title="Phân bố điểm học sinh">
              <ResponsiveContainer width="100%" height={chartH}>
                <BarChart data={ch.score_distribution} margin={{ top:4, right:4, left:-28, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize:11, fill:'#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ fontSize:'0.72rem', borderRadius:8, border:'1px solid #e2e8f0', boxShadow:'0 4px 12px rgba(0,0,0,0.08)' }}
                    formatter={(v: unknown) => [v as number, 'Học sinh']}
                  />
                  <Bar dataKey="count" radius={[4,4,0,0]} maxBarSize={36}>
                    {ch.score_distribution.map((_, i) => (
                      <Cell key={i} fill={SCORE_COLORS[i] ?? '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Tỉ lệ dùng AI">
              <ResponsiveContainer width="100%" height={chartH}>
                <PieChart>
                  <Pie
                    data={ch.ai_usage}
                    dataKey="count"
                    nameKey="label"
                    innerRadius="50%"
                    outerRadius="72%"
                    paddingAngle={3}
                  >
                    {ch.ai_usage.map((_, i) => <Cell key={i} fill={AI_COLORS[i] ?? '#e2e8f0'} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ fontSize:'0.72rem', borderRadius:8, border:'1px solid #e2e8f0' }}
                    formatter={(v: unknown) => [v as number, 'Học sinh']}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:'0.72rem' }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

          </div>

          {/* Row 2: Completion by type + Warning breakdown */}
          <div className="an-chart-grid">

            <ChartCard title="Hoàn thành theo loại bài">
              <ResponsiveContainer width="100%" height={chartH}>
                <BarChart data={ch.completion_by_type} margin={{ top:4, right:4, left:-20, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize:11, fill:'#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis domain={[0,100]} tick={{ fontSize:11, fill:'#94a3b8' }} tickLine={false} axisLine={false} unit="%" />
                  <Tooltip
                    contentStyle={{ fontSize:'0.72rem', borderRadius:8, border:'1px solid #e2e8f0' }}
                    formatter={(v: unknown) => [`${(v as number).toFixed(1)}%`, 'Hoàn thành']}
                  />
                  <Bar dataKey="completion_rate" fill="#2563eb" radius={[4,4,0,0]} maxBarSize={40} opacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Phân bố cảnh báo">
              <ResponsiveContainer width="100%" height={chartH}>
                <PieChart>
                  <Pie
                    data={warningBreakdown}
                    dataKey="count"
                    nameKey="label"
                    innerRadius="50%"
                    outerRadius="72%"
                    paddingAngle={3}
                  >
                    {warningBreakdown.map((entry, i) => (
                      <Cell key={i} fill={WARN_COLORS[entry.label] ?? '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ fontSize:'0.72rem', borderRadius:8, border:'1px solid #e2e8f0' }}
                    formatter={(v: unknown) => [v as number, 'Học sinh']}
                  />
                  <Legend
                    content={() => (
                      <ul style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:'4px 12px', margin:0, padding:'8px 0 0', listStyle:'none' }}>
                        {warningBreakdown.map(entry => {
                          const color = WARN_COLORS[entry.label] ?? '#94a3b8';
                          return (
                            <li key={entry.label} style={{ display:'flex', alignItems:'center', gap:5, fontSize:'0.72rem', color }}>
                              <span style={{ width:8, height:8, borderRadius:'50%', background: color, flexShrink:0 }} />
                              {entry.label}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

          </div>

          {/* Row 3: Submission trend — full width */}
          {ch.submission_trend.length > 0 && (
            <ChartCard title="Xu hướng nộp bài (30 ngày gần nhất)">
              <ResponsiveContainer width="100%" height={130}>
                <LineChart data={ch.submission_trend} margin={{ top:4, right:8, left:-28, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={fmtDay} tick={{ fontSize:11, fill:'#94a3b8' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
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
        </>
      )}

      {/* ── Attention students ── */}
      {data.attention_count > 0 && (
        <div className="an-section">
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
            <AlertTriangle size={14} color="#ea580c" />
            <span style={{ fontSize:'0.82rem', fontWeight:700, color:'#1e293b' }}>Học sinh cần chú ý</span>
            <span style={{ fontSize:'0.7rem', fontWeight:700, color:'#ea580c', background:'rgba(234,88,12,0.1)', borderRadius:20, padding:'1px 8px' }}>
              {data.attention_count}
            </span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {data.attention_students.map(s => <AttentionRow key={s.ma_sinh_vien} student={s} />)}
          </div>
        </div>
      )}

      {/* ── Schedule ── */}
      {data.schedule.length > 0 && (
        <div className="an-section">
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
            <CalendarDays size={14} color="#2563eb" />
            <span style={{ fontSize:'0.82rem', fontWeight:700, color:'#1e293b' }}>Lịch bài kiểm tra</span>
            <span style={{ fontSize:'0.7rem', fontWeight:600, color:'#64748b' }}>{data.schedule.length} bài</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {data.schedule.map(item => <ScheduleCard key={item.assignment_id} item={item} />)}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassAnalyticsView;
