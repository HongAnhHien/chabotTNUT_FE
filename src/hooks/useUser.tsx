import { useEffect } from 'react';
import { useUserStore } from '@/views/pages/stores/user_store';
import { useAuthStore } from '@/views/pages/stores/auth_store';
import type { IUpdateProfileRequest, IChangePasswordRequest } from '@/infra/api/interfaces/IUser';

const SERVER_ORIGIN = (import.meta.env.VITE_API_BASE_URL as string | undefined)
  ?.replace('/api', '') ?? 'https://bedieutrasatlo.girc.edu.vn';

export const getAvatarUrl = (avatar?: string): string => {
  if (!avatar) return '';
  if (avatar.startsWith('http')) return avatar;
  return `${SERVER_ORIGIN}${avatar}`;
};

/**
 * Hook tiện ích cho profile.
 * - Tự fetch profile khi chưa có data
 * - Expose các actions: updateProfile, changePassword, uploadAvatar
 */
export const useUser = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const {
    profile,
    isLoading,
    isUpdating,
    error,
    fetchProfile,
    updateProfile,
    changePassword,
    uploadAvatar,
    clearError,
  } = useUserStore();

  // Fetch profile tự động khi đã auth và chưa có data
  useEffect(() => {
    if (isAuthenticated && !profile) {
      fetchProfile();
    }
  }, [isAuthenticated, profile, fetchProfile]);

  return {
    profile,
    avatarUrl:      getAvatarUrl(profile?.avatar),
    isLoading,
    isUpdating,
    error,
    fetchProfile,
    updateProfile:  (data: IUpdateProfileRequest) => updateProfile(data),
    changePassword: (data: IChangePasswordRequest) => changePassword(data),
    uploadAvatar:   (file: File) => uploadAvatar(file),
    clearError,
  };
};
