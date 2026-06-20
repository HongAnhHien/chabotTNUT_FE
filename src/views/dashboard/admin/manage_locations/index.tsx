import { type FC, useEffect, useState } from 'react';
import { Plus, MapPin, AlertTriangle, Map, List, ChevronDown } from 'lucide-react';
import HeaderComponent from '@/components/common/header_table';
import { Button } from '@/components/ui/button';
import { useManageLocationsStore } from './stores/location_store';
import RenderTableManageLocations from './table/RenderTable';
import LocationMap from './map/LocationMap';
import { CreateLocationDialog, EditLocationDialog } from './dialogs/LocationFormDialog';
import DeleteLocationDialog from './dialogs/DeleteLocationDialog';
import LocationDetailDialog from './dialogs/LocationDetailDialog';

type Tab = 'list' | 'map';

// ── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  icon:     React.ReactNode;
  label:    string;
  value:    string | number;
  sub?:     string;
  color:    string;
}

const StatCard: FC<StatCardProps> = ({ icon, label, value, sub, color }) => (
  <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3 shadow-sm">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}15` }}>
      <span style={{ color }}>{icon}</span>
    </div>
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold leading-tight" style={{ color }}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground truncate">{sub}</p>}
    </div>
  </div>
);

// ── Main ─────────────────────────────────────────────────────────────────────
const ManageLocations: FC = () => {
  const { openDialog, statistics, fetchStatistics, isStatsLoading } = useManageLocationsStore();
  const [tab,       setTab]       = useState<Tab>('list');
  const [showStats, setShowStats] = useState(() => window.innerWidth >= 768);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);


  return (
    <div className="space-y-5">
      <HeaderComponent
        title="Quản lý địa điểm"
        description="Dữ liệu chấm điểm nguy cơ địa chất trên toàn quốc"
        actions={
          <Button
            size="lg"
            className="gap-1.5 text-white"
            style={{ background: 'linear-gradient(135deg, #2F6B3F, #3d7a50)' }}
            onClick={() => openDialog('create')}
          >
            <Plus className="h-4 w-4" />
            Thêm địa điểm
          </Button>
        }
      />

      {/* Statistics Cards */}
      <div>
        <button
          type="button"
          onClick={() => setShowStats((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showStats ? '' : '-rotate-90'}`} />
          {showStats ? 'Ẩn thống kê' : 'Hiện thống kê'}
        </button>

        {showStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              icon={<MapPin className="h-5 w-5" />}
              label="Tổng địa điểm"
              value={isStatsLoading ? '...' : (statistics?.total ?? 0)}
              color="#2F6B3F"
            />
            {[
              { muc_do: 'cao',        label: 'Nguy cơ cao',        color: '#dc2626' },
              { muc_do: 'trung bình', label: 'Nguy cơ trung bình', color: '#ea580c' },
              { muc_do: 'thấp',       label: 'Nguy cơ thấp',       color: '#2F6B3F' },
            ].map(({ muc_do, label, color }) => {
              const item = statistics?.by_muc_do_nguy_hiem?.find((x) => x.muc_do === muc_do);
              return (
                <StatCard
                  key={muc_do}
                  icon={<AlertTriangle className="h-5 w-5" />}
                  label={label}
                  value={isStatsLoading ? '...' : (item?.count ?? 0)}
                  sub="địa điểm"
                  color={color}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 w-fit border border-border">
        <button
          onClick={() => setTab('list')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === 'list'
              ? 'bg-white dark:bg-muted  shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <List className="h-4 w-4" />
          Danh sách
        </button>
        <button
          onClick={() => setTab('map')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === 'map'
              ? 'bg-white dark:bg-muted  shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Map className="h-4 w-4" />
          Bản đồ
        </button>
      </div>

      {/* Content */}
      {tab === 'list' ? <RenderTableManageLocations /> : <LocationMap />}

      {/* Dialogs */}
      <CreateLocationDialog />
      <EditLocationDialog />
      <DeleteLocationDialog />
      <LocationDetailDialog />
    </div>
  );
};

export default ManageLocations;
