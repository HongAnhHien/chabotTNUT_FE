import { type FC, useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { IStudentAssignmentListItem } from '@/infra/api/interfaces/IAssignment';
import { fmtDate, toDs } from './dashboard.constants';

type CalEvent = { type: 'open' | 'due' | 'submit'; title: string; id: string };

const DOT_COLOR = { open: '#2966EB', due: '#dc2626', submit: '#16a34a' };
const EVT_LABEL = { open: 'Bắt đầu làm bài', due: 'Hạn nộp bài', submit: 'Đã nộp' };
const EVT_BG    = { open: 'rgba(41,102,235,0.08)', due: 'rgba(220,38,38,0.07)', submit: 'rgba(22,163,74,0.07)' };

const ExamCalendar: FC<{ assignments: IStudentAssignmentListItem[] }> = ({ assignments }) => {
  const [view, setView]         = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [selected, setSelected] = useState<string | null>(null);
  const navigate = useNavigate();

  const eventMap = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    const push = (ds: string, ev: CalEvent) => { if (!map.has(ds)) map.set(ds, []); map.get(ds)!.push(ev); };
    assignments.forEach(a => {
      push(toDs(a.available_from), { type:'open',   title: a.title, id: a.id });
      push(toDs(a.due_at),         { type:'due',    title: a.title, id: a.id });
      if (a.submitted_at) push(toDs(a.submitted_at), { type:'submit', title: a.title, id: a.id });
    });
    return map;
  }, [assignments]);

  const { y, m } = view;
  const firstDow  = new Date(y, m, 1).getDay();
  const daysInMon = new Date(y, m + 1, 0).getDate();
  const rows      = Math.ceil((firstDow + daysInMon) / 7);
  const grid: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) grid.push(null);
  for (let d = 1; d <= daysInMon; d++) grid.push(d);
  while (grid.length % 7 !== 0) grid.push(null);

  const todayDs      = new Date().toISOString().slice(0, 10);
  const pad2         = (n: number) => String(n).padStart(2, '0');
  const mkDs         = (day: number) => `${y}-${pad2(m + 1)}-${pad2(day)}`;
  const selectedEvts = selected ? (eventMap.get(selected) ?? []) : [];

  return (
    <div style={{ position:'relative', height:'100%', display:'flex', flexDirection:'column', overflow:'hidden' }}>

      {/* Left drawer */}
      <div style={{
        position:'absolute', top:0, left:0, bottom:0, width:230, zIndex:10,
        background:'white', borderRight:'1.5px solid #eef0f5',
        boxShadow: selected ? '4px 0 20px rgba(0,0,0,0.07)' : 'none',
        display:'flex', flexDirection:'column',
        transform: selected ? 'translateX(0)' : 'translateX(-100%)',
        transition:'transform .22s ease, box-shadow .22s ease',
      }}>
        <div style={{ padding:'12px 14px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <div style={{ fontWeight:800, fontSize:'0.85rem', color:'#1e293b' }}>{selected ? fmtDate(selected) : ''}</div>
            <div style={{ fontSize:'0.62rem', color:'#94a3b8', marginTop:2 }}>{selectedEvts.length} sự kiện</div>
          </div>
          <button onClick={() => setSelected(null)}
            style={{ width:26, height:26, borderRadius:7, border:'1.5px solid #eef0f5', background:'white', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#94a3b8' }}>
            <X size={12} />
          </button>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'10px 12px' }}>
          {selectedEvts.length === 0 ? (
            <div style={{ fontSize:'0.75rem', color:'#94a3b8', textAlign:'center', padding:'24px 0' }}>Không có sự kiện</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {selectedEvts.map((ev, i) => (
                <div key={i} onClick={() => navigate(`/student/assignments/${ev.id}`)}
                  style={{ padding:'10px 12px', borderRadius:10, background:EVT_BG[ev.type], cursor:'pointer', transition:'opacity .12s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity='0.75'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity='1'}
                >
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                    <div style={{ width:7, height:7, borderRadius:'50%', background:DOT_COLOR[ev.type], flexShrink:0 }} />
                    <span style={{ fontSize:'0.62rem', fontWeight:700, color:DOT_COLOR[ev.type] }}>{EVT_LABEL[ev.type]}</span>
                  </div>
                  <div style={{ fontSize:'0.76rem', fontWeight:600, color:'#1e293b', lineHeight:1.45 }}>{ev.title}</div>
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
          <div key={d} style={{ textAlign:'center', fontSize:'0.62rem', color:'#94a3b8', fontWeight:700 }}>{d}</div>
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
          const types   = [...new Set(evts.map(e => e.type))];
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
                {types.map(t => <div key={t} style={{ width:4, height:4, borderRadius:'50%', background: isSel ? 'rgba(255,255,255,0.85)' : DOT_COLOR[t] }} />)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display:'flex', gap:12, marginTop:8, flexShrink:0 }}>
        {(['open','due','submit'] as const).map(t => (
          <div key={t} style={{ display:'flex', alignItems:'center', gap:4 }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:DOT_COLOR[t] }} />
            <span style={{ fontSize:'0.62rem', color:'#64748b' }}>{t === 'open' ? 'Mở bài' : t === 'due' ? 'Hạn nộp' : 'Đã nộp'}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExamCalendar;
