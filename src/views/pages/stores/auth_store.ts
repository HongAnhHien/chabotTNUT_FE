import { create } from 'zustand';
import type { ILoginRequest, IRegisterRequest } from '@/infra/api/interfaces/IAuth';
import type { IUser } from '@/infra/api/interfaces/IUser';
import type { IApiError } from '@/helper/IError';
import AuthRepository from '@/infra/AuthRepository';
import { storage } from '@/helper/storage';
import { handleApiError } from '@/helper/error_handler';
import toast from 'react-hot-toast';

// ── Token refresh scheduler ───────────────────────────
let _refreshTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleTokenRefresh(expiresInSeconds: number) {
  if (_refreshTimer) clearTimeout(_refreshTimer);

  // Refresh 90s trước khi hết hạn, tối thiểu 5s
  const delayMs = Math.max((expiresInSeconds - 90) * 1000, 5_000);

  if (import.meta.env.DEV) {
    console.log(`🔄 Token refresh scheduled in ${Math.round(delayMs / 1000)}s`);
  }

  _refreshTimer = setTimeout(async () => {
    try {
      const res = await AuthRepository.refreshToken();
      const { access_token, expires_in } = res.data;

      storage.setToken(access_token);
      storage.setTokenExpiresAt(Date.now() + expires_in * 1000);

      // Lên lịch refresh tiếp theo
      scheduleTokenRefresh(expires_in);

      if (import.meta.env.DEV) {
        console.log(`✅ Token auto-refreshed, next in ${expires_in - 90}s`);
      }
    } catch {
      // Refresh thất bại → force logout
      cancelTokenRefresh();
      storage.clearAuth();
      useAuthStore.setState({ user: null, isAuthenticated: false, error: null });
      toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', { duration: 5000 });
      setTimeout(() => { window.location.href = '/'; }, 1800);
    }
  }, delayMs);
}

function cancelTokenRefresh() {
  if (_refreshTimer) {
    clearTimeout(_refreshTimer);
    _refreshTimer = null;
  }
}

// ── State & Actions ───────────────────────────────────
interface AuthState {
  user:            IUser | null;
  isAuthenticated: boolean;
  isLoading:       boolean;
  isInitialized:   boolean;
  error:           IApiError | null;

  initializeAuth: () => void;
  login:          (credentials: ILoginRequest) => Promise<boolean>;
  register:       (data: IRegisterRequest) => Promise<boolean>;
  logout:         () => Promise<void>;
  clearError:     () => void;
}

// ── Store ─────────────────────────────────────────────
export const useAuthStore = create<AuthState>()((set) => ({
  user:            null,
  isAuthenticated: false,
  isLoading:       false,
  isInitialized:   false,
  error:           null,

  // Khởi tạo auth khi app mount — kiểm tra token còn hạn không
  initializeAuth: () => {
    const token     = storage.getToken();
    const user      = storage.getUser<IUser>();
    const expiresAt = storage.getTokenExpiresAt();

    if (token && user) {
      const now = Date.now();

      // Token đã hết hạn
      if (expiresAt && expiresAt <= now) {
        storage.clearAuth();
        set({ isInitialized: true });
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return;
      }

      set({ user, isAuthenticated: true, isInitialized: true });

      // Lên lịch refresh với thời gian còn lại
      if (expiresAt) {
        const remainingSeconds = Math.floor((expiresAt - now) / 1000);
        scheduleTokenRefresh(remainingSeconds);
      }
    } else {
      storage.clearAuth();
      set({ isInitialized: true });
    }
  },

  // Đăng nhập — lưu token + expiry + schedule refresh
  login: async (credentials) => {
    try {
      set({ isLoading: true, error: null });

      const res = await AuthRepository.login(credentials);

      storage.setToken(res.data.access_token);
      storage.setUser(res.data.user);
      storage.setTokenExpiresAt(Date.now() + res.data.expires_in * 1000);

      scheduleTokenRefresh(res.data.expires_in);

      set({
        user:            res.data.user,
        isAuthenticated: true,
        isLoading:       false,
        error:           null,
      });

      toast.success('Đăng nhập thành công!');
      return true;
    } catch (error) {
      const apiError = handleApiError(error, false);
      set({ isLoading: false, error: apiError, isAuthenticated: false });
      return false;
    }
  },

  // Đăng ký
  register: async (data) => {
    try {
      set({ isLoading: true, error: null });
      await AuthRepository.register(data);
      set({ isLoading: false, error: null });
      toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
      return true;
    } catch (error) {
      const apiError = handleApiError(error, false);
      set({ isLoading: false, error: apiError });
      return false;
    }
  },

  // Đăng xuất — huỷ timer trước, rồi xóa state
  logout: async () => {
    cancelTokenRefresh();
    try {
      await AuthRepository.logout();
    } catch {
      // Bỏ qua lỗi server, vẫn xóa local state
    } finally {
      storage.clearAuth();
      set({ user: null, isAuthenticated: false, error: null });
    }
  },

  clearError: () => set({ error: null }),
}));

// ── Selectors ─────────────────────────────────────────
export const selectUser            = (s: AuthState) => s.user;
export const selectIsAuthenticated = (s: AuthState) => s.isAuthenticated;
export const selectIsLoading       = (s: AuthState) => s.isLoading;
export const selectAuthError       = (s: AuthState) => s.error;
export const selectIsAdmin         = (s: AuthState) => s.user?.role === 'admin';
