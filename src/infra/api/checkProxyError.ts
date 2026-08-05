// TAI-TNUT/CVHT (service ngoài, proxy qua chat_api.ts/advisor_api.ts) trả lỗi phân quyền
// qua HTTP 200 kèm { data: { error: "..." } } thay vì HTTP status code thật — nếu không
// check riêng, response này bị đọc nhầm thành "dữ liệu hợp lệ nhưng rỗng". Dùng class
// riêng (thay vì Error thường) để nơi gọi phân biệt được với lỗi mạng/HTTP khác.
export class ProxyPermissionError extends Error {}

export function checkProxyError(data: unknown): void {
  const err = (data as { error?: string } | null)?.error;
  if (err) throw new ProxyPermissionError(err);
}
