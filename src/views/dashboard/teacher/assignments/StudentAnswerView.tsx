import { type FC, useEffect, useState } from 'react';
import { ChevronLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import TeacherApi from '@/infra/teacher/teacher_api';
import type { IAssignmentStudentAnswers } from '@/infra/api/interfaces/IAssignment';
import { initials, fmtDt, fmtDuration, scoreColorTen, studentStatusMeta } from './helpers';

interface Props {
  assignmentId: string;
  examTitle:    string;
  studentCode:  string;
  studentName:  string;
  onBack:       () => void;
}

const StudentAnswerView: FC<Props> = ({ assignmentId, examTitle, studentCode, studentName, onBack }) => {
  const [data,    setData]    = useState<IAssignmentStudentAnswers | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed,  setFailed]  = useState(false);

  useEffect(() => {
    setLoading(true);
    setFailed(false);
    TeacherApi.getAssignmentStudentAnswers(assignmentId, studentCode)
      .then(r => setData(r.data))
      .catch(() => { setFailed(true); toast.error('Không thể tải bài làm của học sinh.'); })
      .finally(() => setLoading(false));
  }, [assignmentId, studentCode]);

  return (
    <div className="as-student-wrap">
      <button className="as-back-link" onClick={onBack}>
        <ChevronLeft size={14} /> Bảng điểm · {examTitle}
      </button>

      <div style={{ background: '#fff', border: '1px solid #e7ecf3', borderRadius: 18, padding: '22px 24px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
        <span style={{ width: 52, height: 52, borderRadius: 14, background: '#eff5ff', color: '#2563eb', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {initials(studentName)}
        </span>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 19, fontWeight: 800, color: '#0f172a' }}>{studentName}</div>
          <div style={{ fontSize: 12.5, color: '#94a3b8', fontFamily: 'monospace' }}>{studentCode}</div>
        </div>

        {data && data.questions.length > 0 && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 13, padding: '11px 18px' }}>
              <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1, color: scoreColorTen(data.score) }}>{data.score?.toFixed(1) ?? '—'}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Điểm</div>
            </div>
            <div style={{ textAlign: 'center', background: '#fff', border: '1px solid #eef2f7', borderRadius: 13, padding: '11px 18px' }}>
              <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1, color: '#0f172a' }}>{data.correct_count ?? '—'}/{data.questions.length}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Câu đúng</div>
            </div>
            <div style={{ textAlign: 'center', background: '#fff', border: '1px solid #eef2f7', borderRadius: 13, padding: '11px 18px' }}>
              <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.3, color: '#0f172a', marginTop: 4 }}>{fmtDt(data.submitted_at)}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 5 }}>{fmtDuration(data.duration_seconds)}</div>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <Loader2 size={26} color="#2563eb" style={{ animation: 'as-spin 1s linear infinite', margin: '0 auto 10px', display: 'block' }} />
          <div style={{ fontSize: 13, color: '#94a3b8' }}>Đang tải bài làm...</div>
        </div>
      ) : failed || !data ? (
        <div style={{ padding: '50px 20px', textAlign: 'center', color: '#94a3b8', background: '#fff', border: '1px dashed #d7e0ec', borderRadius: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#475569' }}>Chưa có dữ liệu chi tiết bài làm</div>
          <div style={{ fontSize: 13, marginTop: 5 }}>Tính năng xem chi tiết từng câu trả lời sẽ khả dụng khi backend bổ sung endpoint tương ứng.</div>
        </div>
      ) : data.questions.length === 0 ? (
        <div style={{ padding: '50px 20px', textAlign: 'center', color: '#94a3b8', background: '#fff', border: '1px dashed #d7e0ec', borderRadius: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#475569' }}>Học sinh chưa nộp bài</div>
          <div style={{ fontSize: 13, marginTop: 5 }}>Trạng thái hiện tại: {studentStatusMeta[data.status].label}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {data.questions.map(q => (
            <div key={q.no} className="as-q-card">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, marginBottom: 13 }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: '#0f172a', color: '#fff', fontSize: 12.5, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{q.no}</span>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', lineHeight: 1.5, flex: 1 }}>{q.question}</div>
                <span style={{ fontSize: 12, fontWeight: 700, color: q.is_correct ? '#15803d' : q.is_skipped ? '#94a3b8' : '#dc2626', flexShrink: 0 }}>
                  {q.is_correct ? 'Đúng' : q.is_skipped ? 'Bỏ trống' : ''}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {q.options.map(o => {
                  let bg = '#f8fafc', bd = '#eef2f7', col = '#334155', fw = 500;
                  if (o.is_correct) { bg = '#f0fdf4'; bd = '#bbf7d0'; col = '#166534'; fw = 700; }
                  if (o.is_chosen && !o.is_correct) { bg = '#fef2f2'; bd = '#fecaca'; col = '#b91c1c'; fw = 700; }
                  return (
                    <div key={o.letter} className="as-opt-row" style={{ borderColor: bd, background: bg }}>
                      <span style={{ width: 24, height: 24, borderRadius: 7, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', background: o.is_correct ? '#16a34a' : o.is_chosen ? '#dc2626' : '#94a3b8' }}>
                        {o.letter}
                      </span>
                      <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: fw, color: col, lineHeight: 1.45 }}>{o.text}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: o.is_correct ? '#15803d' : '#dc2626', flexShrink: 0, whiteSpace: 'nowrap' }}>
                        {o.is_correct ? 'Đáp án đúng' : o.is_chosen ? 'HS chọn' : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentAnswerView;
