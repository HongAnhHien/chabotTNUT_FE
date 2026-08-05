import { type FC, useEffect, useState } from 'react';
import { Loader2, Users, MessageCircleQuestion, MessageCircleOff, Zap, PieChart, Tags } from 'lucide-react';
import AdvisorApi from '@/infra/chat/advisor_api';
import { ProxyPermissionError } from '@/infra/api/checkProxyError';
import type { IStudentActivityResponse, ITopicGroupsResponse } from '@/infra/api/interfaces/IAdvisor';

const ACTIVITY_CFG = {
  active:     { icon: Zap,                   tint: '#f0fdf4', ink: '#16a34a' },
  occasional: { icon: MessageCircleQuestion, tint: '#fffbeb', ink: '#d97706' },
  low:        { icon: MessageCircleOff,      tint: '#fff7ed', ink: '#ea580c' },
  unused:     { icon: Users,                 tint: '#f8fafc', ink: '#64748b' },
} as const;

const TOPIC_COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#db2777', '#0891b2'];

const CvhtStatsSection: FC = () => {
  const [activity, setActivity] = useState<IStudentActivityResponse['data'] | null>(null);
  const [topics,   setTopics]   = useState<ITopicGroupsResponse['data'] | null>(null);
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([AdvisorApi.getStudentActivity(30), AdvisorApi.getTopicGroups(30)])
      .then(([a, t]) => {
        setActivity(a.data);
        setTopics(t.data);
      })
      .catch(err => {
        if (err instanceof ProxyPermissionError) setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="ad-card" style={{ padding: 20 }}>
        <Loader2 size={18} color="#94a3b8" style={{ animation: 'ad-spin 1s linear infinite' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="ad-card" style={{ padding: 20 }}>
        <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>Thống kê CVHT</p>
        <p style={{ fontSize: '0.76rem', color: '#dc2626', margin: 0 }}>Không có quyền xem: {error}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
      <div className="ad-card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(124,58,237,0.1)', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <PieChart size={14} />
          </div>
          <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Phân loại mức độ dùng CVHT (30 ngày)</p>
        </div>
        {!activity || activity.total_students === 0 ? (
          <p style={{ fontSize: '0.76rem', color: '#94a3b8', margin: 0 }}>Chưa có dữ liệu.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {(['active', 'occasional', 'low', 'unused'] as const).map(key => {
              const cfg = ACTIVITY_CFG[key];
              const Icon = cfg.icon;
              return (
                <div key={key} className="ad-stat-card" style={{ padding: '12px 14px' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: cfg.tint, color: cfg.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={15} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: '0.68rem', color: '#94a3b8', margin: 0, lineHeight: 1.3 }}>{activity[key].label}</p>
                    <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{activity[key].count}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="ad-card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(37,99,235,0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Tags size={14} />
          </div>
          <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Chủ đề SV hỏi nhiều (30 ngày)</p>
        </div>
        {!topics || topics.groups.length === 0 ? (
          <p style={{ fontSize: '0.76rem', color: '#94a3b8', margin: 0 }}>Chưa có dữ liệu.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {topics.groups.map((g, i) => {
              const max = topics.groups[0].count || 1;
              const color = TOPIC_COLORS[i % TOPIC_COLORS.length];
              return (
                <div key={i} className="ad-topic-row" style={{ animationDelay: `${i * 0.04}s` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: 5 }}>
                    <span style={{ color: '#334155', fontWeight: 600 }}>{g.group}</span>
                    <span style={{ color, fontWeight: 700 }}>{g.count}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 6, background: '#f1f5f9', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 6, width: `${(g.count / max) * 100}%`, background: color, transition: 'width .5s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CvhtStatsSection;
