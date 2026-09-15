// ── Shared ──────────────────────────────────────────
export interface IAuthUser {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin' | 'khoa' | 'truong' | string;
  portal_code?: string;
}

// ── Login ────────────────────────────────────────────
export interface ILoginRequest {
  username: string;
  password: string;
}

// POST /auth/login → { success, data: { access_token, token_type, expires_in, user } }
export interface ILoginResponse {
  success: boolean;
  data: {
    access_token: string;
    token_type: string;
    expires_in: number;
    user: IAuthUser;
  };
}

// ── Register ─────────────────────────────────────────
export interface IRegisterRequest {
  username: string;
  password: string;
  name: string;
  email: string;
}

export interface IRegisterResponse {
  success: boolean;
  data: {
    user: IAuthUser;
  };
}

// ── Refresh Token ─────────────────────────────────────
export interface IRefreshTokenResponse {
  success: boolean;
  data: {
    access_token: string;
    expires_in: number;
  };
}

// ── Logout ────────────────────────────────────────────
export interface ILogoutResponse {
  success: boolean;
}
