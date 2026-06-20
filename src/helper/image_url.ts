// Server chứa ảnh — luôn cố định, không phụ thuộc vào môi trường chạy FE
const IMAGE_SERVER =
  (import.meta.env.VITE_IMAGE_SERVER as string | undefined)
  ?? 'https://bedieutrasatlo.girc.edu.vn';

/**
 * Chuẩn hoá URL ảnh về đúng image server.
 * - URL đầy đủ (bất kỳ origin nào): giữ pathname, gắn IMAGE_SERVER
 * - Path tương đối: gắn IMAGE_SERVER vào đầu
 */
export function getImageUrl(url?: string | null): string {
  if (!url) return '';
  try {
    if (/^https?:\/\//i.test(url)) {
      const { pathname } = new URL(url);
      return `${IMAGE_SERVER}${pathname}`;
    }
  } catch {
    // URL malformed — fall through to relative handling
  }
  return `${IMAGE_SERVER}${url.startsWith('/') ? '' : '/'}${url}`;
}
