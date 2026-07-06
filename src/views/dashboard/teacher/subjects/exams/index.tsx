import { type FC, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import toast from 'react-hot-toast';
import ChatApi from '@/infra/chat/chat_api';
import TeacherApi from '@/infra/teacher/teacher_api';
import AssignModal from '@/views/dashboard/teacher/assignments/AssignModal';
import type { ISavedExam } from '@/infra/api/interfaces/IChat';
import type { IAssignmentListItem, IAssignmentDetail } from '@/infra/api/interfaces/IAssignment';
import CSS from './styles';
import ExamListView from './components/ExamListView';
import ExamDetailView from './components/ExamDetailView';
import AssignmentView from './components/AssignmentView';
import ConfirmModal from './components/ConfirmModal';
import type { ExamDetail, ViewMode, ConfirmCfg } from './types';

const TeacherSubjectExams: FC = () => {
  const { maMon }  = useParams<{ maMon: string }>();
  const navigate   = useNavigate();

  const [view,              setView]              = useState<ViewMode>('list');
  const [selectedExamId,    setSelectedExamId]    = useState<string | null>(null);

  const [exams,             setExams]             = useState<ISavedExam[]>([]);
  const [assignments,       setAssignments]       = useState<IAssignmentListItem[]>([]);
  const [loading,           setLoading]           = useState(true);

  const [examDetail,        setExamDetail]        = useState<ExamDetail | null>(null);
  const [loadingDetail,     setLoadingDetail]     = useState(false);

  const [assignmentDetail,  setAssignmentDetail]  = useState<IAssignmentDetail | null>(null);
  const [loadingAssignment, setLoadingAssignment] = useState(false);

  const [assigningExam,     setAssigningExam]     = useState<ISavedExam | null>(null);
  const [openingChat,       setOpeningChat]       = useState(false);
  const [deletingId,        setDeletingId]        = useState<string | null>(null);
  const [confirmCfg,        setConfirmCfg]        = useState<ConfirmCfg | null>(null);

  const tenMon = exams[0]?.ten_mon ?? maMon ?? '';

  const assignByExamId = useMemo(() =>
    assignments.reduce<Record<string, IAssignmentListItem>>((acc, a) => {
      acc[a.exam_mongo_id] = a;
      return acc;
    }, {}),
  [assignments]);

  useEffect(() => {
    if (!maMon) return;
    setLoading(true);
    Promise.all([ChatApi.getExams(maMon), TeacherApi.getAssignments(maMon)])
      .then(([examRes, assignRes]) => {
        setExams(examRes.data ?? []);
        setAssignments(assignRes.data ?? []);
      })
      .catch(() => toast.error('Không thể tải dữ liệu.'))
      .finally(() => setLoading(false));
  }, [maMon]);

  const handleViewExam = (exam: ISavedExam) => {
    setSelectedExamId(exam.id);
    setExamDetail(null);
    setLoadingDetail(true);
    setView('exam');
    ChatApi.getExamDetail(exam.id)
      .then(r => setExamDetail(r.data ?? null))
      .catch(() => toast.error('Không thể tải chi tiết đề.'))
      .finally(() => setLoadingDetail(false));
  };

  const handleViewAssignment = (assignId: string) => {
    const asgn = assignments.find(a => a.id === assignId);
    if (asgn) setSelectedExamId(asgn.exam_mongo_id);
    setAssignmentDetail(null);
    setLoadingAssignment(true);
    setView('assignment');
    TeacherApi.getAssignmentDetail(assignId)
      .then(r => setAssignmentDetail(r.data))
      .catch(() => toast.error('Không thể tải bài giao.'))
      .finally(() => setLoadingAssignment(false));
  };

  const handleDelete = (exam: ISavedExam) => {
    setConfirmCfg({
      title:        'Xóa đề kiểm tra',
      body:         `Xóa "${exam.ten_mon || exam.ma_mon}"? Hành động này không thể hoàn tác.`,
      confirmLabel: 'Xóa đề',
      danger:       true,
      onConfirm:    () => {
        setConfirmCfg(null);
        setDeletingId(exam.id);
        ChatApi.deleteExam(exam.id)
          .then(r => {
            if (r.success) {
              toast.success('Đã xóa đề kiểm tra.');
              setExams(p => p.filter(e => e.id !== exam.id));
            } else toast.error(r.message ?? 'Xóa thất bại.');
          })
          .catch(() => toast.error('Xóa thất bại.'))
          .finally(() => setDeletingId(null));
      },
    });
  };

  const handleOpenChat = () => {
    if (!maMon || openingChat) return;
    setOpeningChat(true);
    ChatApi.createSession(maMon)
      .then(r => navigate(`/teacher/chat/${r.session_id}`))
      .catch(() => toast.error('Không thể mở chatbot. Vui lòng thử lại.'))
      .finally(() => setOpeningChat(false));
  };

  const selectedExam = exams.find(e => e.id === selectedExamId);

  return (
    <div style={{ minHeight: '100%', background: 'linear-gradient(160deg,#eef4ff 0%,#e0eaff 40%,#f0f9ff 100%)', fontFamily: "'Be Vietnam Pro',system-ui,sans-serif" }}>
      <style>{CSS}</style>

      {view === 'list' && (
        <ExamListView
          exams={exams}
          loading={loading}
          assignByExamId={assignByExamId}
          deletingId={deletingId}
          openingChat={openingChat}
          maMon={maMon ?? ''}
          tenMon={tenMon}
          onViewExam={handleViewExam}
          onViewAssignment={handleViewAssignment}
          onAssign={setAssigningExam}
          onDelete={handleDelete}
          onOpenChat={handleOpenChat}
          onBack={() => navigate(-1)}
        />
      )}

      {view === 'exam' && (
        <ExamDetailView
          exam={examDetail}
          loading={loadingDetail}
          onBack={() => setView('list')}
          onAssign={selectedExam ? () => setAssigningExam(selectedExam) : undefined}
        />
      )}

      {view === 'assignment' && (
        <AssignmentView
          detail={assignmentDetail}
          loading={loadingAssignment}
          onBack={() => setView('list')}
          onAssignMore={selectedExam ? () => setAssigningExam(selectedExam) : undefined}
          onUpdated={patch => {
            if (!assignmentDetail) return;
            setAssignments(prev => prev.map(a => a.id === assignmentDetail.id ? { ...a, ...patch } : a));
          }}
        />
      )}

      {assigningExam && (
        <AssignModal
          exam={assigningExam}
          subject={{ ma_mon: maMon ?? '', ten_mon: tenMon }}
          onClose={() => setAssigningExam(null)}
          onSuccess={() => {
            setAssigningExam(null);
            if (maMon) TeacherApi.getAssignments(maMon).then(r => setAssignments(r.data ?? [])).catch(() => {});
          }}
        />
      )}

      {confirmCfg && (
        <ConfirmModal
          title={confirmCfg.title}
          body={confirmCfg.body}
          confirmLabel={confirmCfg.confirmLabel}
          danger={confirmCfg.danger}
          onConfirm={confirmCfg.onConfirm}
          onClose={() => setConfirmCfg(null)}
        />
      )}
    </div>
  );
};

export default TeacherSubjectExams;
