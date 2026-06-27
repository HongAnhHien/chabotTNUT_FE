import { type FC } from 'react';
import { useNavigate } from 'react-router';
import { Calendar, CheckCircle2, MessageCircle, Bot, BookOpen, TrendingUp } from 'lucide-react';
import type { IDashboardOverview } from '@/infra/api/interfaces/IDashboard';
import type { IStudentAssignmentListItem } from '@/infra/api/interfaces/IAssignment';
import type { IStudentSubject } from '@/infra/api/interfaces/IStudent';
import { scoreColor, fmt1, EXAM_TYPE_COLOR, EXAM_TYPE_SHORT } from './dashboard.constants';
import StatCard from './StatCard';
import ActivityHeatmap from './ActivityHeatmap';
import ExamCalendar from './ExamCalendar';

interface OverviewViewProps {
  data: IDashboardOverview;
  assignments: IStudentAssignmentListItem[];
  subjects: IStudentSubject[];
}

const OverviewView: FC<OverviewViewProps> = ({ data, assignments, subjects }) => {
  const navigate = useNavigate();
  const semFrom  = data.semester_from
    ? new Date(data.semester_from).toLocaleDateString('vi-VN', { month:'long', year:'numeric' })
    : '';

  // Merge full subject list with dashboard stats
  const statsMap = new Map(data.by_subject.map(s => [s.ma_mon, s]));
  const allSubjects = subjects.length > 0 ? subjects : data.by_subject.map(s => ({ ma_mon: s.ma_mon, ten_mon: s.ten_mon } as IStudentSubject));

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      {/* Stat cards */}
      <div className="sd-grid-4">
        <StatCard icon={Calendar}      iconColor="#2966EB" label="Ngày đăng nhập"   value={data.total_login_days}        sub="ngày"    delay={0}    />
        <StatCard icon={CheckCircle2}  iconColor="#16a34a" label="Bài KT đã làm"    value={data.total_exams_done}        sub="bài"     delay={0.06} />
        <StatCard icon={MessageCircle} iconColor="#7c3aed" label="Lượt hỏi chatbot" value={data.total_chatbot_questions} sub="lần"     delay={0.12} />
        <StatCard icon={Bot}           iconColor="#0891b2" label="Session đã tạo"   value={data.total_sessions}         sub="session" delay={0.18} />
      </div>

      {/* Heatmap + Calendar */}
      <div className="sd-heatcal-row">
        <div className="sd-card" style={{ padding:'14px 18px', flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
            <TrendingUp size={14} color="#2966EB" />
            <span style={{ fontWeight:700, fontSize:'0.78rem', color:'#1e3a8a' }}>Hoạt động học tập</span>
          </div>
          <ActivityHeatmap assignments={assignments} />
        </div>
        <div className="sd-card sd-heatcal-cal" style={{ padding:'18px 20px', flex:1, minWidth:0, height:380, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12, flexShrink:0 }}>
            <Calendar size={15} color="#2966EB" />
            <span style={{ fontWeight:700, fontSize:'0.85rem', color:'#1e3a8a' }}>Lịch kiểm tra</span>
          </div>
          <ExamCalendar assignments={assignments} />
        </div>
      </div>

      {/* Subject breakdown */}
      <div className="sd-card" style={{ overflow:'hidden' }}>
        <div style={{ padding:'14px 18px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', gap:8 }}>
          <BookOpen size={15} color="#2966EB" />
          <span style={{ fontWeight:700, fontSize:'0.85rem', color:'#1e3a8a' }}>Thống kê theo môn học</span>
        </div>
        {allSubjects.length === 0 ? (
          <div style={{ padding:'3rem', textAlign:'center', color:'#94a3b8', fontSize:'0.82rem' }}>Chưa có dữ liệu</div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table className="sd-table">
              <thead>
                <tr>
                  <th>Môn học</th>
                  <th>Bài được giao</th>
                  <th>Điểm TB</th>
                  <th>Kỳ này</th>
                  <th>Phân loại</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {allSubjects.map(subj => {
                  const s  = statsMap.get(subj.ma_mon);
                  const sc = scoreColor(s?.avg_score_10 ?? null);
                  return (
                    <tr key={subj.ma_mon}>
                      <td>
                        <div style={{ fontWeight:700, color:'#1e293b' }}>{subj.ten_mon}</div>
                        <div style={{ fontSize:'0.62rem', color:'#94a3b8', fontFamily:'monospace', marginTop:2 }}>{subj.ma_mon}</div>
                      </td>
                      <td>
                        {s ? (
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <div style={{ width:80, height:5, borderRadius:3, background:'#f1f5f9', overflow:'hidden' }}>
                              <div style={{ width:`${(s.submitted / (s.total_assigned || 1)) * 100}%`, height:'100%', background:'#2966EB', borderRadius:3 }} />
                            </div>
                            <span style={{ fontSize:'0.72rem', color:'#64748b' }}>{s.submitted}/{s.total_assigned}</span>
                          </div>
                        ) : (
                          <span style={{ fontSize:'0.72rem', color:'#94a3b8' }}>—</span>
                        )}
                      </td>
                      <td>
                        <span style={{ display:'inline-flex', alignItems:'center', borderRadius:20, padding:'2px 10px', fontSize:'0.72rem', fontWeight:700, background:sc.bg, color:sc.color }}>
                          {fmt1(s?.avg_score_10 ?? null)}
                        </span>
                      </td>
                      <td style={{ fontSize:'0.75rem', color:'#64748b' }}>
                        {s ? `${s.this_semester.submitted}/${s.this_semester.exams_created}` : '—'}
                      </td>
                      <td>
                        <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                          {(s?.by_exam_type ?? []).filter(t => t.total > 0).map(t => {
                            const ec  = EXAM_TYPE_COLOR[t.exam_type] ?? { bg:'#f1f5f9', color:'#64748b' };
                            const sc2 = scoreColor(t.avg_score_10);
                            return (
                              <div key={t.exam_type} style={{ display:'inline-flex', alignItems:'center', gap:3, background:ec.bg, borderRadius:20, padding:'2px 7px', fontSize:'0.62rem', fontWeight:700, color:ec.color }}>
                                {EXAM_TYPE_SHORT[t.exam_type] ?? t.exam_type}
                                <span style={{ color:sc2.color }}>{fmt1(t.avg_score_10)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td>
                        <button onClick={() => navigate(`/student/dashboard?ma_mon=${subj.ma_mon}`)}
                          style={{ padding:'5px 12px', borderRadius:9, border:'1.5px solid rgba(41,102,235,0.2)', background:'rgba(41,102,235,0.04)', color:'#2966EB', fontSize:'0.72rem', fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {semFrom && (
          <div style={{ padding:'8px 18px', fontSize:'0.65rem', color:'#94a3b8', borderTop:'1px solid #f8fafc' }}>
            Thống kê từ {semFrom}
          </div>
        )}
      </div>
    </div>
  );
};

export default OverviewView;
