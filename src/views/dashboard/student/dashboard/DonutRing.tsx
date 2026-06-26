import { type FC } from 'react';
import { PieChart, Pie, Tooltip, ResponsiveContainer } from 'recharts';

const DonutRing: FC<{ completed: number; pending: number; overdue: number }> = ({ completed, pending, overdue }) => {
  const total = completed + pending + overdue || 1;
  const rate  = Math.round((completed / total) * 100);
  const data  = [
    { name: 'Hoàn thành', value: completed || 0, fill: '#16a34a' },
    { name: 'Đang chờ',   value: pending   || 0, fill: '#94a3b8' },
    { name: 'Quá hạn',    value: overdue   || 0, fill: '#dc2626' },
  ];
  const isEmpty = total === 0 || data.every(d => d.value === 0);

  return (
    <div style={{ position:'relative', flex:1, minHeight:0, overflow:'hidden' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={isEmpty ? [{ name: '', value: 1, fill: '#f1f5f9' }] : data}
            cx="50%" cy="50%"
            innerRadius="44%" outerRadius="62%"
            startAngle={90} endAngle={-270}
            dataKey="value" strokeWidth={0}
          />
          {!isEmpty && (
            <Tooltip
              contentStyle={{ fontSize:'0.68rem', borderRadius:8, border:'1px solid #eef0f5' }}
              formatter={(v) => [v, '']}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
        <div style={{ fontSize:'1rem', fontWeight:800, color:'#0f172a', lineHeight:1 }}>{rate}%</div>
        <div style={{ fontSize:'0.5rem', color:'#94a3b8', fontWeight:600, marginTop:2 }}>HT</div>
      </div>
    </div>
  );
};

export default DonutRing;
