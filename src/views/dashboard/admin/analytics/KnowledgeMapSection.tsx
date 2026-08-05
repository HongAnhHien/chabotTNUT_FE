import { type FC, useCallback, useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Loader2, ChevronDown, Map } from 'lucide-react';
import AdminApi from '@/infra/admin/admin_api';
import type { ISubject, IKnowledgeMapItem } from '@/infra/api/interfaces/IAnalytics';

const COLOR_MAP: Record<string, string> = { red: '#dc2626', yellow: '#d97706', green: '#16a34a' };

const KnowledgeMapSection: FC = () => {
  const [subjects,   setSubjects]   = useState<ISubject[]>([]);
  const [subjectId,  setSubjectId]  = useState('');
  const [data,       setData]       = useState<IKnowledgeMapItem[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading,    setLoading]    = useState(false);

  useEffect(() => {
    AdminApi.getSubjects().then(res => setSubjects(res.data)).catch(() => {});
  }, []);

  const loadKnowledgeMap = useCallback((id: string) => {
    setLoading(true);
    AdminApi.getKnowledgeMap(id, 30)
      .then(res => {
        setData(res.knowledge_map ?? []);
        setTotalStudents(res.total_students ?? 0);
      })
      .catch(() => { setData([]); setTotalStudents(0); })
      .finally(() => setLoading(false));
  }, []);

  const handleSelectSubject = (id: string) => {
    setSubjectId(id);
    if (id) loadKnowledgeMap(id);
    else { setData([]); setTotalStudents(0); }
  };

  const top10 = [...data].sort((a, b) => b.unique_users - a.unique_users).slice(0, 10);

  return (
    <div className="ad-card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(219,39,119,0.1)', color: '#db2777', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Map size={14} />
          </div>
          <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Bản đồ vùng rỗng kiến thức</p>
        </div>
        <div style={{ position: 'relative' }}>
          <select
            value={subjectId}
            onChange={e => handleSelectSubject(e.target.value)}
            className="ad-select"
          >
            <option value="">Chọn môn học...</option>
            {subjects.map(s => (
              <option key={s.id} value={s.ma_mon}>{s.ten_mon} ({s.ma_mon})</option>
            ))}
          </select>
          <ChevronDown size={13} color="#94a3b8" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        </div>
      </div>

      {!subjectId ? (
        <p style={{ fontSize: '0.76rem', color: '#94a3b8', margin: 0 }}>Chọn 1 môn học để xem bản đồ vùng rỗng kiến thức.</p>
      ) : loading ? (
        <Loader2 size={18} color="#94a3b8" style={{ animation: 'ad-spin 1s linear infinite' }} />
      ) : totalStudents === 0 ? (
        <p style={{ fontSize: '0.76rem', color: '#94a3b8', margin: 0 }}>Chưa đủ dữ liệu (chưa có giáo viên nào sync lớp cho môn này).</p>
      ) : top10.length === 0 ? (
        <p style={{ fontSize: '0.76rem', color: '#94a3b8', margin: 0 }}>Chưa có dữ liệu hỏi đáp cho môn này.</p>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(200, top10.length * 34)}>
          <BarChart data={top10} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
            <YAxis type="category" dataKey="chapter_title" width={140} tick={{ fontSize: 11, fill: '#334155' }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ fontSize: '0.72rem', borderRadius: 8, border: '1px solid #e2e8f0' }}
              formatter={(_v, _n, item) => {
                const p = item.payload as IKnowledgeMapItem;
                return [`${p.hit_count} lượt · ${p.unique_users} SV · TB ${p.avg_hits_per_user}/SV`, 'Chi tiết'];
              }}
            />
            <Bar dataKey="unique_users" radius={[0, 4, 4, 0]} maxBarSize={20}>
              {top10.map((item, i) => (
                <Cell key={i} fill={item.color ? COLOR_MAP[item.color] : '#94a3b8'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default KnowledgeMapSection;
