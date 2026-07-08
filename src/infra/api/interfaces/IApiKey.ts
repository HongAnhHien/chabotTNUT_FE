export interface IApiKeySetting {
  id: string;
  service: string;
  label: string | null;
  api_key: string; // luôn ở dạng che, vd "****4a2b"
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface IApiKeySettingResponse {
  success: boolean;
  data: IApiKeySetting;
}

export interface IUpsertApiKeyRequest {
  api_key: string;
  label?: string;
  notes?: string;
}

export interface IDeleteApiKeyResponse {
  success: boolean;
  message: string;
}

export interface IApiKeyUsageJob {
  id: string;
  status: string;
  tier: string;
  name: string;
  created_at: string;
  error: string | null;
}

export interface IApiKeyUsage {
  key_label: string;
  key_masked: string;
  is_valid: boolean;
  total_jobs: number;
  by_status: Record<string, number>;
  recent_jobs: IApiKeyUsageJob[];
}

export interface IApiKeyUsageResponse {
  success: boolean;
  data: IApiKeyUsage;
}

// ── Reveal key (yêu cầu xác thực lại mật khẩu admin) ──
export interface IRevealApiKeyRequest {
  password: string;
}

export interface IRevealApiKeyResponse {
  success: boolean;
  data: { api_key: string };
}
