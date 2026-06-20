import { create } from 'zustand';
import type { IAdminUser, IPagination, ICreateUserRequest, IUpdateUserRequest } from '@/infra/api/interfaces/IUser';
import type { IApiError } from '@/helper/IError';
import type { IGetUsersParams } from '@/infra/user/user_api';
import UserApi from '@/infra/user/user_api';
import { handleApiError } from '@/helper/error_handler';
import toast from 'react-hot-toast';

type DialogMode = 'create' | 'edit' | 'delete' | null;

interface ManageUsersState {
  users:       IAdminUser[];
  pagination:  IPagination;
  selected:    IAdminUser | null;
  dialogMode:  DialogMode;
  isLoading:   boolean;
  isMutating:  boolean;
  error:       IApiError | null;

  fetchUsers:       (params?: IGetUsersParams) => Promise<void>;
  fetchUserById:    (id: string) => Promise<void>;
  createUser:       (data: ICreateUserRequest) => Promise<boolean>;
  updateUser:       (id: string, data: IUpdateUserRequest) => Promise<boolean>;
  toggleActiveUser: (id: string) => Promise<boolean>;
  deleteUser:       (id: string) => Promise<boolean>;
  openDialog:       (mode: DialogMode, user?: IAdminUser) => void;
  closeDialog:      () => void;
  clearError:       () => void;
}

const DEFAULT_PAGINATION: IPagination = { page: 1, limit: 10, total: 0, totalPages: 1 };

export const useManageUsersStore = create<ManageUsersState>()((set, get) => ({
  users:      [],
  pagination: DEFAULT_PAGINATION,
  selected:   null,
  dialogMode: null,
  isLoading:  false,
  isMutating: false,
  error:      null,

  fetchUsers: async (params) => {
    try {
      set({ isLoading: true, error: null });
      const res = await UserApi.getUsers(params);
      set({ users: res.data.users, pagination: res.data.pagination, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: handleApiError(error, false) });
    }
  },

  fetchUserById: async (id) => {
    try {
      set({ isLoading: true, error: null });
      const res = await UserApi.getUserById(id);
      set({ selected: res.data.user, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: handleApiError(error, false) });
    }
  },

  createUser: async (data) => {
    try {
      set({ isMutating: true, error: null });
      const res = await UserApi.createUser(data);
      toast.success(res.message);
      set({ isMutating: false });
      await get().fetchUsers();
      return true;
    } catch (error) {
      set({ isMutating: false, error: handleApiError(error, false) });
      return false;
    }
  },

  updateUser: async (id, data) => {
    try {
      set({ isMutating: true, error: null });
      const res = await UserApi.updateUser(id, data);
      // Cập nhật trực tiếp trong list, không cần refetch
      set((s) => ({
        users: s.users.map((u) => u._id === id ? { ...u, ...res.data.user } : u),
        isMutating: false,
      }));
      toast.success(res.message);
      return true;
    } catch (error) {
      set({ isMutating: false, error: handleApiError(error, false) });
      return false;
    }
  },

  toggleActiveUser: async (id) => {
    try {
      set({ isMutating: true });
      const res = await UserApi.toggleActiveUser(id);
      set((s) => ({
        users: s.users.map((u) =>
          u._id === id
            // ưu tiên giá trị từ API, fallback flip giá trị hiện tại
            ? { ...u, isActive: res.data?.isActive ?? !u.isActive }
            : u
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

  deleteUser: async (id) => {
    try {
      set({ isMutating: true });
      const res = await UserApi.deleteUser(id);
      set((s) => ({
        users: s.users.filter((u) => u._id !== id),
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

  openDialog:  (mode, user = undefined) => set({ dialogMode: mode, selected: user ?? null, error: null }),
  closeDialog: () => set({ dialogMode: null, selected: null, error: null }),
  clearError:  () => set({ error: null }),
}));
