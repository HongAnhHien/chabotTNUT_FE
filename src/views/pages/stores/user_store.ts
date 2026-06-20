import { create } from 'zustand';
import type { IUserProfile, IUpdateProfileRequest, IChangePasswordRequest } from '@/infra/api/interfaces/IUser';
import type { IApiError } from '@/helper/IError';
import UserApi from '@/infra/user/user_api';
import { storage } from '@/helper/storage';
import { handleApiError } from '@/helper/error_handler';
import { useAuthStore } from './auth_store';
import toast from 'react-hot-toast';

// ── State & Actions ───────────────────────────────────
interface UserState {
  profile:    IUserProfile | null;
  isLoading:  boolean;
  isUpdating: boolean;
  error:      IApiError | null;

  fetchProfile:   () => Promise<void>;
  updateProfile:  (data: IUpdateProfileRequest) => Promise<boolean>;
  changePassword: (data: IChangePasswordRequest) => Promise<boolean>;
  uploadAvatar:   (file: File) => Promise<boolean>;
  clearError:     () => void;
}

// ── Store ─────────────────────────────────────────────
export const useUserStore = create<UserState>()((set) => ({
  profile:    storage.getUser<IUserProfile>(),
  isLoading:  false,
  isUpdating: false,
  error:      null,

  fetchProfile: async () => {
    try {
      set({ isLoading: true, error: null });
      const res = await UserApi.getProfile();
      storage.setUser(res.data.user);
      set({ profile: res.data.user, isLoading: false });
    } catch (error) {
      const apiError = handleApiError(error, false);
      set({ isLoading: false, error: apiError });
    }
  },

  updateProfile: async (data) => {
    try {
      set({ isUpdating: true, error: null });
      const res = await UserApi.updateProfile(data);

      // Sync lại storage và auth store
      const updated = res.data.user;
      storage.setUser(updated);
      useAuthStore.getState().initializeAuth();

      set((s) => ({
        profile:    s.profile ? { ...s.profile, ...updated } : null,
        isUpdating: false,
      }));

      toast.success(res.message);
      return true;
    } catch (error) {
      const apiError = handleApiError(error, false);
      set({ isUpdating: false, error: apiError });
      return false;
    }
  },

  changePassword: async (data) => {
    try {
      set({ isUpdating: true, error: null });
      const res = await UserApi.changePassword(data);
      set({ isUpdating: false });
      toast.success(res.message);
      return true;
    } catch (error) {
      const apiError = handleApiError(error, false);
      set({ isUpdating: false, error: apiError });
      return false;
    }
  },

  uploadAvatar: async (file) => {
    try {
      set({ isUpdating: true, error: null });
      const res = await UserApi.uploadAvatar(file);

      // Sync avatar mới vào storage + auth store
      const storedUser = storage.getUser<IUserProfile>();
      if (storedUser) {
        storage.setUser({ ...storedUser, avatar: res.data.avatar });
        useAuthStore.getState().initializeAuth();
      }

      set((s) => ({
        profile:    s.profile ? { ...s.profile, avatar: res.data.avatar } : null,
        isUpdating: false,
      }));

      toast.success(res.message);
      return true;
    } catch (error) {
      const apiError = handleApiError(error, false);
      set({ isUpdating: false, error: apiError });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));

// ── Selectors ─────────────────────────────────────────
export const selectProfile    = (s: UserState) => s.profile;
export const selectIsLoading  = (s: UserState) => s.isLoading;
export const selectIsUpdating = (s: UserState) => s.isUpdating;
export const selectUserError  = (s: UserState) => s.error;
