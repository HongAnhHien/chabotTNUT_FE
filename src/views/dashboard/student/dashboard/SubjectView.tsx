import { type FC } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  ComposedChart, Line, Legend, ReferenceLine,
} from 'recharts';
import { useNavigate } from 'react-router';
import { ArrowLeft, CheckCircle2, TrendingUp, Zap, ClipboardList, Calendar, AlertTriangle } from 'lucide-react';
import type { IDashboardSubjectData } from '@/infra/api/interfaces/IDashboard';
import type { IStudentAssignmentListItem } from '@/infra/api/interfaces/IAssignment';
import { scoreColor, fmt1, fmtDate, levelCfg, EXAM_TYPE_COLOR, EXAM_TYPE_LABEL } from './dashboard.constants';
import StatCard from './StatCard';
import DonutRing from './DonutRing';
import MiniLineChart from './MiniLineChart';
import ActivityHeatmap from './ActivityHeatmap';
import ExamCalendar from './ExamCalendar';

interface SubjectViewProps {
  data: IDashboardSubjectData;
  assignments: IStudentAssignmentListItem[];
  maMon: string;
  tenMon: string;
}

const SubjectView: FC<SubjectViewProps> = ({ data, assignments, maMon, tenMon }) => {
  const navigate = useNavigate();
  const { exams, chatbot, assignments: asgn, progress } = data;
  const lvl              = levelCfg(progress.level);
  const subjectAssignments = assignments.filter(a => a.ma_mon === maMon);
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
  const msgMap = new Map(chatbot.recent_7_days.map(d => [d.date, d.messages]));
  const chartDays = last7Days.map(date => ({ date, messages: msgMap.get(date) ?? 0 }));

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      {/* Back + title */}
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={() => navigate('/student/dashboard')}
          style={{ width:32, height:32, borderRadius:10, border:'1.5px solid rgba(41,102,235,0.15)', background:'rgba(41,102,235,0.04)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#2966EB', flexShrink:0 }}>
          <ArrowLeft size={14} />
        </button>
        <div>
          <div style={{ fontSize:'0.65rem', color:'#94a3b8', marginBottom:1 }}>Dashboard &rsaquo; Môn học</div>
          <div style={{ fontWeight:800, fontSize:'0.95rem', color:'#0f172a' }}>{tenMon !== maMon ? tenMon : maMon}</div>
        </div>
      </div>

      {/* 4 Stat cards */}
      <div className="sd-grid-4">
        <StatCard icon={ClipboardList} iconColor="#2966EB" label="Tổng bài được giao" value={exams.total_assigned}             delay={0}    />
        <StatCard icon={CheckCircle2}  iconColor="#16a34a" label="Đã nộp"             value={exams.submitted}                   delay={0.06} />
        <StatCard icon={TrendingUp}    iconColor="#0891b2" label="Điểm trung bình"    value={fmt1(exams.avg_score)}   sub="/10" delay={0.12} />
        <StatCard icon={Zap}           iconColor="#d97706" label="Điểm cao nhất"      value={fmt1(exams.highest_score)} sub="/10" delay={0.18} />
      </div>

      {/* Row 2: Donut | Level+Trend | Chatbot */}
      <div className="sd-grid-3" style={{ alignItems:'stretch' }}>
        {/* Donut */}
        <div className="sd-card" style={{ padding:'16px 18px', display:'flex', flexDirection:'column' }}>
          <div style={{ fontWeight:700, fontSize:'0.8rem', color:'#1e3a8a', marginBottom:12 }}>Tiến độ hoàn thành</div>
          <div style={{ display:'flex', flex:1, minHeight:0, gap:12 }}>
            <DonutRing completed={asgn.completed} pending={asgn.pending} overdue={asgn.overdue} />
            <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', gap:6 }}>
              {[
                { label:'Hoàn thành', count:asgn.completed, color:'#16a34a' },
                { label:'Đang chờ',   count:asgn.pending,   color:'#94a3b8' },
                { label:'Quá hạn',    count:asgn.overdue,   color:'#dc2626' },
              ].map(item => (
                <div key={item.label} style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:item.color, flexShrink:0 }} />
                  <span style={{ fontSize:'0.7rem', color:'#64748b', flex:1 }}>{item.label}</span>
                  <span style={{ fontSize:'0.72rem', fontWeight:700, color:'#1e293b' }}>{item.count}</span>
                </div>
              ))}
              <div style={{ marginTop:4, fontSize:'0.62rem', color:'#94a3b8' }}>
                Kỳ này: {exams.this_semester.submitted}/{exams.this_semester.exams_created} bài
              </div>
            </div>
          </div>
        </div>

        {/* Level + trend */}
        <div className="sd-card" style={{ padding:'16px 18px', display:'flex', flexDirection:'column' }}>
          <div style={{ fontWeight:700, fontSize:'0.8rem', color:'#1e3a8a', marginBottom:10 }}>Học lực</div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10, flexShrink:0 }}>
            <span style={{ display:'inline-flex', padding:'4px 14px', borderRadius:20, fontSize:'0.78rem', fontWeight:800, background:lvl.bg, color:lvl.color }}>{lvl.label}</span>
            <div style={{ fontSize:'1.6rem', fontWeight:900, color:'#0f172a', lineHeight:1 }}>{fmt1(progress.avg_score)}</div>
            <span style={{ fontSize:'0.65rem', color:'#94a3b8', marginTop:6 }}>/10</span>
          </div>
          <div style={{ flex:1, minHeight:80, position:'relative' }}>
            <div style={{ position:'absolute', inset:0 }}>
              <MiniLineChart trend={progress.score_trend} />
            </div>
          </div>
          {progress.score_trend.length > 0 && (
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:4, fontSize:'0.58rem', color:'#94a3b8', flexShrink:0 }}>
              <span>{fmtDate(progress.score_trend[0].created_at)}</span>
              <span>{fmtDate(progress.score_trend[progress.score_trend.length - 1].created_at)}</span>
            </div>
          )}
        </div>

        {/* Chatbot */}
        <div className="sd-card" style={{ padding:'16px 18px', display:'flex', flexDirection:'column' }}>
          <div style={{ fontWeight:700, fontSize:'0.8rem', color:'#1e3a8a', marginBottom:14 }}>Hoạt động hỏi đáp AI</div>
          <div style={{ display:'flex', gap:12, marginBottom:16 }}>
            <div style={{ flex:1, background:'rgba(124,58,237,0.06)', borderRadius:10, padding:'10px 12px' }}>
              <div style={{ fontSize:'1.25rem', fontWeight:800, color:'#7c3aed', lineHeight:1 }}>{chatbot.total_sessions}</div>
              <div style={{ fontSize:'0.65rem', color:'#7c3aed', opacity:0.75, marginTop:3 }}>Cuộc hội thoại</div>
            </div>
            <div style={{ flex:1, background:'rgba(41,102,235,0.06)', borderRadius:10, padding:'10px 12px' }}>
              <div style={{ fontSize:'1.25rem', fontWeight:800, color:'#2966EB', lineHeight:1 }}>{chatbot.total_messages}</div>
              <div style={{ fontSize:'0.65rem', color:'#2966EB', opacity:0.75, marginTop:3 }}>Câu hỏi đã hỏi</div>
            </div>
          </div>
          <div style={{ fontSize:'0.65rem', color:'#94a3b8', marginBottom:4, fontWeight:600 }}>7 ngày gần nhất</div>
          <div style={{ flex:1 }}>
            <ResponsiveContainer width="100%" height={90}>
              <BarChart data={chartDays} margin={{ top:8, right:4, left:-28, bottom:0 }} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tickFormatter={(d: string) => d.slice(5).replace('-', '/')} tick={{ fontSize:9, fill:'#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize:9, fill:'#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ fontSize:'0.72rem', borderRadius:8, border:'1px solid #eef0f5', boxShadow:'0 4px 12px rgba(0,0,0,0.08)' }}
                  formatter={(v: unknown) => [v as number, 'Câu hỏi']}
                  labelFormatter={(d) => typeof d === 'string' ? d.slice(5).replace('-', '/') : String(d ?? '')}
                  labelStyle={{ color:'#64748b', fontWeight:600 }}
                />
                <Bar dataKey="messages" fill="#7c3aed" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Exam types */}
      <div className="sd-card" style={{ padding:'16px 18px' }}>
        <div style={{ fontWeight:700, fontSize:'0.82rem', color:'#1e3a8a', marginBottom:14 }}>Điểm theo loại bài</div>
        <ResponsiveContainer width="100%" height={180}>
          <ComposedChart
            data={(['giua_ky', 'kiem_tra_chuong', 'on_luyen_chuong'] as const).map(et => {
              const t = exams.by_exam_type.find(x => x.exam_type === et);
              return {
                name: EXAM_TYPE_LABEL[et],
                'Đã nộp': t?.submitted ?? 0,
                'Tổng':   t?.total     ?? 0,
                'Điểm TB': t?.avg_score_10 ?? null,
              };
            })}
            margin={{ top:8, right:16, left:-16, bottom:0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize:10, fill:'#64748b' }} tickLine={false} axisLine={false} />
            <YAxis yAxisId="count" tick={{ fontSize:9, fill:'#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
            <YAxis yAxisId="score" orientation="right" domain={[0, 10]} tick={{ fontSize:9, fill:'#94a3b8' }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ fontSize:'0.72rem', borderRadius:8, border:'1px solid #eef0f5', boxShadow:'0 4px 12px rgba(0,0,0,0.08)' }}
              labelStyle={{ color:'#1e293b', fontWeight:700 }}
            />
            <Legend wrapperStyle={{ fontSize:'0.68rem', paddingTop:8 }} />
            <ReferenceLine yAxisId="score" y={5} stroke="#fca5a5" strokeDasharray="4 3" label={{ value:'TB', fontSize:9, fill:'#f87171', position:'insideTopRight' }} />
            <ReferenceLine yAxisId="score" y={8} stroke="#86efac" strokeDasharray="4 3" label={{ value:'Giỏi', fontSize:9, fill:'#4ade80', position:'insideTopRight' }} />
            <Bar yAxisId="count" dataKey="Đã nộp" fill="#2966EB" opacity={0.85} radius={[4,4,0,0]} barSize={28} />
            <Bar yAxisId="count" dataKey="Tổng"   fill="#e2e8f0" radius={[4,4,0,0]} barSize={28} />
            <Line yAxisId="score" dataKey="Điểm TB" stroke="#f59e0b" strokeWidth={2} dot={{ r:4, fill:'white', stroke:'#f59e0b', strokeWidth:2 }} activeDot={{ r:6 }} connectNulls />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Weak chapters */}
      {progress.weak_chapters.length > 0 && (
        <div className="sd-card" style={{ padding:'14px 18px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:12 }}>
            <AlertTriangle size={14} color="#d97706" />
            <span style={{ fontWeight:700, fontSize:'0.82rem', color:'#1e3a8a' }}>Chương cần ôn tập</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {progress.weak_chapters.map(ch => {
              const sc = scoreColor(ch.score_10);
              return (
                <div key={ch.chapter_id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:10, background:'#f8fafc' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:'0.78rem', color:'#1e293b' }}>{ch.chapter_title}</div>
                  </div>
                  <span style={{ display:'inline-flex', padding:'2px 9px', borderRadius:20, fontSize:'0.68rem', fontWeight:700, background:sc.bg, color:sc.color }}>
                    {fmt1(ch.score_10)}
                  </span>
                  <button
                    onClick={() => navigate(`/student/chat?context=${encodeURIComponent(ch.chapter_title)}&ma_mon=${maMon}`)}
                    style={{ padding:'4px 10px', borderRadius:8, border:'none', background:'#2966EB', color:'white', fontSize:'0.65rem', fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
                    Ôn tập ngay
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Score history */}
      <div className="sd-card" style={{ overflow:'hidden' }}>
        <div style={{ padding:'12px 18px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', gap:8 }}>
          <ClipboardList size={14} color="#2966EB" />
          <span style={{ fontWeight:700, fontSize:'0.82rem', color:'#1e3a8a' }}>Lịch sử điểm</span>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table className="sd-table">
            <thead>
              <tr>
                <th>Tên bài</th>
                <th>Loại</th>
                <th>Điểm</th>
                <th>Ngày nộp</th>
              </tr>
            </thead>
            <tbody>
              {[...exams.scores]
                .sort((a, b) => (b.submitted_at > a.submitted_at ? 1 : -1))
                .map(s => {
                  const ec = EXAM_TYPE_COLOR[s.exam_type] ?? { bg:'#f1f5f9', color:'#64748b' };
                  const sc = s.submitted ? scoreColor(s.score_10) : { bg:'#f1f5f9', color:'#94a3b8' };
                  return (
                    <tr key={s.assignment_id} className="sd-score-row"
                      onClick={() => navigate(`/student/assignments/${s.assignment_id}`)}>
                      <td style={{ fontWeight:600 }}>{s.title}</td>
                      <td>
                        <span style={{ display:'inline-flex', padding:'2px 8px', borderRadius:20, fontSize:'0.65rem', fontWeight:700, background:ec.bg, color:ec.color }}>
                          {EXAM_TYPE_LABEL[s.exam_type] ?? s.exam_type}
                        </span>
                      </td>
                      <td>
                        {s.submitted
                          ? <span style={{ display:'inline-flex', padding:'2px 9px', borderRadius:20, fontSize:'0.72rem', fontWeight:800, background:sc.bg, color:sc.color }}>{fmt1(s.score_10)}</span>
                          : <span style={{ fontSize:'0.72rem', color:'#94a3b8', fontStyle:'italic' }}>Chưa nộp</span>}
                      </td>
                      <td style={{ color:'#64748b', fontSize:'0.75rem' }}>{s.submitted ? fmtDate(s.submitted_at) : '—'}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Heatmap + Calendar */}
      <div className="sd-heatcal-row">
        <div className="sd-card" style={{ padding:'14px 18px', flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
            <TrendingUp size={14} color="#2966EB" />
            <span style={{ fontWeight:700, fontSize:'0.78rem', color:'#1e3a8a' }}>Hoạt động môn này</span>
          </div>
          <ActivityHeatmap assignments={subjectAssignments} />
        </div>
        <div className="sd-card sd-heatcal-cal" style={{ padding:'18px 20px', flex:1, minWidth:0, height:380, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12, flexShrink:0 }}>
            <Calendar size={15} color="#2966EB" />
            <span style={{ fontWeight:700, fontSize:'0.85rem', color:'#1e3a8a' }}>Lịch kiểm tra</span>
          </div>
          <ExamCalendar assignments={subjectAssignments} />
        </div>
      </div>
    </div>
  );
};

export default SubjectView;
