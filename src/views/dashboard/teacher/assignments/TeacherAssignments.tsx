import { type FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, ClipboardList, Users, CheckCircle, Clock, ChevronRight, Loader2, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import TeacherApi from '@/infra/teacher/teacher_api';
import type { IAssignmentListItem } from '@/infra/api/interfaces/IAssignment';

const CSS = `
  @keyframes ta-fade { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ta-spin { to{transform:rotate(360deg)} }
  .ta-card {
    background: white; border-radius: 14px; border: 1px solid rgba(37,99,235,0.09);
    padding: 14px 16px; display: flex; align-items: center; gap: 12px;
    cursor: pointer; transition: box-shadow .18s, transform .18s;
    animation: ta-fade .3s ease both;
  }
  .ta-card:hover { box-shadow: 0 6px 24px rgba(37,99,235,0.1); transform: translateY(-2px); }
`;

const fmtDate = (s?: string | null) => {
  if (!s) return '—';
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(s.replace(' ', 'T')));
};

const statusBadge = (status: string) => {
  if (status === 'published') return { label: 'Đang mở', bg: 'rgba(5,150,105,0.1)', color: '#059669' };
  if (status === 'closed')    return { label: 'Đã đóng', bg: 'rgba(100,116,139,0.1)', color: '#64748b' };
  return { label: status, bg: 'rgba(37,99,235,0.08)', color: '#2563eb' };
};

const TeacherAssignments: FC = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<IAssignmentListItem[]>([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    TeacherApi.getAssignments()
      .then(r => setAssignments(r.data ?? []))
      .catch(() => toast.error('Không thể tải danh sách bài giao.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#f0f4ff 0%,#e8f0fe 50%,#f5f3ff 100%)' }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e3a8a)', padding: '0 20px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 820, margin: '0 auto', height: 56, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/teacher/dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', color: 'white', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
          >
            <ArrowLeft size={13} /> Quay lại
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <ClipboardList size={16} color="#93c5fd" />
              <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'white' }}>Quản lý bài giao</span>
            </div>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
            {assignments.length} bài
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '20px 16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <Loader2 size={28} color="#2563eb" style={{ animation: 'ta-spin 1s linear infinite', margin: '0 auto 10px', display: 'block' }} />
            <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Đang tải...</div>
          </div>
        ) : assignments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(37,99,235,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <ClipboardList size={32} color="#93c5fd" />
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>Chưa có bài giao nào</div>
            <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Vào Bài kiểm tra của môn học để giao đề cho học sinh</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {assignments.map((a, idx) => {
              const badge = statusBadge(a.status);
              const pct = a.student_count > 0 ? Math.round((a.submitted_count / a.student_count) * 100) : 0;
              return (
                <div key={a.id} className="ta-card" style={{ animationDelay: `${idx * 0.04}s` }}
                  onClick={() => navigate(`/teacher/assignments/${a.id}`)}
                >
                  {/* Icon */}
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,rgba(30,58,138,0.1),rgba(37,99,235,0.07))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ClipboardList size={20} color="#1e3a8a" />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</span>
                      <span style={{ flexShrink: 0, fontSize: '0.62rem', fontWeight: 700, borderRadius: 20, padding: '2px 8px', background: badge.bg, color: badge.color }}>{badge.label}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: '#64748b' }}>
                        <BookOpen size={11} /> {a.ma_mon}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: '#64748b' }}>
                        <Users size={11} /> {a.student_count} HS
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: '#059669' }}>
                        <CheckCircle size={11} /> {a.submitted_count}/{a.student_count} đã nộp
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: '#94a3b8' }}>
                        <Clock size={11} /> {fmtDate(a.due_at)}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div style={{ marginTop: 8, height: 4, borderRadius: 4, background: 'rgba(37,99,235,0.08)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg,#1e3a8a,#2563eb)', width: `${pct}%`, transition: 'width .5s ease' }} />
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

export default TeacherAssignments;
