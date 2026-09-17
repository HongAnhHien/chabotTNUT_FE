import axiosInstance from '@/infra/api/conflig/axiosInstance';
import { API_ENDPOINTS } from '@/infra/api/conflig/apiEndpoints';
import type {
  IStudentAssignmentsResponse,
  IStudentAssignmentDetailResponse,
  ISubmitBody,
  ISubmitResponse,
  IStartAssignmentResponse,
} from '@/infra/api/interfaces/IAssignment';
import type {
  IStudentSubjectsResponse,
  IStudentSemestersResponse,
  IStudentSemesterSubjectsResponse,
  IStudentExamStatusResponse,
} from '@/infra/api/interfaces/IStudent';
import type {
  IDashboardOverviewResponse,
  IDashboardSubjectResponse,
} from '@/infra/api/interfaces/IDashboard';
import type {
  INotificationsQuery,
  INotificationsResponse,
  IMarkNotificationReadResponse,
  IMarkAllNotificationsReadResponse,
} from '@/infra/api/interfaces/INotification';

export type MasteryStatus = 'thanh_thao' | 'dang_hoc' | 'can_on' | 'chua_hoc';
export interface ISubjectMastery {
  ma_mon: string;
  mastery: number | null;   // null = chưa có bài kiểm tra (không bịa %)
  so_quiz: number;
  diem_tb_quiz: number | null;
  so_cau_hoi: number;
  trang_thai: MasteryStatus;
}
export interface ISubjectMasteryResponse {
  success: boolean;
  data: Record<string, ISubjectMastery>;
}

export interface IStudyStats {
  streak: number;
  today_count: number;
  week: {
    bai_da_hoc: number;
    do_chinh_xac: number | null;   // % · null nếu chưa có quiz tuần này
    thoi_gian_giay: number;         // giây (từ thời gian làm quiz)
    so_voi_tuan_truoc: number;      // %
    bars: { d: string; v: number }[];
  };
}
export interface IStudyStatsResponse { success: boolean; data: IStudyStats; }

class StudentApi {
  async getAssignments(): Promise<IStudentAssignmentsResponse> {
    const res = await axiosInstance.get<IStudentAssignmentsResponse>(
      API_ENDPOINTS.STUDENT_ASSIGNMENT.LIST
    );
    return res.data;
  }

  async getAssignmentDetail(id: string): Promise<IStudentAssignmentDetailResponse> {
    const res = await axiosInstance.get<IStudentAssignmentDetailResponse>(
      API_ENDPOINTS.STUDENT_ASSIGNMENT.DETAIL(id)
    );
    return res.data;
  }

  async startAssignment(id: string): Promise<IStartAssignmentResponse> {
    const res = await axiosInstance.post<IStartAssignmentResponse>(
      API_ENDPOINTS.STUDENT_ASSIGNMENT.START(id)
    );
    return res.data;
  }

  async submitAssignment(id: string, body: ISubmitBody): Promise<ISubmitResponse> {
    const res = await axiosInstance.post<ISubmitResponse>(
      API_ENDPOINTS.STUDENT_ASSIGNMENT.SUBMIT(id),
      body
    );
    return res.data;
  }

  async getSubjects(): Promise<IStudentSubjectsResponse> {
    const res = await axiosInstance.get<IStudentSubjectsResponse>(API_ENDPOINTS.STUDENT.SUBJECTS);
    return res.data;
  }

  async getSemesters(): Promise<IStudentSemestersResponse> {
    const res = await axiosInstance.get<IStudentSemestersResponse>(API_ENDPOINTS.STUDENT.SEMESTERS);
    return res.data;
  }

  async getSubjectsBySemester(hocKy: number): Promise<IStudentSemesterSubjectsResponse> {
    const res = await axiosInstance.get<IStudentSemesterSubjectsResponse>(
      API_ENDPOINTS.STUDENT.SEMESTER_SUBJECTS(hocKy)
    );
    return res.data;
  }

  async getSubjectMastery(): Promise<ISubjectMasteryResponse> {
    const res = await axiosInstance.get<ISubjectMasteryResponse>(API_ENDPOINTS.STUDENT.MASTERY);
    return res.data;
  }

  async getStudyStats(): Promise<IStudyStatsResponse> {
    const res = await axiosInstance.get<IStudyStatsResponse>(API_ENDPOINTS.STUDENT.STUDY_STATS);
    return res.data;
  }

  async getExamStatus(userId: string, maMon: string): Promise<IStudentExamStatusResponse> {
    const res = await axiosInstance.get<IStudentExamStatusResponse>(
      API_ENDPOINTS.STUDENT.EXAM_STATUS(userId, maMon)
    );
    return res.data;
  }

  async getDashboardOverview(semesterFrom?: string, hocKy?: number): Promise<IDashboardOverviewResponse> {
    const res = await axiosInstance.get<IDashboardOverviewResponse>(
      API_ENDPOINTS.STUDENT.DASHBOARD_OVERVIEW(semesterFrom, hocKy)
    );
    return res.data;
  }

  async getDashboardSubject(maMon: string, hocKy?: number): Promise<IDashboardSubjectResponse> {
    const res = await axiosInstance.get<IDashboardSubjectResponse>(
      API_ENDPOINTS.STUDENT.DASHBOARD_SUBJECT(maMon, hocKy)
    );
    return res.data;
  }

  // ── Notifications ─────────────────────────────────────
  async getNotifications(query?: INotificationsQuery): Promise<INotificationsResponse> {
    const res = await axiosInstance.get<INotificationsResponse>(
      API_ENDPOINTS.STUDENT.NOTIFICATIONS,
      { params: query }
    );
    return res.data;
  }

  async markNotificationRead(id: string): Promise<IMarkNotificationReadResponse> {
    const res = await axiosInstance.post<IMarkNotificationReadResponse>(
      API_ENDPOINTS.STUDENT.NOTIFICATION_READ(id)
    );
    return res.data;
  }

  async markAllNotificationsRead(): Promise<IMarkAllNotificationsReadResponse> {
    const res = await axiosInstance.post<IMarkAllNotificationsReadResponse>(
      API_ENDPOINTS.STUDENT.NOTIFICATIONS_READ_ALL
    );
    return res.data;
  }

  async downloadFile(fileId: string): Promise<{ blob: Blob; filename: string }> {
    const res = await axiosInstance.get(API_ENDPOINTS.FILES.DOWNLOAD(fileId), {
      responseType: 'blob',
    });
    const cd  = res.headers['content-disposition'] as string | undefined;
    const match = cd?.match(/filename\*?=(?:UTF-8''|"?)([^";\n]+)/i);
    const filename = match ? decodeURIComponent(match[1].replace(/"/g, '')) : fileId;
    return { blob: res.data as Blob, filename };
  }
}

export default new StudentApi();
