import axiosInstance from '@/infra/api/conflig/axiosInstance';
import { API_ENDPOINTS } from '@/infra/api/conflig/apiEndpoints';
import type { ILoTrinhTeacherResponse, ILoTrinhStudentResponse, ILoTrinhMutationResponse } from '@/infra/api/interfaces/ILoTrinh';

/** Lộ trình đề kiểm tra theo môn — GV dựng chặng, SV xem tiến độ khoá/mở. */
class LoTrinhApi {
  // GV
  async getTeacher(maMon: string): Promise<ILoTrinhTeacherResponse> {
    const res = await axiosInstance.get<ILoTrinhTeacherResponse>(API_ENDPOINTS.TEACHER.LO_TRINH, { params: { ma_mon: maMon } });
    return res.data;
  }
  async create(body: Record<string, unknown>): Promise<ILoTrinhMutationResponse> {
    const res = await axiosInstance.post<ILoTrinhMutationResponse>(API_ENDPOINTS.TEACHER.LO_TRINH, body);
    return res.data;
  }
  async update(id: string, body: Record<string, unknown>): Promise<ILoTrinhMutationResponse> {
    const res = await axiosInstance.patch<ILoTrinhMutationResponse>(API_ENDPOINTS.TEACHER.LO_TRINH_ITEM(id), body);
    return res.data;
  }
  async remove(id: string): Promise<ILoTrinhMutationResponse> {
    const res = await axiosInstance.delete<ILoTrinhMutationResponse>(API_ENDPOINTS.TEACHER.LO_TRINH_ITEM(id));
    return res.data;
  }
  async reorder(maMon: string, ids: string[]): Promise<ILoTrinhMutationResponse> {
    const res = await axiosInstance.post<ILoTrinhMutationResponse>(API_ENDPOINTS.TEACHER.LO_TRINH_REORDER, { ma_mon: maMon, ids });
    return res.data;
  }
  // SV
  async getStudent(maMon: string): Promise<ILoTrinhStudentResponse> {
    const res = await axiosInstance.get<ILoTrinhStudentResponse>(API_ENDPOINTS.STUDENT.LO_TRINH, { params: { ma_mon: maMon } });
    return res.data;
  }
}

export default new LoTrinhApi();
