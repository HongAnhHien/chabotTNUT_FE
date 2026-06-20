import { create } from 'zustand';
import type {
  ILocation,
  ILocationDetail,
  IMapLocation,
  ILocationStatistics,
  ICreateLocationRequest,
  IUpdateLocationRequest,
  IGetLocationsParams,
  IBackupParams,
} from '@/infra/api/interfaces/ILocation';
import type { IPagination } from '@/infra/api/interfaces/IUser';
import type { IApiError } from '@/helper/IError';
import LocationApi from '@/infra/location/location_api';
import { handleApiError } from '@/helper/error_handler';
import toast from 'react-hot-toast';

type DialogMode = 'create' | 'edit' | 'delete' | 'detail' | null;

interface ManageLocationsState {
  locations:   ILocation[];
  pagination:  IPagination;
  selected:    ILocationDetail | null;
  mapLocations: IMapLocation[];
  statistics:  ILocationStatistics | null;
  dialogMode:  DialogMode;
  isLoading:      boolean;
  isMapLoading:   boolean;
  isStatsLoading: boolean;
  isMutating:     boolean;
  isExporting:    boolean;
  isImporting:    boolean;
  error:          IApiError | null;

  fetchLocations:       (params?: IGetLocationsParams) => Promise<void>;
  fetchLocationById:    (id: string) => Promise<void>;
  fetchMapData:         () => Promise<void>;
  fetchStatistics:      () => Promise<void>;
  createLocation:       (data: ICreateLocationRequest) => Promise<boolean>;
  updateLocation:       (id: string, data: IUpdateLocationRequest) => Promise<boolean>;
  deleteLocation:       (id: string) => Promise<boolean>;
  deleteManyLocations:  (ids: string[]) => Promise<boolean>;
  backupLocations:      (params?: IBackupParams) => Promise<boolean>;
  importLocations:      (file: File) => Promise<boolean>;
  openDialog:           (mode: DialogMode, location?: ILocation) => void;
  closeDialog:          () => void;
  clearError:           () => void;
}

const DEFAULT_PAGINATION: IPagination = { page: 1, limit: 10, total: 0, totalPages: 1 };

export const useManageLocationsStore = create<ManageLocationsState>()((set, get) => ({
  locations:       [],
  pagination:      DEFAULT_PAGINATION,
  selected:        null,
  mapLocations:    [],
  statistics:      null,
  dialogMode:      null,
  isLoading:       false,
  isMapLoading:    false,
  isStatsLoading:  false,
  isMutating:      false,
  isExporting:     false,
  isImporting:     false,
  error:           null,

  fetchLocations: async (params) => {
    try {
      set({ isLoading: true, error: null });
      const res = await LocationApi.getLocations(params);
      set({ locations: res.data.locations, pagination: res.data.pagination, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: handleApiError(error, false) });
    }
  },

  fetchLocationById: async (id) => {
    try {
      set({ isLoading: true, error: null });
      const res = await LocationApi.getLocationById(id);
      set({ selected: res.data.location, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: handleApiError(error, false) });
    }
  },

  fetchMapData: async () => {
    try {
      set({ isMapLoading: true });
      const res = await LocationApi.getMapData();
      set({ mapLocations: res.data.locations, isMapLoading: false });
    } catch (error) {
      set({ isMapLoading: false });
      handleApiError(error, false);
    }
  },

  fetchStatistics: async () => {
    try {
      set({ isStatsLoading: true });
      const res = await LocationApi.getStatistics();
      set({ statistics: res.data, isStatsLoading: false });
    } catch (error) {
      set({ isStatsLoading: false });
      handleApiError(error, false);
    }
  },

  createLocation: async (data) => {
    try {
      set({ isMutating: true, error: null });
      const res = await LocationApi.createLocation(data);
      toast.success(res.message);
      set({ isMutating: false });
      await get().fetchLocations();
      return true;
    } catch (error) {
      set({ isMutating: false, error: handleApiError(error, false) });
      return false;
    }
  },

  updateLocation: async (id, data) => {
    try {
      set({ isMutating: true, error: null });
      const res = await LocationApi.updateLocation(id, data);
      set((s) => ({
        locations: s.locations.map((l) =>
          l._id === id
            ? { ...l, ...res.data.location, created_by: res.data.location.created_by ?? l.created_by }
            : l
        ),
        isMutating: false,
      }));
      toast.success(res.message);
      return true;
    } catch (error) {
      set({ isMutating: false, error: handleApiError(error, false) });
      return false;
    }
  },

  deleteLocation: async (id) => {
    try {
      set({ isMutating: true });
      const res = await LocationApi.deleteLocation(id);
      set((s) => ({
        locations: s.locations.filter((l) => l._id !== id),
        pagination: { ...s.pagination, total: s.pagination.total - 1 },
        isMutating: false,
      }));
      toast.success(res.message);
      return true;
    } catch (error) {
      set({ isMutating: false, error: handleApiError(error, false) });
      return false;
    }
  },

  deleteManyLocations: async (ids) => {
    try {
      set({ isMutating: true });
      const res = await LocationApi.deleteManyLocations(ids);
      set((s) => ({
        locations: s.locations.filter((l) => !ids.includes(l._id)),
        pagination: { ...s.pagination, total: Math.max(0, s.pagination.total - ids.length) },
        isMutating: false,
      }));
      toast.success(res.message);
      return true;
    } catch (error) {
      set({ isMutating: false, error: handleApiError(error, false) });
      return false;
    }
  },

  backupLocations: async (params) => {
    try {
      set({ isExporting: true });
      const blob = await LocationApi.backupLocations(params);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `backup_locations_${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      set({ isExporting: false });
      toast.success('Đã tải file backup');
      return true;
    } catch (error) {
      set({ isExporting: false });
      handleApiError(error, true);
      return false;
    }
  },

  importLocations: async (file) => {
    try {
      set({ isImporting: true });
      const res = await LocationApi.importLocations(file);
      set({ isImporting: false });
      toast.success(res.message);
      await get().fetchLocations();
      return true;
    } catch (error) {
      set({ isImporting: false });
      handleApiError(error, true);
      return false;
    }
  },

  openDialog: (mode, location) => {
    if (location && (mode === 'detail' || mode === 'edit' || mode === 'delete')) {
      // For detail we need full data — trigger fetch
      if (mode === 'detail') {
        set({ dialogMode: mode, error: null });
        get().fetchLocationById(location._id);
        return;
      }
      // For edit/delete we cast the list item as partial detail (enough for form)
      set({ dialogMode: mode, selected: location as unknown as ILocationDetail, error: null });
    } else {
      set({ dialogMode: mode, selected: null, error: null });
    }
  },

  closeDialog: () => set({ dialogMode: null, selected: null, error: null }),
  clearError:  () => set({ error: null }),
}));
