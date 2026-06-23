import axiosInstance from '@/infra/api/conflig/axiosInstance';
import { API_ENDPOINTS } from '@/infra/api/conflig/apiEndpoints';
import type {
  ISemestersResponse,
  ITeacherSemesterCoursesResponse,
  IStudentsResponse,
  ISubjectFilesResponse,
  ISubjectFileResponse,
  ISubjectFileDeleteResponse,
  IFileType,
  IAiFilesResponse,
  IAiFileSendResponse,
  IAiFileDeleteResponse,
  IAiFileResendResponse,
  IAiFileType,
  ISentFilesResponse,
  IFileMarkdownResponse,
  ISubmitFileResponse,
  ISubmitBatchItem,
  ISubmitBatchResponse,
  ICancelSendResponse,
  IResendFilesResponse,
  ISendToApiResponse,
  IFileTreeResponse,
} from '@/infra/api/interfaces/ITeacher';
import type {
  IAssignExamBody,
  IAssignExamResponse,
  IAssignmentsListResponse,
  IAssignmentDetailResponse,
  IPatchAssignmentBody,
  IPatchAssignmentResponse,
  IDeleteAssignmentResponse,
} from '@/infra/api/interfaces/IAssignment';

class TeacherApi {
  async getSemesters(): Promise<ISemestersResponse> {
    const res = await axiosInstance.get<ISemestersResponse>(API_ENDPOINTS.TEACHER.SEMESTERS);
    return res.data;
  }

  async getSemesterCourses(hocKy: number): Promise<ITeacherSemesterCoursesResponse> {
    const res = await axiosInstance.get<ITeacherSemesterCoursesResponse>(
      API_ENDPOINTS.TEACHER.SEMESTER_COURSES(hocKy)
    );
    return res.data;
  }

  async getCourseStudents(idToHoc: string): Promise<IStudentsResponse> {
    const res = await axiosInstance.get<IStudentsResponse>(
      API_ENDPOINTS.TEACHER.COURSE_STUDENTS(idToHoc)
    );
    return res.data;
  }

  async getSubjectFiles(subjectId: string): Promise<ISubjectFilesResponse> {
    const res = await axiosInstance.get<ISubjectFilesResponse>(
      API_ENDPOINTS.TEACHER.SUBJECT_FILES(subjectId)
    );
    return res.data;
  }

  async getSubjectFilesTree(subjectId: string): Promise<IFileTreeResponse> {
    const res = await axiosInstance.get<IFileTreeResponse>(
      API_ENDPOINTS.TEACHER.SUBJECT_FILES_TREE(subjectId)
    );
    return res.data;
  }

