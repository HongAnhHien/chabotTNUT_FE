import { type FC, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, ChevronRight, X, Loader2, CalendarDays, Clock, MapPin, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import StudentApi from '@/infra/student/student_api';
import type { IStudentAssignmentListItem } from '@/infra/api/interfaces/IAssignment';
import type { IStudentSubject } from '@/infra/api/interfaces/IStudent';

type EventType = 'open' | 'due' | 'exam';

interface ExamMeta { startTime: string; endTime: string; duration: string; room: string; method: string; examName: string }

interface CalEvent {
  type: EventType;
  title: string;
  sub?: string;
  examMeta?: ExamMeta;
  onOpen: () => void;
}

const DOT_COLOR: Record<EventType, string> = { open: '#2563eb', due: '#dc2626', exam: '#7c3aed' };
const EVT_LABEL: Record<EventType, string> = { open: 'Mở bài', due: 'Hạn nộp', exam: 'Lịch thi' };
const EVT_BG:    Record<EventType, string> = {
  open: 'rgba(37,99,235,0.07)',
  due:  'rgba(220,38,38,0.07)',
  exam: 'rgba(124,58,237,0.07)',
};

const toDs = (s: string) => s.slice(0, 10);
const pad2 = (n: number | string) => String(n).padStart(2, '0');
// "d/M/yyyy" hoặc "dd/MM/yyyy" → "yyyy-MM-dd" (luôn đệm số 0 vì backend có thể không đệm sẵn)
const ddmmyyyyToDs = (s: string) => {
  const [d, m, y] = s.trim().split('/');
  return `${y}-${pad2(m)}-${pad2(d)}`;
};
// "HH:mm" + số phút → giờ kết thúc "HH:mm"
const addMinutes = (hhmm: string, minutesStr: string) => {
  const [h, mm] = hhmm.split(':').map(Number);
  const total = (h * 60 + mm + Number(minutesStr)) % (24 * 60);
  return `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`;
};

const CSS = `
  @keyframes ssc-fade      { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
  @keyframes ssc-spin      { to{transform:rotate(360deg)} }
  @keyframes ssc-overlay   { from{opacity:0} to{opacity:1} }
  @keyframes ssc-drawer-in { from{transform:translateX(100%)} to{transform:translateX(0)} }

  .ssc-cell { transition:background .12s, border-color .12s; }
  .ssc-cell:hover:not(.ssc-cell--empty) { background:#f8fafc; }
  .ssc-nav-btn { transition:background .13s; }
  .ssc-nav-btn:hover { background:#f1f5f9 !important; }
  .ssc-evt-row { transition:opacity .12s; }
  .ssc-evt-row:hover { opacity:.75; }

  .ssc-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:6px; flex:1; min-height:0; }
  .ssc-cell { border-radius:12px; border:1.5px solid #eef0f5; padding:8px; display:flex; flex-direction:column; gap:4px; min-height:0; overflow:hidden; }

  @media (max-width:768px) {
    .ssc-page-pad { padding:14px 16px 24px !important; }
    .ssc-cell { padding:5px; border-radius:9px; }
    .ssc-evt-dot-label { display:none; }
  }
`;

const StudentSchedule: FC = () => {
  const navigate = useNavigate();
  const [view, setView] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<IStudentAssignmentListItem[]>([]);
  const [subjects, setSubjects] = useState<(IStudentSubject & { _hocKy: number })[]>([]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const semRes = await StudentApi.getSemesters();
        const allHocKy = semRes.data.ds_hoc_ky.map(s => s.hoc_ky);
        // Lấy lịch thi ở TẤT CẢ học kỳ (không chỉ học kỳ hiện tại) vì lịch xem theo tháng,
        // có thể browse sang tháng thuộc học kỳ khác — tránh lệch dữ liệu với trang chọn học kỳ thủ công.
        // Giữ lại hoc_ky nguồn của mỗi môn để điều hướng kèm ?hk= đúng, tránh trang chi tiết
        // tra cứu nhầm theo học kỳ hiện tại (môn thi có thể thuộc học kỳ khác).
        const [asnRes, subResList] = await Promise.all([
          StudentApi.getAssignments(),
          Promise.all(allHocKy.map(hk =>
            StudentApi.getSubjectsBySemester(hk)
              .then(r => (r.data ?? []).map(s => ({ ...s, _hocKy: hk })))
              .catch(() => [] as (IStudentSubject & { _hocKy: number })[])
          )),
        ]);
        if (cancelled) return;
        setAssignments(asnRes.data ?? []);
        setSubjects(subResList.flat());
      } catch {
        if (!cancelled) toast.error('Không thể tải dữ liệu lịch học.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run().catch(() => {});
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
  const grid: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) grid.push(null);
  for (let d = 1; d <= daysInMon; d++) grid.push(d);
  while (grid.length % 7 !== 0) grid.push(null);

  const todayDs = new Date().toISOString().slice(0, 10);
  const mkDs    = (day: number) => `${y}-${pad2(m + 1)}-${pad2(day)}`;
  const goToday = () => { const d = new Date(); setView({ y: d.getFullYear(), m: d.getMonth() }); setSelected(todayDs); };
  const shiftMonth = (delta: number) => { setSelected(null); setView(v => { const d = new Date(v.y, v.m + delta); return { y: d.getFullYear(), m: d.getMonth() }; }); };

  const selectedEvts = selected ? (eventMap.get(selected) ?? []) : [];
  const selectedLabel = selected
    ? new Date(selected).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
    : '';
  const selectedGroups: { type: EventType; events: CalEvent[] }[] = (['due', 'exam', 'open'] as EventType[])
    .map(type => ({ type, events: selectedEvts.filter(e => e.type === type) }))
    .filter(g => g.events.length > 0);

  return (
    <div style={{ minHeight: '100%', background: '#f4f6fb', display: 'flex', flexDirection: 'column' }}>
      <style>{CSS}</style>

      <div className="ssc-page-pad" style={{ padding: '20px 24px 28px', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Lịch học</h1>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 3 }}>Bài kiểm tra, hạn nộp và lịch thi trong tháng</div>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="ssc-nav-btn" onClick={() => shiftMonth(-1)}
              style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid #e2e8f0', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>
              <ChevronLeft size={15} />
            </button>
            <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#1e293b', minWidth: 130, textAlign: 'center' }}>Tháng {m + 1} / {y}</span>
            <button className="ssc-nav-btn" onClick={() => shiftMonth(1)}
              style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid #e2e8f0', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>
              <ChevronRight size={15} />
            </button>
            <button className="ssc-nav-btn" onClick={goToday}
              style={{ height: 32, padding: '0 12px', borderRadius: 9, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', color: '#2563eb', fontSize: '0.76rem', fontWeight: 700 }}>
              Hôm nay
            </button>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 14 }}>
          {(['open', 'due', 'exam'] as const).map(t => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: DOT_COLOR[t] }} />
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{EVT_LABEL[t]}</span>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 size={26} color="#2563eb" style={{ animation: 'ssc-spin 1s linear infinite' }} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, background: 'white', border: '1px solid #eef0f5', borderRadius: 16, padding: '14px 16px' }}>
            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6, marginBottom: 6, flexShrink: 0 }}>
              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, padding: '2px 0' }}>{d}</div>
              ))}
            </div>

            {/* Day grid */}
            <div className="ssc-grid">
              {grid.map((day, i) => {
                if (!day) return <div key={i} className="ssc-cell ssc-cell--empty" style={{ border: 'none' }} />;
                const ds      = mkDs(day);
                const evts    = eventMap.get(ds) ?? [];
                const isToday = ds === todayDs;
                const isSel   = ds === selected;
                const typeOrder: EventType[] = ['due', 'exam', 'open'];
                const typesPresent = typeOrder.filter(t => evts.some(e => e.type === t));
                return (
                  <div key={i} className="ssc-cell" onClick={() => setSelected(isSel ? null : ds)}
                    style={{
                      cursor: 'pointer',
                      background: isSel ? 'rgba(37,99,235,0.08)' : 'white',
                      borderColor: isSel ? '#2563eb' : isToday ? 'rgba(37,99,235,0.35)' : '#eef0f5',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{
                        fontSize: '0.8rem', fontWeight: isToday || isSel ? 800 : 600,
                        color: isSel ? '#2563eb' : isToday ? '#2563eb' : '#1e293b',
                        width: 22, height: 22, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isToday && !isSel ? 'rgba(37,99,235,0.1)' : 'transparent',
                      }}>{day}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden' }}>
                      {typesPresent.map(t => {
                        const typeEvts = evts.filter(e => e.type === t);
                        const count = typeEvts.length;
                        const label = t === 'exam' && count === 1 && typeEvts[0].examMeta
                          ? `Thi ${typeEvts[0].examMeta.startTime}`
                          : `${EVT_LABEL[t]}${count > 1 ? ` (${count})` : ''}`;
                        return (
                          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: DOT_COLOR[t], flexShrink: 0 }} />
                            <span className="ssc-evt-dot-label" style={{ fontSize: '0.7rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Drawer overlay */}
      {selected && (
        <>
          <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(15,23,42,.4)', animation: 'ssc-overlay .2s ease' }} />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(380px,100vw)',
            background: 'white', zIndex: 201, display: 'flex', flexDirection: 'column',
            boxShadow: '-16px 0 40px rgba(15,23,42,.18)', animation: 'ssc-drawer-in .22s cubic-bezier(.2,.8,.2,1)',
          }}>
            <div style={{ padding: '16px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#1e293b', textTransform: 'capitalize' }}>{selectedLabel}</div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 2 }}>{selectedEvts.length} sự kiện</div>
              </div>
              <button onClick={() => setSelected(null)}
                style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid #e2e8f0', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>
                <X size={15} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
              {selectedEvts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: '#94a3b8' }}>
                  <CalendarDays size={36} color="#e2e8f0" style={{ margin: '0 auto 10px', display: 'block' }} />
                  <div style={{ fontSize: '0.8rem' }}>Không có sự kiện nào trong ngày này.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {selectedGroups.map(({ type, events }) => (
                    <div key={type} style={{ borderRadius: 14, background: EVT_BG[type], padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: DOT_COLOR[type], flexShrink: 0 }} />
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: DOT_COLOR[type], textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                          {EVT_LABEL[type]} · {events.length} {type === 'exam' ? 'môn' : 'bài'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {events.map((ev, i) => (
                          <div key={i} className="ssc-evt-row" onClick={ev.onOpen}
                            style={{ padding: '10px 12px', borderRadius: 10, background: 'white', cursor: 'pointer' }}>
                            {ev.examMeta ? (
                              <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', lineHeight: 1.4, flex: 1 }}>{ev.title}</div>
                                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#7c3aed', background: 'rgba(124,58,237,0.1)', borderRadius: 20, padding: '2px 8px', flexShrink: 0, whiteSpace: 'nowrap' }}>
                                    {ev.examMeta.examName}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.74rem', color: '#475569' }}>
                                    <Clock size={13} color="#94a3b8" style={{ flexShrink: 0 }} />
                                    {ev.examMeta.startTime} – {ev.examMeta.endTime} <span style={{ color: '#94a3b8' }}>({ev.examMeta.duration} phút)</span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.74rem', color: '#475569' }}>
                                    <MapPin size={13} color="#94a3b8" style={{ flexShrink: 0 }} />
                                    {ev.examMeta.room}
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.74rem', color: '#475569' }}>
                                    <FileText size={13} color="#94a3b8" style={{ flexShrink: 0 }} />
                                    {ev.examMeta.method}
                                  </div>
                                </div>
                              </>
                            ) : (
                              <>
                                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', lineHeight: 1.4 }}>{ev.title}</div>
                                {ev.sub && <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 2 }}>{ev.sub}</div>}
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
        </>
      )}
    </div>
  );
};

export default StudentSchedule;
