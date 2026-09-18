import axiosInstance from '@/infra/api/conflig/axiosInstance';
import { API_ENDPOINTS } from '@/infra/api/conflig/apiEndpoints';

export interface IImpactReport {
  generated_at: string;
  users: { total: number; students: number; teachers: number };
  structure: { subjects: number; bo_mon: number; khoa: number; materials: number; materials_ragged: number };
  ai: {
    questions_total: number;
    questions_week: number;
    questions_student_week: number;
    questions_teacher_week: number;
    by_day: { label: string; count: number }[];
    by_month: { label: string; count: number }[];
  };
  activity_by_subject: { subject_id: string; name: string; count: number }[];
  quiz: {
    submissions: number;
    avg_score_pct: number | null;
    pass_rate: number | null;
    improvement_pct: number | null;
  };
  estimate: { minutes_per_question: number; hours_saved_week: number; hours_saved_month: number; note: string };
  satisfaction: number | null;
}

class ImpactApi {
  /** Báo cáo hiệu quả nền tảng (cán bộ: teacher/khoa/truong/admin). */
  async getHieuQua(): Promise<IImpactReport> {
    const res = await axiosInstance.get<{ success: boolean; data: IImpactReport }>(
      API_ENDPOINTS.DANH_GIA.HIEU_QUA,
    );
    return res.data.data;
  }
}

export default new ImpactApi();
