import axiosInstance from "@/infra/api/conflig/axiosInstance";
import { API_ENDPOINTS } from "@/infra/api/conflig/apiEndpoints";
import type { ILoginRequest, ILoginResponse, IRegisterRequest, IRegisterResponse, IRefreshTokenResponse, ILogoutResponse } from "@/infra/api/interfaces/IAuth";
import type { IUserMeResponse } from "@/infra/api/interfaces/IUser";

/**
 * Authentication Repository
 * Handles all authentication-related API calls
 */
class AuthRepository {
  /**
   * Login user
   */
  async login(credentials: ILoginRequest): Promise<ILoginResponse> {
    const response = await axiosInstance.post<ILoginResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials
    );
    return response.data;
  }

  async register(data: IRegisterRequest): Promise<IRegisterResponse> {
    const response = await axiosInstance.post<IRegisterResponse>(
      API_ENDPOINTS.AUTH.REGISTER,
      data
    );
    return response.data;
  }

  async refreshToken(): Promise<IRefreshTokenResponse> {
    const response = await axiosInstance.post<IRefreshTokenResponse>(
      API_ENDPOINTS.AUTH.REFRESH
    );
    return response.data;
  }

  async logout(): Promise<ILogoutResponse> {
    const response = await axiosInstance.post<ILogoutResponse>(
      API_ENDPOINTS.AUTH.LOGOUT
    );
    return response.data;
  }

  async getMe(): Promise<IUserMeResponse> {
    const response = await axiosInstance.get<IUserMeResponse>(
      API_ENDPOINTS.AUTH.ME
    );
    return response.data;
  }
}

// Export singleton instance
export default new AuthRepository();