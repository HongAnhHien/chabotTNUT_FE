import { type FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Loader2, Plus, ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';
import TeacherApi from '@/infra/teacher/teacher_api';
import type { IAssignmentListItem } from '@/infra/api/interfaces/IAssignment';
import CSS from './assignments.styles';
import { fmtDt, statusPill } from './helpers';

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
    <div style={{ minHeight: '100%', background: 'linear-gradient(160deg,#eef4ff 0%,#e0eaff 40%,#f0f9ff 100%)', fontFamily: "'Be Vietnam Pro',system-ui,sans-serif" }}>
      <style>{CSS}</style>

      <div className="as-list-hdr">
        <div className="as-list-hdr-row">
          <div>
            <h1 className="as-list-hdr-title">Bài kiểm tra đã giao</h1>
            <div style={{ marginTop: 5, fontSize: 13.5, color: '#64748b' }}>
            </div>
          </div>
          <button className="as-btn primary" style={{ marginLeft: 'auto' }} onClick={() => navigate('/teacher/subjects')}>
            <Plus size={18} /> Giao đề mới
          </button>
        </div>
      </div>

      <div className="as-list-content">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <Loader2 size={28} color="#2563eb" style={{ animation: 'as-spin 1s linear infinite', margin: '0 auto 10px', display: 'block' }} />
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
          <div className="as-table-card">
            <div className="as-table-head">
              <div>Đề kiểm tra</div><div>Trạng thái</div><div>Tiến độ nộp</div><div>Hạn nộp</div>
            </div>
            {assignments.map((a, idx) => {
              const pill = statusPill(a.status);
              const pct  = a.student_count > 0 ? Math.round((a.submitted_count / a.student_count) * 100) : 0;
              return (
                <div key={a.id} className="as-table-row" style={{ animationDelay: `${idx * 0.03}s` }}
                  onClick={() => navigate(`/teacher/assignments/${a.id}`)}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.title}</div>
                    <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>
                      <span style={{ fontFamily: 'monospace', color: '#2563eb' }}>{a.ma_mon}</span> · {a.student_count} học sinh
                    </div>
                  </div>
                  <div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, padding: '4px 11px', borderRadius: 999, background: pill.background, color: pill.color, whiteSpace: 'nowrap' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />{pill.label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                    <div style={{ flex: 1, height: 7, borderRadius: 999, background: '#eef2f7', overflow: 'hidden', maxWidth: 150 }}>
                      <div style={{ height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#2563eb,#3b82f6)', width: `${pct}%` }} />
                    </div>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: '#475569' }}>{a.submitted_count}/{a.student_count}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>{fmtDt(a.due_at)}</div>
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
