import { type FC, useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { MessageCircle, GraduationCap, ThumbsUp, Activity, Loader2 } from 'lucide-react';
import ChatApi from '@/infra/chat/chat_api';
import AdvisorApi from '@/infra/chat/advisor_api';
import AdminApi from '@/infra/admin/admin_api';
import type { IAnalyticsSummary } from '@/infra/api/interfaces/IChat';
import type { IAdvisorTrendItem } from '@/infra/api/interfaces/IAdvisor';
import type { IWeeklyStatItem } from '@/infra/api/interfaces/IAnalytics';
import { StatCard } from '@/views/dashboard/Dashboard';

const ChartCard: FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="rounded-xl border border-border bg-card p-5">
    <p className="text-sm font-semibold text-foreground mb-3">{title}</p>
    {children}
  </div>
);

const SummaryRow: FC<{ title: string; icon: React.ReactNode; data: IAnalyticsSummary | null; loading: boolean }> = ({ title, icon, data, loading }) => (
  <div className="rounded-xl border border-border bg-card p-5">
    <div className="flex items-center gap-2 mb-3">
      {icon}
      <p className="text-sm font-semibold text-foreground">{title}</p>
    </div>
    {loading ? (
      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
    ) : !data ? (
      <p className="text-xs text-muted-foreground">Không tải được dữ liệu.</p>
    ) : (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Người dùng" value={data.unique_users} icon={<MessageCircle className="w-4 h-4 text-[#2F6B3F]" />} />
        <StatCard label="Tin nhắn" value={data.total_messages} icon={<MessageCircle className="w-4 h-4 text-[#2F6B3F]" />} />
        <StatCard label="Hữu ích" value={`${data.helpful_rate}%`} icon={<ThumbsUp className="w-4 h-4 text-[#2F6B3F]" />} />
        <StatCard label="Đang hoạt động" value={data.active_now} icon={<Activity className="w-4 h-4 text-[#2F6B3F]" />} />
      </div>
    )}
  </div>
);

const fmtWeek = (w: string) => w;

const AnalyticsOverviewSection: FC = () => {
  const [chatSummary,    setChatSummary]    = useState<IAnalyticsSummary | null>(null);
  const [advisorSummary, setAdvisorSummary] = useState<IAnalyticsSummary | null>(null);
  const [trend,          setTrend]          = useState<IAdvisorTrendItem[]>([]);
  const [weekly,         setWeekly]         = useState<IWeeklyStatItem[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingCharts,  setLoadingCharts]  = useState(true);

  useEffect(() => {
    Promise.all([ChatApi.getAnalyticsSummary(), AdvisorApi.getAnalyticsSummary()])
      .then(([chat, advisor]) => {
        setChatSummary(chat.data);
        setAdvisorSummary(advisor.data);
      })
      .catch(() => {})
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
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SummaryRow title="Chat môn học" icon={<MessageCircle className="w-4 h-4 text-[#2F6B3F]" />} data={chatSummary} loading={loadingSummary} />
        <SummaryRow title="Cố vấn học tập (CVHT)" icon={<GraduationCap className="w-4 h-4 text-[#2F6B3F]" />} data={advisorSummary} loading={loadingSummary} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ChartCard title="Xu hướng CVHT (7 ngày gần nhất)">
          {loadingCharts ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : trend.length === 0 ? (
            <p className="text-xs text-muted-foreground">Chưa có dữ liệu.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: '0.72rem', borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.7rem' }} />
                <Line dataKey="message_count" name="Tin nhắn" stroke="#2563eb" strokeWidth={2} dot={false} />
                <Line dataKey="unique_users" name="Người dùng" stroke="#7c3aed" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Thống kê 12 tuần gần nhất">
          {loadingCharts ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : weekly.length === 0 ? (
            <p className="text-xs text-muted-foreground">Chưa có dữ liệu.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weekly} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="week" tickFormatter={fmtWeek} tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
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
