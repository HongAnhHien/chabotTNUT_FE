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

  async getExamStatus(userId: string, maMon: string): Promise<IStudentExamStatusResponse> {
    const res = await axiosInstance.get<IStudentExamStatusResponse>(
      API_ENDPOINTS.STUDENT.EXAM_STATUS(userId, maMon)
    );
    return res.data;
  }

  async getDashboardOverview(semesterFrom?: string): Promise<IDashboardOverviewResponse> {
    const res = await axiosInstance.get<IDashboardOverviewResponse>(
      API_ENDPOINTS.STUDENT.DASHBOARD_OVERVIEW(semesterFrom)
    );
    return res.data;
  }

  async getDashboardSubject(maMon: string): Promise<IDashboardSubjectResponse> {
    const res = await axiosInstance.get<IDashboardSubjectResponse>(
      API_ENDPOINTS.STUDENT.DASHBOARD_SUBJECT(maMon)
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
