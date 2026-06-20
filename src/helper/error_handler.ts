import type { AxiosError } from 'axios';
import type { IApiError } from './IError';
import toast from 'react-hot-toast';

// ── Type guard ────────────────────────────────────────
export const isApiError = (value: unknown): value is IApiError =>
  typeof value === 'object' &&
  value !== null &&
  'success' in value &&
  (value as IApiError).success === false;

// ── Core handler ──────────────────────────────────────
const FALLBACK_ERROR: IApiError = {
  success: false,
  message: 'Có lỗi xảy ra, vui lòng thử lại',
  statusCode: 500,
};

/**
 * @param error   - lỗi bắt được từ catch block
 * @param showToast - có hiện toast hay không (default: true)
 */
export const handleApiError = (error: unknown, showToast = true): IApiError => {
  const axiosError = error as AxiosError;

  // Lỗi có response từ server
  if (axiosError?.response) {
    const apiError = axiosError.response.data as IApiError;

    if (showToast) {
      if (apiError.errors && apiError.errors.length > 0) {
        apiError.errors.forEach((err) => toast.error(`${err.field}: ${err.message}`));
      } else {
        toast.error(apiError.message || FALLBACK_ERROR.message);
      }
    }

    return apiError;
  }

  // Lỗi network (không kết nối được server)
  if (axiosError?.request) {
    const networkError: IApiError = {
      success: false,
      message: 'Không thể kết nối đến server. Vui lòng kiểm tra mạng.',
      statusCode: 0,
    };
    if (showToast) toast.error(networkError.message);
    return networkError;
  }

  // Lỗi không xác định
  if (showToast) toast.error(FALLBACK_ERROR.message);
  return FALLBACK_ERROR;
};

// ── UI helpers ────────────────────────────────────────

/** Lấy message tổng hợp để hiển thị trên UI */
export const getErrorMessage = (error: IApiError): string => {
  if (error.errors && error.errors.length > 0) {
    return error.errors.map((e) => e.message).join(', ');
  }
  return error.message;
};

/** Lấy lỗi của một field cụ thể (dùng cho form validation) */
export const getFieldError = (error: IApiError | null, field: string): string | undefined =>
  error?.errors?.find((e) => e.field === field)?.message;
