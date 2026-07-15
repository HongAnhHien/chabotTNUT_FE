import { type FC, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Users, Loader2, ArrowRight, FileSearch, KeyRound,
} from 'lucide-react';
import { useManageUsersStore } from './admin/manage_users/stores/user_store';
import { useUser } from '@/hooks/useUser';
import AnalyticsOverviewSection from './admin/analytics/AnalyticsOverviewSection';
import KnowledgeMapSection from './admin/analytics/KnowledgeMapSection';
import ReportSection from './admin/analytics/ReportSection';

const formatDate = () =>
  new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

// ── Sub-components ─────────────────────────────────────────────────────────────
export const StatCard: FC<{
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  loading?: boolean;
}> = ({ label, value, sub, icon, loading }) => (
  <div className="rounded-xl border border-border bg-card p-5 flex items-start gap-4">
    <div className="p-2.5 rounded-lg bg-[#2F6B3F]/10 shrink-0">{icon}</div>
    <div className="min-w-0">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mt-1.5" />
      ) : (
        <p className="text-2xl font-bold text-foreground mt-0.5 tabular-nums">{value}</p>
      )}
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  </div>
);

const QuickLink: FC<{ label: string; sub: string; icon: React.ReactNode; onClick: () => void }> = ({ label, sub, icon, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-3 rounded-xl border border-border bg-card p-5 text-left hover:border-[#2F6B3F]/40 hover:bg-[#2F6B3F]/5 transition-colors"
  >
    <div className="p-2.5 rounded-lg bg-[#2F6B3F]/10 shrink-0">{icon}</div>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
    </div>
    <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
  </button>
);

// ── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard: FC = () => {
  const navigate = useNavigate();
  const { profile } = useUser();

  const {
    meta: userMeta,
    isLoading: isUserLoading,
    fetchUsers,
  } = useManageUsersStore();

  useEffect(() => {
    fetchUsers({ page: 1, per_page: 1 });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: '#1e4429' }}>
          Xin chào, {profile?.name ?? 'Admin'} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">{formatDate()}</p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          label="Tổng người dùng"
          value={userMeta.total.toLocaleString()}
          sub="tài khoản hệ thống"
          icon={<Users className="w-5 h-5 text-[#2F6B3F]" />}
          loading={isUserLoading}
        />
      </div>

      {/* ── Quick links ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <QuickLink
          label="Quản lý tài khoản"
          sub="Xem, thêm, sửa tài khoản người dùng"
          icon={<Users className="w-5 h-5 text-[#2F6B3F]" />}
          onClick={() => navigate('/admin/dashboard/manage-users')}
        />
        <QuickLink
          label="Nhật ký xử lý"
          sub="Theo dõi các lần parse tài liệu"
          icon={<FileSearch className="w-5 h-5 text-[#2F6B3F]" />}
          onClick={() => navigate('/admin/dashboard/parse-logs')}
        />
        <QuickLink
          label="API key LlamaParse"
          sub="Quản lý key dùng để parse tài liệu"
          icon={<KeyRound className="w-5 h-5 text-[#2F6B3F]" />}
          onClick={() => navigate('/admin/dashboard/api-settings')}
        />
      </div>

      {/* ── Chatbot analytics ── */}
      <div>
        <h2 className="text-sm font-bold text-foreground mb-3">Thống kê chatbot</h2>
        <AnalyticsOverviewSection />
      </div>

      <KnowledgeMapSection />
      <ReportSection />
    </div>
  );
};

export default Dashboard;
