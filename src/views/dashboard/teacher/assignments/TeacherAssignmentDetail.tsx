import { type FC, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft, Loader2, Users, CheckCircle, Clock, AlertCircle,
  Trash2, XCircle, BookOpen, User,
} from 'lucide-react';
import toast from 'react-hot-toast';
import TeacherApi from '@/infra/teacher/teacher_api';
import type { IAssignmentDetail, IAssignmentStudentItem } from '@/infra/api/interfaces/IAssignment';

const CSS = `
  @keyframes tad-fade { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes tad-spin { to{transform:rotate(360deg)} }
  .tad-row { display:flex; align-items:center; gap:12px; padding:11px 14px; border-radius:11px; border:1px solid rgba(37,99,235,0.07); background:white; animation:tad-fade .3s ease both; }
  .tad-stat { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:16px 12px; border-radius:14px; flex:1; }
`;

const fmtDt = (s?: string | null) => {
  if (!s) return '—';
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(s.replace(' ', 'T')));
};

const studentStatusBadge = (status: IAssignmentStudentItem['status']) => {
  if (status === 'submitted')   return { label: 'Đã nộp',    bg: 'rgba(5,150,105,0.1)',  color: '#059669' };
  if (status === 'in_progress') return { label: 'Đang làm',  bg: 'rgba(37,99,235,0.08)', color: '#2563eb' };
  return                               { label: 'Chưa làm',  bg: 'rgba(100,116,139,0.08)', color: '#64748b' };
};

const TeacherAssignmentDetail: FC = () => {
  const { id }                  = useParams<{ id: string }>();
  const navigate                = useNavigate();
  const [detail,    setDetail]  = useState<IAssignmentDetail | null>(null);
  const [loading,   setLoading] = useState(true);
  const [closing,   setClosing] = useState(false);
  const [deleting,  setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    TeacherApi.getAssignmentDetail(id)
      .then(r => setDetail(r.data))
      .catch(() => toast.error('Không thể tải chi tiết bài giao.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleClose = async () => {
    if (!id || !detail) return;
    if (!confirm('Đóng bài giao? Học sinh sẽ không thể nộp thêm.')) return;
    setClosing(true);
    try {
      const r = await TeacherApi.updateAssignment(id, { status: 'closed' });
      if (r.success) {
        toast.success('Đã đóng bài giao.');
        setDetail(prev => prev ? { ...prev, status: 'closed' } : prev);
      } else {
        toast.error(r.message ?? 'Thất bại.');
      }
    } catch {
      toast.error('Thất bại. Vui lòng thử lại.');
    } finally {
      setClosing(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm('Xóa bài giao và toàn bộ bài nộp của học sinh?')) return;
    setDeleting(true);
    try {
      const r = await TeacherApi.deleteAssignment(id);
      if (r.success) {
        toast.success('Đã xóa bài giao.');
        navigate('/teacher/assignments');
      } else {
        toast.error(r.message ?? 'Xóa thất bại.');
      }
    } catch {
      toast.error('Xóa thất bại. Vui lòng thử lại.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#f0f4ff 0%,#e8f0fe 50%,#f5f3ff 100%)' }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e3a8a)', padding: '0 20px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', height: 56, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/teacher/assignments')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', color: 'white', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
          >
            <ArrowLeft size={13} /> Quay lại
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {detail?.title ?? 'Chi tiết bài giao'}
            </div>
            {detail && (
              <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.55)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <BookOpen size={10} /> {detail.ma_mon}
                <span>·</span>
                <span style={{ color: detail.status === 'published' ? '#4ade80' : '#94a3b8' }}>
                  {detail.status === 'published' ? 'Đang mở' : 'Đã đóng'}
                </span>
              </div>
            )}
          </div>
          {detail && detail.status === 'published' && (
            <button onClick={handleClose} disabled={closing}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.35)', color: '#fbbf24', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
            >
              {closing ? <Loader2 size={12} style={{ animation: 'tad-spin 1s linear infinite' }} /> : <XCircle size={12} />}
              Đóng bài
            </button>
          )}
          <button onClick={handleDelete} disabled={deleting}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'rgba(220,38,38,0.18)', border: '1px solid rgba(220,38,38,0.3)', color: '#fca5a5', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
          >
            {deleting ? <Loader2 size={12} style={{ animation: 'tad-spin 1s linear infinite' }} /> : <Trash2 size={12} />}
            Xóa
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem' }}>
          <Loader2 size={28} color="#2563eb" style={{ animation: 'tad-spin 1s linear infinite', margin: '0 auto 10px', display: 'block' }} />
          <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Đang tải...</div>
        </div>
      ) : !detail ? (
        <div style={{ textAlign: 'center', padding: '5rem', color: '#94a3b8' }}>Không tìm thấy bài giao.</div>
      ) : (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
            {[
              { label: 'Tổng HS',    value: detail.stats.total,       icon: Users,        bg: 'rgba(30,58,138,0.06)',  color: '#1e3a8a' },
              { label: 'Đã nộp',     value: detail.stats.submitted,   icon: CheckCircle,  bg: 'rgba(5,150,105,0.07)',  color: '#059669' },
              { label: 'Đang làm',   value: detail.stats.in_progress, icon: Clock,        bg: 'rgba(37,99,235,0.07)',  color: '#2563eb' },
              { label: 'Chưa làm',   value: detail.stats.not_started, icon: AlertCircle,  bg: 'rgba(100,116,139,0.07)',color: '#64748b' },
            ].map(({ label, value, icon: Icon, bg, color }) => (
              <div key={label} className="tad-stat" style={{ background: bg, border: `1px solid ${color}22` }}>
                <Icon size={20} color={color} style={{ marginBottom: 6 }} />
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600, marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Info card */}
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid rgba(37,99,235,0.08)', padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Ngày mở bài', value: fmtDt(detail.available_from) },
              { label: 'Hạn nộp',     value: fmtDt(detail.due_at) },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b' }}>{value}</div>
              </div>
            ))}
            {detail.instructions && (
              <div style={{ gridColumn: '1/-1' }}>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, marginBottom: 3 }}>Hướng dẫn</div>
                <div style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.5 }}>{detail.instructions}</div>
              </div>
            )}
          </div>

          {/* Student list */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Danh sách học sinh ({detail.students.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {detail.students.map((s, idx) => {
                const b = studentStatusBadge(s.status);
                return (
                  <div key={s.student_code} className="tad-row" style={{ animationDelay: `${idx * 0.02}s` }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(37,99,235,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <User size={15} color="#2563eb" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 1 }}>{s.student_code}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {s.status === 'submitted' && s.score !== null && (
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: s.score / (s.total ?? 1) >= 0.5 ? '#059669' : '#dc2626', lineHeight: 1 }}>{s.score}/{s.total}</div>
                          <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>{fmtDt(s.submitted_at)}</div>
                        </div>
                      )}
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, borderRadius: 20, padding: '3px 9px', background: b.bg, color: b.color }}>{b.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAssignmentDetail;
