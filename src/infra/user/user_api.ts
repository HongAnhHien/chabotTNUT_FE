import axiosInstance from '@/infra/api/conflig/axiosInstance';
import { API_ENDPOINTS } from '@/infra/api/conflig/apiEndpoints';
import type {
  IGetProfileResponse,
  IUpdateProfileRequest,
  IUpdateProfileResponse,
  IChangePasswordRequest,
  IChangePasswordResponse,
  IUploadAvatarResponse,
  IGetUsersResponse,
  IGetUserByIdResponse,
  IBlockUserRequest,
  IBlockUserResponse,
  IUnblockUserResponse,
} from '@/infra/api/interfaces/IUser';

export interface IGetUsersParams {
  page?: number;
  per_page?: number;
  search?: string;
  role?: string;
  blocked?: boolean;
}

class UserApi {
  async getProfile(): Promise<IGetProfileResponse> {
    const res = await axiosInstance.get<IGetProfileResponse>(API_ENDPOINTS.ME.PROFILE);
    return res.data;
  }

  async updateProfile(data: IUpdateProfileRequest): Promise<IUpdateProfileResponse> {
    const res = await axiosInstance.put<IUpdateProfileResponse>(API_ENDPOINTS.ME.UPDATE_PROFILE, data);
    return res.data;
  }

  async changePassword(data: IChangePasswordRequest): Promise<IChangePasswordResponse> {
    const res = await axiosInstance.patch<IChangePasswordResponse>(API_ENDPOINTS.ME.CHANGE_PASSWORD, data);
    return res.data;
  }

  async uploadAvatar(file: File): Promise<IUploadAvatarResponse> {
    const formData = new FormData();
    formData.append('avatar', file);
    const res = await axiosInstance.post<IUploadAvatarResponse>(API_ENDPOINTS.ME.UPLOAD_AVATAR, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  }

  // ── Admin: User Management ────────────────────────────
  async getUsers(params?: IGetUsersParams): Promise<IGetUsersResponse> {
    const res = await axiosInstance.get<IGetUsersResponse>(API_ENDPOINTS.ADMIN.USERS_LIST, { params });
    return res.data;
  }

  async getUserById(id: string): Promise<IGetUserByIdResponse> {
    const res = await axiosInstance.get<IGetUserByIdResponse>(API_ENDPOINTS.ADMIN.USERS_DETAIL(id));
    return res.data;
  }

  async blockUser(id: string, data?: IBlockUserRequest): Promise<IBlockUserResponse> {
    const res = await axiosInstance.post<IBlockUserResponse>(API_ENDPOINTS.ADMIN.USER_BLOCK(id), data);
    return res.data;
  }

  async unblockUser(id: string): Promise<IUnblockUserResponse> {
    const res = await axiosInstance.post<IUnblockUserResponse>(API_ENDPOINTS.ADMIN.USER_UNBLOCK(id));
    return res.data;
  }
}

export default new UserApi();
