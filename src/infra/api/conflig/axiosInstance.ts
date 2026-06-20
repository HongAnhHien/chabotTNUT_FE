// infra/api/conflig/axiosInstance.ts
import axios from "axios";
import type {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";
import { storage, STORAGE_KEYS } from "@/helper/storage";
import toast from "react-hot-toast";

// Base URL from environment or default
const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://chatbotbe.girc.edu.vn/api";

// ✅ Create axios instance with credentials
const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request Interceptor
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get access token from storage (NOT refresh token)
    const token = storage.get<string>(STORAGE_KEYS.TOKEN, "");

    // Add Authorization header if token exists
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request in development
    if (import.meta.env.DEV) {
      console.log("📤 API Request:", {
        method: config.method?.toUpperCase(),
        url: config.url,
        data: config.data,
      });
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// ✅ Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (
  error: AxiosError | null,
  token: string | null = null
) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Response Interceptor
// ✅ Response Interceptor
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    if (import.meta.env.DEV) {
      console.log("📥 API Response:", {
        status: response.status,
        url: response.config.url,
        data: response.data,
      });
    }
    return response;
  },
  async (error: AxiosError<{ message?: string }>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // ============================================
    // 🔒 Handle 401 Unauthorized
    // ============================================
    if (error.response?.status === 401) {
      const errorMessage = error.response.data?.message || "";
      const requestUrl = originalRequest.url || "";

      // ✅ SKIP refresh token cho các endpoints sau:
      const skipRefreshEndpoints = [
        "/auth/login",
        "/auth/register",
        "/auth/refresh",
      ];

      const shouldSkipRefresh = skipRefreshEndpoints.some((endpoint) =>
        requestUrl.includes(endpoint)
      );

      // ✅ SKIP refresh token cho các error messages sau:
      const accountErrorKeywords = [
        "chờ được phê duyệt",
        "chờ phê duyệt",
        "waiting for approval",
        "đã bị từ chối",
        "rejected",
        "đã bị khóa",
        "bị khóa",
        "vô hiệu hóa",
        "deactivated",
        "locked",
        "không đúng",
        "invalid credentials",
        "incorrect",
      ];

      const isAccountError = accountErrorKeywords.some((keyword) =>
        errorMessage.toLowerCase().includes(keyword.toLowerCase())
      );

      // ❌ KHÔNG refresh token nếu:
      // 1. Là login/register/refresh endpoint
      // 2. Là account error (locked, pending, rejected, wrong credentials)
      if (shouldSkipRefresh || isAccountError) {
        console.warn("⚠️ Skip refresh token:", errorMessage);

        // Show appropriate message
        if (errorMessage.includes("chờ được phê duyệt")) {
          toast.error("Tài khoản của bạn đang chờ admin phê duyệt");
        } else if (errorMessage.includes("đã bị từ chối")) {
          toast.error(errorMessage);
        } else if (
          errorMessage.includes("đã bị khóa") ||
          errorMessage.includes("vô hiệu hóa")
        ) {
          toast.error("Tài khoản của bạn đã bị khóa");
        } else if (errorMessage.includes("không đúng")) {
          toast.error("Email hoặc mật khẩu không đúng");
        } else {
          toast.error(errorMessage);
        }

        // Clear auth only if account is locked/rejected/deactivated
        if (
          errorMessage.includes("khóa") ||
          errorMessage.includes("từ chối") ||
          errorMessage.includes("vô hiệu hóa")
        ) {
          clearAuthData();
        }

        return Promise.reject(error);
      }

      // ✅ Chỉ refresh token khi token thực sự hết hạn
      if (!originalRequest._retry) {
        // If already refreshing, queue this request
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              return axiosInstance(originalRequest);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          console.log("🔄 Attempting to refresh access token...");

          const response = await axios.post(
            `${BASE_URL}/auth/refresh`,
            {}
          );

          const { access_token } = response.data.data;

          storage.set(STORAGE_KEYS.TOKEN, access_token);

          // Update authorization header
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
          }

          // Process queued requests
          processQueue(null, access_token);

          console.log("✅ Token refreshed successfully");

          // Retry original request
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          console.error("❌ Token refresh failed:", refreshError);

          // Process queued requests with error
          processQueue(refreshError as AxiosError, null);

          // Clear auth and redirect
          toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
          clearAuthAndRedirect("/login");

          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }
    }

    // ============================================
    // 🚫 Handle 403 Forbidden
    // ============================================
    if (error.response?.status === 403) {
      toast.error("Bạn không có quyền truy cập tài nguyên này");
      return Promise.reject(error);
    }

    // ============================================
    // 🔍 Handle 404 Not Found
    // ============================================
    if (error.response?.status === 404) {
      const message =
        error.response.data?.message || "Không tìm thấy tài nguyên";
      toast.error(message);
      return Promise.reject(error);
    }

    // ============================================
    // ⚠️ Handle 409 Conflict
    // ============================================
    if (error.response?.status === 409) {
      const message = error.response.data?.message || "Dữ liệu đã tồn tại";
      toast.error(message);
      return Promise.reject(error);
    }

    // ============================================
    // 💥 Handle 500 Server Error
    // ============================================
    if (error.response?.status === 500) {
      console.error("💥 Server Error:", error.response.data);
      toast.error("Lỗi server. Vui lòng thử lại sau.");
      return Promise.reject(error);
    }

    // ============================================
    // 🌐 Handle Network Error
    // ============================================
    if (!error.response) {
      toast.error(
        "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng."
      );
      return Promise.reject(error);
    }

  
    return Promise.reject(error);
  }
);

// ✅ Helper: Clear auth data only
function clearAuthData() {
  storage.clearAuth();
}

// ✅ Helper: Clear auth and redirect
function clearAuthAndRedirect(redirectPath: string = "/login") {
  clearAuthData();

  setTimeout(() => {
    window.location.href = redirectPath;
  }, 1000);
}

export default axiosInstance;