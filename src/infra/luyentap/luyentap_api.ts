import axiosInstance from '@/infra/api/conflig/axiosInstance';
import { API_ENDPOINTS } from '@/infra/api/conflig/apiEndpoints';
import type {
  IBangDiem, IBangDiemLop, ILuyenTapNhacResponse, ILuyenTapStudentResponse, ILuyenTapTeacherResponse, CotDiem,
} from '@/infra/api/interfaces/ILuyenTap';

/** Luyện tập hằng tuần theo buổi (SV) + lịch buổi & bảng điểm tổng hợp (GV). */
class LuyenTapApi {
  // SV
  async getStudent(maMon: string): Promise<ILuyenTapStudentResponse> {
    const res = await axiosInstance.get<ILuyenTapStudentResponse>(API_ENDPOINTS.STUDENT.LUYEN_TAP, { params: { ma_mon: maMon } });
    return res.data;
  }
  async getNhac(maMon: string): Promise<ILuyenTapNhacResponse> {
    const res = await axiosInstance.get<ILuyenTapNhacResponse>(API_ENDPOINTS.STUDENT.LUYEN_TAP_NHAC, { params: { ma_mon: maMon } });
    return res.data;
  }
  /** Bắt đầu (hoặc tiếp tục) một lượt → id bài để mở trang làm bài. */
  async batDau(buoiId: string): Promise<string> {
    const res = await axiosInstance.post<{ success: boolean; data: { assignment_id: string } }>(API_ENDPOINTS.STUDENT.LUYEN_TAP_BAT_DAU(buoiId));
    return res.data.data.assignment_id;
  }

  // GV
  async getTeacher(maMon: string): Promise<ILuyenTapTeacherResponse> {
    const res = await axiosInstance.get<ILuyenTapTeacherResponse>(API_ENDPOINTS.TEACHER.LUYEN_TAP, { params: { ma_mon: maMon } });
    return res.data;
  }
  async updateBuoi(id: string, body: Record<string, unknown>): Promise<void> {
    await axiosInstance.patch(API_ENDPOINTS.TEACHER.LUYEN_TAP_ITEM(id), body);
  }
  async getLop(maMon: string): Promise<IBangDiemLop[]> {
    const res = await axiosInstance.get<{ data: IBangDiemLop[] }>(API_ENDPOINTS.TEACHER.BANG_DIEM_LOP, { params: { ma_mon: maMon } });
    return res.data.data ?? [];
  }
  async getBangDiem(maMon: string, idToHoc: string): Promise<IBangDiem> {
    const res = await axiosInstance.get<{ data: IBangDiem }>(API_ENDPOINTS.TEACHER.BANG_DIEM, { params: { ma_mon: maMon, id_to_hoc: idToHoc } });
    return res.data.data;
  }
  async luuSinhVien(body: { ma_mon: string; id_to_hoc: string; ma_sv: string } & Record<string, unknown>): Promise<void> {
    await axiosInstance.patch(API_ENDPOINTS.TEACHER.BANG_DIEM_SV, body);
  }
  async chot(body: { ma_mon: string; id_to_hoc: string; ma_svs?: string[]; bo_chot?: boolean }): Promise<string> {
    const res = await axiosInstance.post<{ message: string }>(API_ENDPOINTS.TEACHER.BANG_DIEM_CHOT, body);
    return res.data.message;
  }
  async luuTrongSo(maMon: string, trongSo: Record<CotDiem, number>): Promise<void> {
    await axiosInstance.patch(API_ENDPOINTS.TEACHER.BANG_DIEM_CAU_HINH, { ma_mon: maMon, trong_so: trongSo });
  }
  async xuat(maMon: string, idToHoc: string): Promise<{ blob: Blob; filename: string }> {
    const res = await axiosInstance.get(API_ENDPOINTS.TEACHER.BANG_DIEM_XUAT, { params: { ma_mon: maMon, id_to_hoc: idToHoc }, responseType: 'blob' });
    const disposition = res.headers['content-disposition'] as string | undefined;
    const match = disposition?.match(/filename="?([^";]+)"?/);
    return { blob: res.data, filename: match?.[1] ?? `bang-diem-${maMon}.xlsx` };
  }
}

export default new LuyenTapApi();