  async uploadSubjectFile(
    subjectId: string,
    file: File,
    type: IFileType,
    isPrivate: boolean
  ): Promise<ISubjectFileResponse> {
    const form = new FormData();
    form.append('file', file);
    form.append('type', type);
    form.append('is_private', isPrivate ? '1' : '0');
    const res = await axiosInstance.post<ISubjectFileResponse>(
      API_ENDPOINTS.TEACHER.SUBJECT_FILES(subjectId),
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data;
  }

  async updateSubjectFile(
    subjectId: string,
    fileId: string,
    data: { type: IFileType; is_private: string; original_name: string }
  ): Promise<ISubjectFileResponse> {
    const res = await axiosInstance.patch<ISubjectFileResponse>(
      API_ENDPOINTS.TEACHER.SUBJECT_FILE(subjectId, fileId),
      data
    );
    return res.data;
  }

  async deleteSubjectFile(subjectId: string, fileId: string): Promise<ISubjectFileDeleteResponse> {
    const res = await axiosInstance.delete<ISubjectFileDeleteResponse>(
      API_ENDPOINTS.TEACHER.SUBJECT_FILE(subjectId, fileId)
    );
    return res.data;
  }

  async getAiFiles(subjectId: string): Promise<IAiFilesResponse> {
    const res = await axiosInstance.get<IAiFilesResponse>(
      API_ENDPOINTS.TEACHER.SUBJECT_AI_FILES(subjectId)
    );
    return res.data;
  }

  async sendFileToAi(
    subjectId: string,
    type: IAiFileType,
    payload: { file?: File; fileIds?: string[] }
  ): Promise<IAiFileSendResponse> {
    const form = new FormData();
    form.append('type', type);
    if (payload.file) {
      form.append('file', payload.file);
    }
    if (payload.fileIds && payload.fileIds.length > 0) {
      payload.fileIds.forEach(id => form.append('file_ids[]', id));
    }
    const res = await axiosInstance.post<IAiFileSendResponse>(
      API_ENDPOINTS.TEACHER.SUBJECT_AI_SEND(subjectId),
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data;
  }

  async deleteAiFileLink(subjectId: string, fileId: string): Promise<IAiFileDeleteResponse> {
    const res = await axiosInstance.delete<IAiFileDeleteResponse>(
      API_ENDPOINTS.TEACHER.SUBJECT_AI_FILE_DEL(subjectId, fileId)
    );
    return res.data;
  }

  async resendFileToAi(subjectId: string, fileId: string): Promise<IAiFileResendResponse> {
    const res = await axiosInstance.post<IAiFileResendResponse>(
      API_ENDPOINTS.TEACHER.SUBJECT_AI_RESEND(subjectId, fileId)
    );
    return res.data;
  }

  // ── New file management APIs ───────────────────────────

  async getSentFiles(subjectId: string): Promise<ISentFilesResponse> {
    const res = await axiosInstance.get<ISentFilesResponse>(
      API_ENDPOINTS.TEACHER.SUBJECT_FILES_SENT(subjectId)
    );
    return res.data;
  }

  async getFileMarkdown(subjectId: string, fileId: string): Promise<IFileMarkdownResponse> {
    const res = await axiosInstance.get<IFileMarkdownResponse>(
      API_ENDPOINTS.TEACHER.SUBJECT_FILE_MARKDOWN(subjectId, fileId)
    );
    return res.data;
  }

  async submitFile(subjectId: string, fileId: string, markdown: string): Promise<ISubmitFileResponse> {
    const res = await axiosInstance.post<ISubmitFileResponse>(
      API_ENDPOINTS.TEACHER.SUBJECT_FILE_SUBMIT(subjectId, fileId),
      { markdown },
      { headers: { Accept: 'application/json' } }
    );
    return res.data;
  }

  async submitBatch(subjectId: string, files: ISubmitBatchItem[]): Promise<ISubmitBatchResponse> {
    const res = await axiosInstance.post<ISubmitBatchResponse>(
      API_ENDPOINTS.TEACHER.SUBJECT_FILES_BATCH(subjectId),
      { files },
      { headers: { Accept: 'application/json' } }
    );
    return res.data;
  }

  async sendToApi(subjectId: string, payload: { file?: File; fileIds?: string[]; type?: string }): Promise<ISendToApiResponse> {
    const form = new FormData();
    if (payload.file)    form.append('file', payload.file);
    if (payload.type)    form.append('type', payload.type);
    payload.fileIds?.forEach(id => form.append('file_ids[]', id));
    const res = await axiosInstance.post<ISendToApiResponse>(
      API_ENDPOINTS.TEACHER.SUBJECT_FILE_SEND(subjectId),
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data;
  }

  async cancelSend(fileId: string): Promise<ICancelSendResponse> {
    const res = await axiosInstance.delete<ICancelSendResponse>(
      API_ENDPOINTS.TEACHER.FILE_CANCEL_SEND(fileId)
    );
    return res.data;
  }

  async resendFiles(fileIds: string[]): Promise<IResendFilesResponse> {
    const res = await axiosInstance.post<IResendFilesResponse>(
      API_ENDPOINTS.TEACHER.FILES_RESEND,
      { file_ids: fileIds },
      { headers: { Accept: 'application/json' } }
    );
    return res.data;
  }

  async deleteFileSentLink(subjectId: string, fileId: string): Promise<{ success: boolean; message: string }> {
    const res = await axiosInstance.delete(
      API_ENDPOINTS.TEACHER.SUBJECT_FILE_DEL_SENT(subjectId, fileId)
    );
    return res.data;
  }

  // ── Assignment ────────────────────────────────────────
  async assignExam(examId: string, body: IAssignExamBody): Promise<IAssignExamResponse> {
    const res = await axiosInstance.post<IAssignExamResponse>(
      API_ENDPOINTS.ASSIGNMENT.ASSIGN(examId),
      body
    );
    return res.data;
  }

  async getAssignments(maMon?: string): Promise<IAssignmentsListResponse> {
    const res = await axiosInstance.get<IAssignmentsListResponse>(
      API_ENDPOINTS.ASSIGNMENT.LIST,
      { params: maMon ? { ma_mon: maMon } : undefined }
    );
    return res.data;
  }

  async getAssignmentDetail(id: string): Promise<IAssignmentDetailResponse> {
    const res = await axiosInstance.get<IAssignmentDetailResponse>(
      API_ENDPOINTS.ASSIGNMENT.DETAIL(id)
    );
    return res.data;
  }

  async updateAssignment(id: string, body: IPatchAssignmentBody): Promise<IPatchAssignmentResponse> {
    const res = await axiosInstance.patch<IPatchAssignmentResponse>(
      API_ENDPOINTS.ASSIGNMENT.UPDATE(id),
      body
    );
    return res.data;
  }

  async deleteAssignment(id: string): Promise<IDeleteAssignmentResponse> {
    const res = await axiosInstance.delete<IDeleteAssignmentResponse>(
      API_ENDPOINTS.ASSIGNMENT.DELETE(id)
    );
    return res.data;
  }
}

export default new TeacherApi();
