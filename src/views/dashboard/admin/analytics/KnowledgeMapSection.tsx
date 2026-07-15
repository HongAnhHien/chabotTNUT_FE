import { type FC, useCallback, useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Loader2, ChevronDown } from 'lucide-react';
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
        setData(res.knowledge_map);
        setTotalStudents(res.total_students);
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
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <p className="text-sm font-semibold text-foreground">Bản đồ vùng rỗng kiến thức</p>
        <div className="relative">
          <select
            value={subjectId}
            onChange={e => handleSelectSubject(e.target.value)}
            className="text-xs border border-border rounded-lg pl-3 pr-7 py-1.5 bg-card text-foreground appearance-none cursor-pointer"
          >
            <option value="">Chọn môn học...</option>
            {subjects.map(s => (
              <option key={s.id} value={s.ma_mon}>{s.ten_mon} ({s.ma_mon})</option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {!subjectId ? (
        <p className="text-xs text-muted-foreground">Chọn 1 môn học để xem bản đồ vùng rỗng kiến thức.</p>
      ) : loading ? (
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      ) : totalStudents === 0 ? (
        <p className="text-xs text-muted-foreground">Chưa đủ dữ liệu (chưa có giáo viên nào sync lớp cho môn này).</p>
      ) : top10.length === 0 ? (
        <p className="text-xs text-muted-foreground">Chưa có dữ liệu hỏi đáp cho môn này.</p>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(200, top10.length * 34)}>
          <BarChart data={top10} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
            <YAxis type="category" dataKey="chapter_title" width={140} tick={{ fontSize: 10, fill: '#334155' }} tickLine={false} axisLine={false} />
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
