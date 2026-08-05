import { type FC, useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, ChevronRight, X, Clock, MapPin, FileText } from 'lucide-react';
import StudentApi from '@/infra/student/student_api';
import type { IStudentAssignmentListItem } from '@/infra/api/interfaces/IAssignment';
import type { IStudentSubject } from '@/infra/api/interfaces/IStudent';
import { fmtDate, toDs } from './dashboard.constants';

type EventType = 'open' | 'due' | 'exam';
interface ExamMeta { startTime: string; endTime: string; duration: string; room: string; method: string; examName: string }
type CalEvent = { type: EventType; title: string; sub?: string; examMeta?: ExamMeta; onOpen: () => void };

const DOT_COLOR: Record<EventType, string> = { open: '#2966EB', due: '#dc2626', exam: '#7c3aed' };
const EVT_LABEL: Record<EventType, string> = { open: 'Mở bài', due: 'Hạn nộp', exam: 'Lịch thi' };
const EVT_BG:    Record<EventType, string> = { open: 'rgba(41,102,235,0.08)', due: 'rgba(220,38,38,0.07)', exam: 'rgba(124,58,237,0.07)' };
const TYPE_ORDER: EventType[] = ['due', 'exam', 'open'];

const pad2 = (n: number | string) => String(n).padStart(2, '0');
const ddmmyyyyToDs = (s: string) => { const [d, m, y] = s.trim().split('/'); return `${y}-${pad2(m)}-${pad2(d)}`; };
const addMinutes = (hhmm: string, minutesStr: string) => {
  const [h, mm] = hhmm.split(':').map(Number);
  const total = (h * 60 + mm + Number(minutesStr)) % (24 * 60);
  return `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`;
};

