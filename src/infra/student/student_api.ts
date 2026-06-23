import axiosInstance from '@/infra/api/conflig/axiosInstance';
import { API_ENDPOINTS } from '@/infra/api/conflig/apiEndpoints';
import type {
  IStudentAssignmentsResponse,
  IStudentAssignmentDetailResponse,
  ISubmitBody,
  ISubmitResponse,
} from '@/infra/api/interfaces/IAssignment';
import type {
  IStudentSubjectsResponse,
  IStudentSemestersResponse,
  IStudentSemesterSubjectsResponse,
} from '@/infra/api/interfaces/IStudent';

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
}

export default new StudentApi();
