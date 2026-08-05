import { type FC, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Calendar, CheckCircle2, MessageCircle, Bot, BookOpen, TrendingUp, ChevronDown, Loader2 } from 'lucide-react';
import type { IDashboardOverview } from '@/infra/api/interfaces/IDashboard';
import type { IStudentAssignmentListItem } from '@/infra/api/interfaces/IAssignment';
import type { IStudentSubject, IStudentSemester } from '@/infra/api/interfaces/IStudent';
import { scoreColor, fmt1, EXAM_TYPE_COLOR, EXAM_TYPE_SHORT } from './dashboard.constants';
import StatCard from './StatCard';
import ActivityHeatmap from './ActivityHeatmap';
import ExamCalendar from './ExamCalendar';

interface OverviewViewProps {
  data: IDashboardOverview;
  assignments: IStudentAssignmentListItem[];
  subjects: IStudentSubject[];
  semesters: IStudentSemester[];
  selectedHk: number | null;
  onSelectHk: (hk: number) => void;
  loadingSubjects?: boolean;
}

const OverviewView: FC<OverviewViewProps> = ({ data, assignments, subjects, semesters, selectedHk, onSelectHk, loadingSubjects }) => {
  const navigate = useNavigate();
  const semFrom  = data.semester_from
    ? new Date(data.semester_from).toLocaleDateString('vi-VN', { month:'long', year:'numeric' })
    : '';

  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const currentSem = semesters.find(s => s.hoc_ky === selectedHk);

  useEffect(() => {
    if (!dropOpen) return;
    const handler = (e: MouseEvent) => {
      if (!dropRef.current?.contains(e.target as Node)) setDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropOpen]);

  // Merge full subject list (đã theo đúng học kỳ đang chọn) với dashboard stats
  const statsMap = new Map(data.by_subject.map(s => [s.ma_mon, s]));
  const allSubjects = subjects;

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
      <div className="sd-card" style={{ overflow:'visible' }}>
        <div style={{ padding:'14px 18px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', position:'relative' }}>
          <BookOpen size={15} color="#2966EB" />
          <span style={{ fontWeight:700, fontSize:'0.85rem', color:'#1e3a8a' }}>Thống kê theo môn học</span>

          {semesters.length > 0 && (
            <div ref={dropRef} className="sd-sem-drop" style={{ position:'relative', marginLeft:'auto' }}>
              <button
                className="sd-sem-drop-btn"
                onClick={() => setDropOpen(v => !v)}
                style={{ display:'flex', alignItems:'center', gap:8, minWidth:240, padding:'8px 16px', borderRadius:20, background:'white', border:'1.5px solid rgba(37,99,235,0.18)', cursor:'pointer', transition:'all .15s', boxShadow: dropOpen ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none' }}
              >
                <Calendar size={13} color="#2563eb" style={{ flexShrink:0 }} />
                <span style={{ fontSize:'0.8rem', fontWeight:700, color:'#1e293b', whiteSpace:'nowrap', flex:1, textAlign:'left' }}>{currentSem?.ten_hoc_ky ?? 'Chọn học kỳ'}</span>
                {currentSem?.is_current && (
                  <span style={{ fontSize:'0.7rem', fontWeight:700, color:'#059669', background:'rgba(5,150,105,0.1)', borderRadius:20, padding:'2px 8px', whiteSpace:'nowrap', flexShrink:0 }}>Hiện tại</span>
                )}
                <ChevronDown size={13} color="#64748b" style={{ flexShrink:0, transition:'transform .2s', transform: dropOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </button>

              {dropOpen && (
                <div className="sd-sem-drop-panel" style={{ position:'absolute', top:'calc(100% + 6px)', right:0, zIndex:20, background:'white', borderRadius:14, boxShadow:'0 8px 30px rgba(30,58,138,0.15)', border:'1px solid rgba(37,99,235,0.1)', minWidth:240, overflow:'hidden', maxHeight:280, overflowY:'auto' }}>
                  <div style={{ padding:'8px 14px 6px', borderBottom:'1px solid rgba(37,99,235,0.07)' }}>
                    <span style={{ fontSize:'0.7rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em' }}>Chọn học kỳ</span>
                  </div>
                  {semesters.map(s => (
                    <button
                      key={s.hoc_ky}
                      onClick={() => { onSelectHk(s.hoc_ky); setDropOpen(false); }}
                      style={{ width:'100%', display:'flex', alignItems:'center', gap:9, padding:'9px 14px', background: s.hoc_ky === selectedHk ? 'rgba(37,99,235,0.05)' : 'none', border:'none', cursor:'pointer', textAlign:'left' }}
                    >
                      <div style={{ width:7, height:7, borderRadius:'50%', flexShrink:0, background: s.hoc_ky === selectedHk ? '#2563eb' : s.is_current ? '#22c55e' : '#e2e8f0' }} />
                      <span style={{ flex:1, fontSize:'0.76rem', fontWeight: s.hoc_ky === selectedHk ? 700 : 500, color: s.hoc_ky === selectedHk ? '#1e3a8a' : '#334155' }}>{s.ten_hoc_ky}</span>
                      {s.is_current && <span style={{ fontSize:'0.7rem', fontWeight:700, color:'#059669', background:'rgba(5,150,105,0.09)', borderRadius:20, padding:'1px 7px' }}>Hiện tại</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div style={{ overflow:'hidden', borderRadius:'0 0 16px 16px' }}>
        {loadingSubjects ? (
          <div style={{ padding:'3rem', textAlign:'center' }}>
            <Loader2 size={20} color="#2966EB" style={{ animation:'sd-spin 1s linear infinite' }} />
          </div>
        ) : allSubjects.length === 0 ? (
          <div style={{ padding:'3rem', textAlign:'center', color:'#94a3b8', fontSize:'0.82rem' }}>Chưa có môn học nào trong học kỳ này.</div>
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
                        <div style={{ fontSize:'0.7rem', color:'#94a3b8', fontFamily:'monospace', marginTop:2 }}>{subj.ma_mon}</div>
                        {subj.lich_thi && (
                          <div style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:'0.7rem', fontWeight:600, color:'#b45309', background:'rgba(217,119,6,0.08)', border:'1px solid rgba(217,119,6,0.16)', borderRadius:8, padding:'2px 7px', marginTop:4 }}>
                            <Calendar size={9} /> {subj.lich_thi.ngay_thi} · {subj.lich_thi.gio_bat_dau}
                          </div>
                        )}
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
                              <div key={t.exam_type} style={{ display:'inline-flex', alignItems:'center', gap:3, background:ec.bg, borderRadius:20, padding:'2px 7px', fontSize:'0.7rem', fontWeight:700, color:ec.color }}>
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
          <div style={{ padding:'8px 18px', fontSize:'0.7rem', color:'#94a3b8', borderTop:'1px solid #f8fafc' }}>
            Thống kê từ {semFrom}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default OverviewView;