const ExamCalendar: FC<{ assignments: IStudentAssignmentListItem[] }> = ({ assignments }) => {
  const [view, setView]         = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [selected, setSelected] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<(IStudentSubject & { _hocKy: number })[]>([]);
  const navigate = useNavigate();

  // Lấy lịch thi ở tất cả học kỳ — giống cách trang "Lịch học" (/student/schedule) làm.
  // Giữ lại hoc_ky nguồn để điều hướng kèm ?hk= đúng (tránh trang chi tiết tra nhầm học kỳ hiện tại).
  useEffect(() => {
    let cancelled = false;
    StudentApi.getSemesters()
      .then(semRes => {
        const allHocKy = semRes.data.ds_hoc_ky.map(s => s.hoc_ky);
        return Promise.all(allHocKy.map(hk =>
          StudentApi.getSubjectsBySemester(hk)
            .then(r => (r.data ?? []).map(s => ({ ...s, _hocKy: hk })))
            .catch(() => [] as (IStudentSubject & { _hocKy: number })[])
        ));
      })
      .then(list => { if (!cancelled) setSubjects(list.flat()); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const eventMap = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    const push = (ds: string, ev: CalEvent) => { if (!map.has(ds)) map.set(ds, []); map.get(ds)!.push(ev); };

    assignments.forEach(a => {
      push(toDs(a.available_from), { type: 'open', title: a.title, sub: a.ma_mon, onOpen: () => navigate(`/student/assignments/${a.id}`) });
      push(toDs(a.due_at),         { type: 'due',  title: a.title, sub: a.ma_mon, onOpen: () => navigate(`/student/assignments/${a.id}`) });
    });

    subjects.forEach(s => {
      if (!s.lich_thi) return;
      const lt = s.lich_thi;
      push(ddmmyyyyToDs(lt.ngay_thi), {
        type: 'exam',
        title: lt.ten_mon,
        examMeta: {
          startTime: lt.gio_bat_dau,
          endTime:   addMinutes(lt.gio_bat_dau, lt.so_phut),
          duration:  lt.so_phut,
          room:      lt.phong_thi,
          method:    lt.hinh_thuc_thi,
          examName:  lt.ky_thi,
        },
        onOpen: () => navigate(`/student/subjects/${s.ma_mon}?hk=${s._hocKy}`),
      });
    });

    return map;
  }, [assignments, subjects, navigate]);

  const { y, m } = view;
  const firstDow  = new Date(y, m, 1).getDay();
  const daysInMon = new Date(y, m + 1, 0).getDate();
  const rows      = Math.ceil((firstDow + daysInMon) / 7);
  const grid: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) grid.push(null);
  for (let d = 1; d <= daysInMon; d++) grid.push(d);
  while (grid.length % 7 !== 0) grid.push(null);

  const todayDs = new Date().toISOString().slice(0, 10);
  const mkDs    = (day: number) => `${y}-${pad2(m + 1)}-${pad2(day)}`;
  const selectedEvts   = selected ? (eventMap.get(selected) ?? []) : [];
  const selectedGroups = TYPE_ORDER
    .map(type => ({ type, events: selectedEvts.filter(e => e.type === type) }))
    .filter(g => g.events.length > 0);

  return (
    <div style={{ position:'relative', height:'100%', display:'flex', flexDirection:'column', overflow:'hidden' }}>

      {/* Left drawer */}
      <div style={{
        position:'absolute', top:0, left:0, bottom:0, width:250, zIndex:10,
        background:'white', borderRight:'1.5px solid #eef0f5',
        boxShadow: selected ? '4px 0 20px rgba(0,0,0,0.07)' : 'none',
        display:'flex', flexDirection:'column',
        transform: selected ? 'translateX(0)' : 'translateX(-100%)',
        transition:'transform .22s ease, box-shadow .22s ease',
      }}>
        <div style={{ padding:'12px 14px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <div style={{ fontWeight:800, fontSize:'0.85rem', color:'#1e293b' }}>{selected ? fmtDate(selected) : ''}</div>
            <div style={{ fontSize:'0.7rem', color:'#94a3b8', marginTop:2 }}>{selectedEvts.length} sự kiện</div>
          </div>
          <button onClick={() => setSelected(null)}
            style={{ width:26, height:26, borderRadius:7, border:'1.5px solid #eef0f5', background:'white', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#94a3b8' }}>
            <X size={12} />
          </button>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'10px 12px' }}>
          {selectedGroups.length === 0 ? (
            <div style={{ fontSize:'0.75rem', color:'#94a3b8', textAlign:'center', padding:'24px 0' }}>Không có sự kiện</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {selectedGroups.map(({ type, events }) => (
                <div key={type} style={{ borderRadius:10, background:EVT_BG[type], padding:'8px 10px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
                    <div style={{ width:6, height:6, borderRadius:'50%', background:DOT_COLOR[type], flexShrink:0 }} />
                    <span style={{ fontSize:'0.7rem', fontWeight:700, color:DOT_COLOR[type] }}>
                      {EVT_LABEL[type]} · {events.length} {type === 'exam' ? 'môn' : 'bài'}
                    </span>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                    {events.map((ev, i) => (
                      <div key={i} onClick={ev.onOpen}
                        style={{ padding:'8px 10px', borderRadius:8, background:'white', cursor:'pointer', transition:'opacity .12s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity='0.7'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity='1'}
                      >
                        {ev.examMeta ? (
                          <>
                            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:5 }}>
                              <div style={{ fontSize:'0.74rem', fontWeight:700, color:'#1e293b', lineHeight:1.4, flex:1 }}>{ev.title}</div>
                              <span style={{ fontSize:'0.7rem', fontWeight:700, color:'#7c3aed', background:'rgba(124,58,237,0.1)', borderRadius:20, padding:'1px 6px', flexShrink:0, whiteSpace:'nowrap' }}>
                                {ev.examMeta.examName}
                              </span>
                            </div>
                            <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                              <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:'0.7rem', color:'#475569' }}>
                                <Clock size={11} color="#94a3b8" style={{ flexShrink:0 }} />
                                {ev.examMeta.startTime} – {ev.examMeta.endTime} <span style={{ color:'#94a3b8' }}>({ev.examMeta.duration} phút)</span>
                              </div>
                              <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:'0.7rem', color:'#475569' }}>
                                <MapPin size={11} color="#94a3b8" style={{ flexShrink:0 }} />
                                {ev.examMeta.room}
                              </div>
                              <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:'0.7rem', color:'#475569' }}>
                                <FileText size={11} color="#94a3b8" style={{ flexShrink:0 }} />
                                {ev.examMeta.method}
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div style={{ fontSize:'0.74rem', fontWeight:600, color:'#1e293b', lineHeight:1.4 }}>{ev.title}</div>
                            {ev.sub && <div style={{ fontSize:'0.7rem', color:'#94a3b8', marginTop:2 }}>{ev.sub}</div>}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8, flexShrink:0 }}>
        <button onClick={() => { setSelected(null); setView(v => { const d = new Date(v.y, v.m - 1); return { y:d.getFullYear(), m:d.getMonth() }; }); }}
          style={{ width:28, height:28, borderRadius:8, border:'1.5px solid #eef0f5', background:'white', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }}>
          <ChevronLeft size={14} />
        </button>
        <span style={{ fontWeight:800, fontSize:'0.88rem', color:'#1e293b' }}>Tháng {m + 1} / {y}</span>
        <button onClick={() => { setSelected(null); setView(v => { const d = new Date(v.y, v.m + 1); return { y:d.getFullYear(), m:d.getMonth() }; }); }}
          style={{ width:28, height:28, borderRadius:8, border:'1.5px solid #eef0f5', background:'white', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }}>
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Day headers */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3, marginBottom:4, flexShrink:0 }}>
        {['CN','T2','T3','T4','T5','T6','T7'].map(d => (
          <div key={d} style={{ textAlign:'center', fontSize:'0.7rem', color:'#94a3b8', fontWeight:700 }}>{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gridTemplateRows:`repeat(${rows},1fr)`, gap:3, flex:1 }}>
        {grid.map((day, i) => {
          if (!day) return <div key={i} />;
          const ds      = mkDs(day);
          const evts    = eventMap.get(ds) ?? [];
          const isToday = ds === todayDs;
          const isSel   = ds === selected;
          const typesPresent = TYPE_ORDER.filter(t => evts.some(e => e.type === t));
          return (
            <div key={i} onClick={() => setSelected(isSel ? null : ds)}
              style={{
                borderRadius:9, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2,
                background: isSel ? '#2966EB' : isToday ? 'rgba(41,102,235,0.1)' : 'transparent',
                border: isToday && !isSel ? '1.5px solid rgba(41,102,235,0.3)' : '1.5px solid transparent',
                cursor: evts.length > 0 ? 'pointer' : 'default',
                transition:'background .12s',
              }}
            >
              <div style={{ fontSize:'0.78rem', fontWeight: isSel || isToday ? 800 : 500, color: isSel ? 'white' : isToday ? '#2966EB' : '#1e293b', lineHeight:1 }}>{day}</div>
              <div style={{ display:'flex', gap:2 }}>
                {typesPresent.map(t => <div key={t} style={{ width:4, height:4, borderRadius:'50%', background: isSel ? 'rgba(255,255,255,0.85)' : DOT_COLOR[t] }} />)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display:'flex', gap:12, marginTop:8, flexShrink:0 }}>
        {TYPE_ORDER.map(t => (
          <div key={t} style={{ display:'flex', alignItems:'center', gap:4 }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:DOT_COLOR[t] }} />
            <span style={{ fontSize:'0.7rem', color:'#64748b' }}>{EVT_LABEL[t]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExamCalendar;
