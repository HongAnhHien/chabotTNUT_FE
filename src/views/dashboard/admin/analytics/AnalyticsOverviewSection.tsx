import { type FC, useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { MessageCircle, GraduationCap, ThumbsUp, Activity, Loader2, UserCog, TrendingUp, BarChart3 } from 'lucide-react';
import ChatApi from '@/infra/chat/chat_api';
import AdvisorApi from '@/infra/chat/advisor_api';
import AdminApi from '@/infra/admin/admin_api';
import { ProxyPermissionError } from '@/infra/api/checkProxyError';
import type { IAnalyticsSummary } from '@/infra/api/interfaces/IChat';
import type { IAdvisorTrendItem } from '@/infra/api/interfaces/IAdvisor';
import type { IWeeklyStatItem } from '@/infra/api/interfaces/IAnalytics';
import { StatCard } from '@/views/dashboard/Dashboard';

const ChartCard: FC<{ title: string; icon: React.ReactNode; accent: string; children: React.ReactNode }> = ({ title, icon, accent, children }) => (
  <div className="ad-card" style={{ padding: 20 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <div style={{ width: 26, height: 26, borderRadius: 8, background: `${accent}1a`, color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>{title}</p>
    </div>
    {children}
  </div>
);

const SummaryRow: FC<{ title: string; icon: React.ReactNode; grad: string; glow: string; data: IAnalyticsSummary | null; error: string | null; loading: boolean }> = ({ title, icon, grad, glow, data, error, loading }) => (
  <div className="ad-card" style={{ padding: 20 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <div style={{ width: 32, height: 32, borderRadius: 10, background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 3px 8px ${glow}` }}>
        {icon}
      </div>
      <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>{title}</p>
    </div>
    {loading ? (
      <Loader2 size={18} color="#94a3b8" style={{ animation: 'ad-spin 1s linear infinite' }} />
    ) : error ? (
      <p style={{ fontSize: '0.76rem', color: '#dc2626', margin: 0 }}>Không có quyền xem: {error}</p>
    ) : !data ? (
      <p style={{ fontSize: '0.76rem', color: '#94a3b8', margin: 0 }}>Không tải được dữ liệu.</p>
    ) : (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
        <StatCard
          label="Người dùng" value={data.unique_users}
          sub={data.unique_by_role ? `${data.unique_by_role.student ?? 0} SV · ${data.unique_by_role.teacher ?? 0} GV` : undefined}
          icon={<MessageCircle size={16} />} tint="#eef2ff" ink="#4f46e5"
        />
        <StatCard label="Tin nhắn" value={data.total_messages} icon={<MessageCircle size={16} />} tint="#eff6ff" ink="#2563eb" />
        <StatCard label="Hữu ích" value={data.helpful_rate ? `${data.helpful_rate.rate}%` : '—'} sub={data.helpful_rate ? undefined : 'Chưa có đánh giá'} icon={<ThumbsUp size={16} />} tint="#f0fdf4" ink="#16a34a" />
        <StatCard
          label="Đang hoạt động" value={data.active_now}
          sub={data.active_by_role ? `${data.active_by_role.student ?? 0} SV · ${data.active_by_role.teacher ?? 0} GV` : undefined}
          icon={<Activity size={16} />} tint="#fff7ed" ink="#ea580c"
        />
        {data.personalization_rate && (
          <StatCard label="Cá nhân hoá" value={`${data.personalization_rate.rate}%`} icon={<UserCog size={16} />} tint="#fdf2f8" ink="#db2777" />
        )}
      </div>
    )}
  </div>
);

// Biểu đồ nhỏ, 1 trục Y riêng cho mỗi chỉ số (small multiples) — tránh kiểu 2-trục-Y
// (dual-axis) vì 2 chỉ số lệch scale xa nhau (tin nhắn có thể gấp chục lần số người
// dùng) khiến 1 trong 2 đường bị đè phẳng và dễ đọc nhầm khi so trực tiếp chiều cao.
const MiniTrendChart: FC<{ label: string; color: string; dataKey: string; data: IAdvisorTrendItem[]; showXAxis?: boolean }> = ({ label, color, dataKey, data, showXAxis }) => (
  <div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
      <span style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
      <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#334155' }}>{label}</span>
    </div>
    <ResponsiveContainer width="100%" height={showXAxis ? 96 : 80}>
      <BarChart data={data} margin={{ top: 2, right: 4, left: -28, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="date" hide={!showXAxis} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} width={24} />
        <Tooltip contentStyle={{ fontSize: '0.72rem', borderRadius: 8, border: '1px solid #e2e8f0' }} labelStyle={{ color: '#334155' }} />
        <Bar dataKey={dataKey} name={label} fill={color} radius={[3, 3, 0, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

const fmtWeek = (w: string) => w;

const AnalyticsOverviewSection: FC = () => {
  const [chatSummary,    setChatSummary]    = useState<IAnalyticsSummary | null>(null);
  const [chatError,      setChatError]      = useState<string | null>(null);
  const [advisorSummary, setAdvisorSummary] = useState<IAnalyticsSummary | null>(null);
  const [advisorError,   setAdvisorError]   = useState<string | null>(null);
  const [trend,          setTrend]          = useState<IAdvisorTrendItem[]>([]);
  const [weekly,         setWeekly]         = useState<IWeeklyStatItem[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingCharts,  setLoadingCharts]  = useState(true);

  useEffect(() => {
    // allSettled — CVHT/chat môn học có thể chặn quyền độc lập nhau (VD chỉ 1 bên trả
    // lỗi phân quyền), không để 1 bên lỗi làm mất luôn dữ liệu bên còn lại.
    Promise.allSettled([ChatApi.getAnalyticsSummary(), AdvisorApi.getAnalyticsSummary()])
      .then(([chat, advisor]) => {
        if (chat.status === 'fulfilled') setChatSummary(chat.value.data);
        else if (chat.reason instanceof ProxyPermissionError) setChatError(chat.reason.message);

        if (advisor.status === 'fulfilled') setAdvisorSummary(advisor.value.data);
        else if (advisor.reason instanceof ProxyPermissionError) setAdvisorError(advisor.reason.message);
      })
      .finally(() => setLoadingSummary(false));

    Promise.all([AdvisorApi.getAnalyticsTrend(7), AdminApi.getWeeklyAnalytics()])
      .then(([t, w]) => {
        setTrend(t.data?.trend ?? []);
        setWeekly(w.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoadingCharts(false));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
        <SummaryRow title="Chat môn học" icon={<MessageCircle size={16} color="white" />} grad="linear-gradient(135deg,#1e3a8a,#2563eb)" glow="rgba(37,99,235,0.3)" data={chatSummary} error={chatError} loading={loadingSummary} />
        <SummaryRow title="Cố vấn học tập (CVHT)" icon={<GraduationCap size={16} color="white" />} grad="linear-gradient(135deg,#065f46,#059669)" glow="rgba(5,150,105,0.3)" data={advisorSummary} error={advisorError} loading={loadingSummary} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
        <ChartCard title="Xu hướng CVHT sử dụng (7 ngày gần nhất)" icon={<TrendingUp size={14} />} accent="#7c3aed">
          {loadingCharts ? (
            <Loader2 size={18} color="#94a3b8" style={{ animation: 'ad-spin 1s linear infinite' }} />
          ) : trend.length === 0 ? (
            <p style={{ fontSize: '0.76rem', color: '#94a3b8', margin: 0 }}>Chưa có dữ liệu.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <MiniTrendChart label="Tin nhắn" color="#2563eb" dataKey="message_count" data={trend} />
              <MiniTrendChart label="Người dùng" color="#7c3aed" dataKey="unique_users" data={trend} showXAxis />
            </div>
          )}
        </ChartCard>

        <ChartCard title="Thống kê 12 tuần gần nhất" icon={<BarChart3 size={14} />} accent="#2563eb">
          {loadingCharts ? (
            <Loader2 size={18} color="#94a3b8" style={{ animation: 'ad-spin 1s linear infinite' }} />
          ) : weekly.length === 0 ? (
            <p style={{ fontSize: '0.76rem', color: '#94a3b8', margin: 0 }}>Chưa có dữ liệu.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weekly} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="week" tickFormatter={fmtWeek} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: '0.72rem', borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Bar dataKey="total_messages" name="Tin nhắn" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
};

export default AnalyticsOverviewSection;
