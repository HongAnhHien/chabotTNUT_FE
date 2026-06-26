import { type FC } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { fmtDate } from './dashboard.constants';

const MiniLineChart: FC<{ trend: { score_10: number; created_at: string }[] }> = ({ trend }) => {
  if (trend.length < 2) return (
    <div style={{ height:80, display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8', fontSize:'0.72rem' }}>
      Chưa đủ dữ liệu
    </div>
  );

  const data = trend.map(t => ({ date: fmtDate(t.created_at), score: t.score_10 }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top:8, right:4, left:-28, bottom:0 }}>
        <defs>
          <linearGradient id="score-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#2966EB" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#2966EB" stopOpacity={0}   />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize:9, fill:'#94a3b8' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis domain={[0, 10]} tick={{ fontSize:9, fill:'#94a3b8' }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ fontSize:'0.72rem', borderRadius:8, border:'1px solid #eef0f5', boxShadow:'0 4px 12px rgba(0,0,0,0.08)' }}
          formatter={(v) => [typeof v === 'number' ? v.toFixed(1) : v, 'Điểm']}
          labelStyle={{ color:'#64748b', fontWeight:600 }}
        />
        <Area type="monotone" dataKey="score" stroke="#2966EB" strokeWidth={2} fill="url(#score-grad)"
          dot={{ r:3, fill:'white', stroke:'#2966EB', strokeWidth:2 }} activeDot={{ r:5 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default MiniLineChart;
