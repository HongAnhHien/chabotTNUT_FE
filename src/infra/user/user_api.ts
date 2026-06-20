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
  ICreateUserRequest,
  IUpdateUserRequest,
  IAdminUserMutationResponse,
  IToggleActiveResponse,
  IDeleteUserResponse,
} from '@/infra/api/interfaces/IUser';

export interface IGetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isActive?: string;
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
    const res = await axiosInstance.get<IGetUsersResponse>(API_ENDPOINTS.USERS.LIST, { params });
    return res.data;
  }

  async getUserById(id: string): Promise<IGetUserByIdResponse> {
    const res = await axiosInstance.get<IGetUserByIdResponse>(API_ENDPOINTS.USERS.DETAIL(id));
    return res.data;
  }

  async createUser(data: ICreateUserRequest): Promise<IAdminUserMutationResponse> {
    const res = await axiosInstance.post<IAdminUserMutationResponse>(API_ENDPOINTS.USERS.CREATE, data);
    return res.data;
  }

  async updateUser(id: string, data: IUpdateUserRequest): Promise<IAdminUserMutationResponse> {
    const res = await axiosInstance.put<IAdminUserMutationResponse>(API_ENDPOINTS.USERS.UPDATE(id), data);
    return res.data;
  }

  async toggleActiveUser(id: string): Promise<IToggleActiveResponse> {
    const res = await axiosInstance.patch<IToggleActiveResponse>(API_ENDPOINTS.USERS.TOGGLE_ACTIVE(id));
    return res.data;
  }

  async deleteUser(id: string): Promise<IDeleteUserResponse> {
    const res = await axiosInstance.delete<IDeleteUserResponse>(API_ENDPOINTS.USERS.DELETE(id));
    return res.data;
  }
}

export default new UserApi();
