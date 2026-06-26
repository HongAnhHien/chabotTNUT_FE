import { type FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ClipboardList, Clock, CheckCircle, AlertTriangle, ChevronRight, Loader2, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import StudentApi from '@/infra/student/student_api';
import type { IStudentAssignmentListItem } from '@/infra/api/interfaces/IAssignment';

const CSS = `
  @keyframes sa-fade { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes sa-spin { to{transform:rotate(360deg)} }
  .sa-card {
    background: white; border-radius: 14px; border: 1px solid rgba(37,99,235,0.09);
    padding: 14px 16px; display: flex; align-items: center; gap: 12px;
    cursor: pointer; transition: box-shadow .18s, transform .18s;
    animation: sa-fade .3s ease both;
  }
  .sa-card:hover { box-shadow: 0 6px 24px rgba(37,99,235,0.1); transform: translateY(-2px); }
`;

const fmtDt = (s?: string | null) => {
  if (!s) return '—';
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(s.replace(' ', 'T')));
};

const statusInfo = (item: IStudentAssignmentListItem) => {
  if (item.my_status === 'submitted') return { label: 'Đã nộp',  bg: 'rgba(5,150,105,0.1)',   color: '#059669', Icon: CheckCircle };
  if (item.is_overdue)               return { label: 'Quá hạn', bg: 'rgba(220,38,38,0.08)',   color: '#dc2626', Icon: AlertTriangle };
  return                                    { label: 'Chưa làm', bg: 'rgba(245,158,11,0.08)', color: '#d97706', Icon: Clock };
};

const StudentAssignments: FC = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<IStudentAssignmentListItem[]>([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    StudentApi.getAssignments()
      .then(r => setAssignments(r.data ?? []))
      .catch(() => toast.error('Không thể tải danh sách bài kiểm tra.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: '100%', background: 'linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 50%,#f0fdf4 100%)' }}>
      <style>{CSS}</style>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <Loader2 size={28} color="#0369a1" style={{ animation: 'sa-spin 1s linear infinite', margin: '0 auto 10px', display: 'block' }} />
            <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Đang tải...</div>
          </div>
        ) : assignments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(3,105,161,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <ClipboardList size={32} color="#7dd3fc" />
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>Chưa có bài kiểm tra nào</div>
            <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Giáo viên chưa giao bài cho bạn</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {assignments.map((a, idx) => {
              const { label, bg, color, Icon } = statusInfo(a);
              return (
                <div key={a.id} className="sa-card" style={{ animationDelay: `${idx * 0.04}s` }}
                  onClick={() => navigate(`/student/assignments/${a.id}`)}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${bg}`, border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={20} color={color} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</span>
                      <span style={{ flexShrink: 0, fontSize: '0.62rem', fontWeight: 700, borderRadius: 20, padding: '2px 8px', background: bg, color }}>{label}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: '#64748b' }}>
                        <BookOpen size={11} /> {a.ma_mon}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: a.is_overdue ? '#dc2626' : '#64748b' }}>
                        <Clock size={11} /> Hạn: {fmtDt(a.due_at)}
                      </span>
                      {a.my_status === 'submitted' && a.my_score !== null && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>
                          <CheckCircle size={11} /> {a.my_score}/{a.total} điểm
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRight size={16} color="#94a3b8" style={{ flexShrink: 0 }} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAssignments;
