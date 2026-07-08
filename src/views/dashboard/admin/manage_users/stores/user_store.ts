import { create } from 'zustand';
import type { IAdminUser, IAdminUsersMeta, IBlockUserRequest } from '@/infra/api/interfaces/IUser';
import type { IApiError } from '@/helper/IError';
import type { IGetUsersParams } from '@/infra/user/user_api';
import UserApi from '@/infra/user/user_api';
import { handleApiError } from '@/helper/error_handler';
import toast from 'react-hot-toast';

type DialogMode = 'block' | null;

interface ManageUsersState {
  users:       IAdminUser[];
  meta:        IAdminUsersMeta;
  selected:    IAdminUser | null;
  dialogMode:  DialogMode;
  isLoading:   boolean;
  isMutating:  boolean;
  error:       IApiError | null;

  fetchUsers:    (params?: IGetUsersParams) => Promise<void>;
  fetchUserById: (id: string) => Promise<void>;
  blockUser:     (id: string, data?: IBlockUserRequest) => Promise<boolean>;
  unblockUser:   (id: string) => Promise<boolean>;
  openDialog:    (mode: DialogMode, user?: IAdminUser) => void;
  closeDialog:   () => void;
  clearError:    () => void;
}

const DEFAULT_META: IAdminUsersMeta = { total: 0, per_page: 20, current_page: 1, last_page: 1 };

export const useManageUsersStore = create<ManageUsersState>()((set) => ({
  users:      [],
  meta:       DEFAULT_META,
  selected:   null,
  dialogMode: null,
  isLoading:  false,
  isMutating: false,
  error:      null,

  fetchUsers: async (params) => {
    try {
      set({ isLoading: true, error: null });
      const res = await UserApi.getUsers(params);
      set({ users: res.data, meta: res.meta, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: handleApiError(error, false) });
    }
  },

  fetchUserById: async (id) => {
    try {
      set({ isLoading: true, error: null });
      const res = await UserApi.getUserById(id);
      set({ selected: res.data, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: handleApiError(error, false) });
    }
  },

  blockUser: async (id, data) => {
    try {
      set({ isMutating: true, error: null });
      const res = await UserApi.blockUser(id, data);
      set((s) => ({
        users: s.users.map((u) => u._id === id
          ? { ...u, is_blocked: res.data.is_blocked, blocked_at: res.data.blocked_at, blocked_reason: res.data.blocked_reason }
          : u),
        isMutating: false,
      }));
      toast.success(res.message);
      return true;
    } catch (error) {
      set({ isMutating: false, error: handleApiError(error, false) });
      return false;
    }
  },

  unblockUser: async (id) => {
    try {
      set({ isMutating: true, error: null });
      const res = await UserApi.unblockUser(id);
      set((s) => ({
        users: s.users.map((u) => u._id === id
          ? { ...u, is_blocked: false, blocked_at: null, blocked_reason: null }
          : u),
        isMutating: false,
      }));
      toast.success(res.message);
      return true;
    } catch (error) {
      set({ isMutating: false, error: handleApiError(error, false) });
      return false;
    }
  },

  openDialog:  (mode, user = undefined) => set({ dialogMode: mode, selected: user ?? null, error: null }),
  closeDialog: () => set({ dialogMode: null, selected: null, error: null }),
  clearError:  () => set({ error: null }),
}));
