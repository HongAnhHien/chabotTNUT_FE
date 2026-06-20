import { type FC, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  MapPin, Users, AlertTriangle, ShieldCheck,
  Loader2, ArrowRight, TrendingUp, Map,
} from 'lucide-react';
import { useManageLocationsStore } from './admin/manage_locations/stores/location_store';
import { useManageUsersStore }    from './admin/manage_users/stores/user_store';
import { useUser }                from '@/hooks/useUser';

// ── Helpers ────────────────────────────────────────────────────────────────────
const MUC_DO_COLOR: Record<string, { bar: string; badge: string; dot: string }> = {
  'cao':        { bar: 'bg-red-500',    badge: 'bg-red-50 text-red-700 border-red-200',       dot: 'bg-red-500'    },
  'trung bình': { bar: 'bg-yellow-500', badge: 'bg-yellow-50 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500' },
  'thấp':       { bar: 'bg-emerald-500',badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
};
const defaultColor = { bar: 'bg-gray-400', badge: 'bg-gray-50 text-gray-700 border-gray-200', dot: 'bg-gray-400' };
const getColor = (muc_do: string) => MUC_DO_COLOR[muc_do.toLowerCase()] ?? defaultColor;

const formatDate = () =>
  new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

// ── Sub-components ─────────────────────────────────────────────────────────────
const StatCard: FC<{
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

// ── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard: FC = () => {
  const navigate = useNavigate();
  const { profile } = useUser();

  const {
    statistics, locations, pagination: locPag,
    isStatsLoading, isLoading: isLocLoading,
    fetchStatistics, fetchLocations,
  } = useManageLocationsStore();

  const {
    pagination: userPag,
    isLoading: isUserLoading,
    fetchUsers,
  } = useManageUsersStore();

  useEffect(() => {
    fetchStatistics();
    fetchLocations({ page: 1, limit: 5 });
    fetchUsers({ page: 1, limit: 1 });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const highRisk = statistics?.by_muc_do_nguy_hiem
    .filter((x) => x.muc_do === 'cao')
    .reduce((s, x) => s + x.count, 0) ?? 0;

  const safeCount = statistics?.by_muc_do_nguy_hiem
    .filter((x) => x.muc_do === 'thấp')
    .reduce((s, x) => s + x.count, 0) ?? 0;

  const totalLoc = statistics?.total ?? locPag.total;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1e4429' }}>
            Xin chào, {profile?.name ?? 'Admin'} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{formatDate()}</p>
        </div>
        <button
          onClick={() => navigate('/admin/dashboard/manage-locations')}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-[#2F6B3F]/30 text-[#2F6B3F] hover:bg-[#2F6B3F]/5 transition-colors"
        >
          <Map className="w-3.5 h-3.5" />
          Quản lý địa điểm
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Tổng địa điểm"
          value={totalLoc.toLocaleString()}
          sub="đã ghi nhận"
          icon={<MapPin className="w-5 h-5 text-[#2F6B3F]" />}
          loading={isStatsLoading}
        />
        <StatCard
          label="Tổng người dùng"
          value={userPag.total.toLocaleString()}
          sub="tài khoản hệ thống"
          icon={<Users className="w-5 h-5 text-[#2F6B3F]" />}
          loading={isUserLoading}
        />
        <StatCard
          label="Nguy cơ cao"
          value={highRisk.toLocaleString()}
          sub="Mức độ cao"
          icon={<AlertTriangle className="w-5 h-5 text-[#2F6B3F]" />}
          loading={isStatsLoading}
        />
        <StatCard
          label="An toàn"
          value={safeCount.toLocaleString()}
          sub="Mức độ thấp"
          icon={<ShieldCheck className="w-5 h-5 text-[#2F6B3F]" />}
          loading={isStatsLoading}
        />
      </div>

      {/* ── Middle row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Phân loại nguy cơ */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            Phân loại nguy cơ
          </h2>
          {isStatsLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : statistics?.by_muc_do_nguy_hiem.length ? (
            <div className="space-y-4">
              {statistics.by_muc_do_nguy_hiem.map(({ muc_do, count }) => {
                const pct = totalLoc ? Math.round((count / totalLoc) * 100) : 0;
                const c = getColor(muc_do);
                return (
                  <div key={muc_do}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${c.dot}`} />
                        <span className="text-sm text-muted-foreground capitalize">{muc_do}</span>
                      </div>
                      <span className="text-sm font-semibold tabular-nums text-foreground">{count.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${c.bar}`} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{pct}% tổng số</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">Chưa có dữ liệu</p>
          )}
        </div>

        {/* Phân bố theo tỉnh */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            Phân bố theo tỉnh / TP
          </h2>
          {isStatsLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : statistics?.by_tinh.length ? (
            <div className="space-y-2">
              {statistics.by_tinh
                .sort((a, b) => b.count - a.count)
                .slice(0, 8)
                .map(({ tinh, count }) => {
                  const pct = totalLoc ? Math.round((count / totalLoc) * 100) : 0;
                  return (
                    <div key={tinh} className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-32 shrink-0 truncate">{tinh}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#2F6B3F]/70"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium tabular-nums text-foreground w-8 text-right shrink-0">{count}</span>
                    </div>
                  );
                })}
              {(statistics.by_tinh.length > 8) && (
                <p className="text-xs text-muted-foreground pt-1">
                  +{statistics.by_tinh.length - 8} tỉnh khác
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">Chưa có dữ liệu</p>
          )}
        </div>
      </div>

      {/* ── Recent locations ── */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            Địa điểm gần đây
          </h2>
          <button
            onClick={() => navigate('/admin/dashboard/manage-locations')}
            className="flex items-center gap-1 text-xs text-[#2F6B3F] font-medium hover:underline"
          >
            Xem tất cả <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {isLocLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : locations.length ? (
          <div className="divide-y divide-border">
            {locations.map((loc) => {
              const mucDo = loc.cham_diem?.nguy_co ?? '';
              const c = getColor(mucDo);
              return (
                <div key={loc._id} className="flex items-center gap-3 py-2.5 hover:bg-muted/50 px-2 -mx-2 rounded-lg transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {[loc.ten_xa, loc.ten_huyen].filter(Boolean).join(', ')}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{loc.ten_tinh}</p>
                  </div>
                  {mucDo && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize shrink-0 ${c.badge}`}>
                      {mucDo}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">Chưa có địa điểm nào</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
