import { type FC } from 'react';

interface StatCardProps {
  icon: FC<{ size?: number; color?: string }>;
  iconColor: string;
  label: string;
  value: string | number;
  sub?: string;
  delay?: number;
}

const StatCard: FC<StatCardProps> = ({ icon: Icon, iconColor, label, value, sub, delay = 0 }) => (
  <div className="sd-card sd-stat-card" style={{ padding:'16px 18px', display:'flex', flexDirection:'column', gap:10, animation:`sd-fade .35s ease ${delay}s both` }}>
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
      <div style={{ width:34, height:34, borderRadius:9, background:`${iconColor}18`, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Icon size={17} color={iconColor} />
      </div>
      {sub && <span style={{ fontSize:'0.7rem', fontWeight:700, color:'#94a3b8', background:'#f8fafc', borderRadius:20, padding:'2px 8px' }}>{sub}</span>}
    </div>
    <div>
      <div style={{ fontSize:'1.35rem', fontWeight:800, color:'#0f172a', lineHeight:1.1 }}>{value}</div>
      <div style={{ fontSize:'0.7rem', color:'#64748b', marginTop:3 }}>{label}</div>
    </div>
  </div>
);

export default StatCard;
