import { type FC, useState, useEffect, useMemo, useRef } from 'react';
import type { IStudentAssignmentListItem } from '@/infra/api/interfaces/IAssignment';
import { HEAT_COLORS, HEAT_WEEKS, MONTHS_VN, toDs } from './dashboard.constants';

const ActivityHeatmap: FC<{ assignments: IStudentAssignmentListItem[] }> = ({ assignments }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cell, setCell] = useState(11);
  const GAP = 2;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const available = el.clientWidth - 26;
      const c = Math.floor((available - (HEAT_WEEKS - 1) * GAP) / HEAT_WEEKS);
      setCell(Math.max(8, c));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const actMap = useMemo(() => {
    const m = new Map<string, number>();
    const add = (s: string, v: number) => { const d = toDs(s); m.set(d, (m.get(d) ?? 0) + v); };
    assignments.forEach(a => {
      if (a.submitted_at) add(a.submitted_at, 3);
      add(a.available_from, 1);
      add(a.due_at, 1);
    });
    return m;
  }, [assignments]);

  const { columns, monthLabels } = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    const sun   = new Date(today); sun.setDate(today.getDate() - today.getDay());
    const start = new Date(sun);   start.setDate(sun.getDate() - (HEAT_WEEKS - 1) * 7);
    const cols: Array<Array<{ ds: string; level: number } | null>> = [];
    const months: Array<{ col: number; label: string }> = [];
    let lastMonth = -1;
    for (let w = 0; w < HEAT_WEEKS; w++) {
      const col: Array<{ ds: string; level: number } | null> = [];
      for (let d = 0; d < 7; d++) {
        const dt = new Date(start); dt.setDate(start.getDate() + w * 7 + d);
        if (dt > today) { col.push(null); continue; }
        const ds  = dt.toISOString().slice(0, 10);
        const act = actMap.get(ds) ?? 0;
        col.push({ ds, level: act === 0 ? 0 : act <= 2 ? 1 : act <= 4 ? 2 : 3 });
        if (d === 0 && dt.getMonth() !== lastMonth) {
          months.push({ col: w, label: MONTHS_VN[dt.getMonth()] });
          lastMonth = dt.getMonth();
        }
      }
      cols.push(col);
    }
    return { columns: cols, monthLabels: months };
  }, [actMap]);

  return (
    <div ref={containerRef} style={{ paddingBottom:2 }}>
      <div style={{ display:'flex', marginLeft:24, marginBottom:3 }}>
        {columns.map((_, w) => {
          const mo = monthLabels.find(ml => ml.col === w);
          return <div key={w} style={{ width:cell + GAP, fontSize:'0.7rem', color:'#94a3b8', flexShrink:0 }}>{mo?.label ?? ''}</div>;
        })}
      </div>
      <div style={{ display:'flex', gap:3, alignItems:'flex-start' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:GAP }}>
          {['','T2','','T4','','T6',''].map((l, i) => (
            <div key={i} style={{ height:cell, width:18, fontSize:'0.7rem', color:'#94a3b8', display:'flex', alignItems:'center', justifyContent:'flex-end', paddingRight:3 }}>{l}</div>
          ))}
        </div>
        <div style={{ display:'flex', gap:GAP }}>
          {columns.map((col, w) => (
            <div key={w} style={{ display:'flex', flexDirection:'column', gap:GAP }}>
              {col.map((c, d) => (
                <div
                  key={d}
                  className="sd-heat-cell"
                  title={c ? `${c.ds}: ${actMap.get(c.ds) ?? 0} hoạt động` : undefined}
                  style={{ width:cell, height:cell, borderRadius:2, background: c === null ? 'transparent' : HEAT_COLORS[c.level], flexShrink:0 }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:6, justifyContent:'flex-end' }}>
        <span style={{ fontSize:'0.7rem', color:'#94a3b8' }}>Ít hơn</span>
        {HEAT_COLORS.map((c, i) => <div key={i} style={{ width:10, height:10, borderRadius:2, background:c }} />)}
        <span style={{ fontSize:'0.7rem', color:'#94a3b8' }}>Nhiều hơn</span>
      </div>
    </div>
  );
};

export default ActivityHeatmap;
