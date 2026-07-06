import { type FC, type ReactNode } from 'react';

export interface ISubjectOverviewStat {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  sub?: string;
  tint: string;
  ink: string;
}

const SubjectStatCards: FC<{ stats: ISubjectOverviewStat[] }> = ({ stats }) => (
  <div className="sl-stats-grid">
    {stats.map(s => (
      <div key={s.label} className="sl-stat-card">
        <div style={{ width:42, height:42, borderRadius:12, background:s.tint, color:s.ink, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          {s.icon}
        </div>
        <div style={{ minWidth:0 }}>
          <div style={{ fontSize:'0.72rem', color:'#94a3b8', fontWeight:500 }}>{s.label}</div>
          <div style={{ fontSize:'1.35rem', fontWeight:800, color:'#0f172a', lineHeight:1.15, letterSpacing:'-0.02em' }}>{s.value}</div>
          {s.sub && <div style={{ fontSize:'0.7rem', color:s.ink, fontWeight:600 }}>{s.sub}</div>}
        </div>
      </div>
    ))}
  </div>
);

export default SubjectStatCards;
