import { type FC, useEffect, useState } from 'react';
import { Loader2, ChevronDown, Printer, FileBarChart } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminApi from '@/infra/admin/admin_api';
import type { ISubject, IReportResponse } from '@/infra/api/interfaces/IAnalytics';

const MINI_STATS = (report: IReportResponse) => [
  { label: 'Tin nhắn', value: report.chat.total_messages, tint: '#eff6ff', ink: '#2563eb' },
  { label: 'Người dùng', value: report.chat.unique_users, tint: '#eef2ff', ink: '#4f46e5' },
  { label: 'Hữu ích', value: report.chat.helpful_rate ? `${report.chat.helpful_rate.rate}%` : '—', tint: '#f0fdf4', ink: '#16a34a' },
  { label: 'Đề đã tạo', value: report.chat.exams_created, tint: '#fff7ed', ink: '#ea580c' },
];

const ReportSection: FC = () => {
  const [subjects,  setSubjects]  = useState<ISubject[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [days,      setDays]      = useState(30);
  const [report,    setReport]    = useState<IReportResponse | null>(null);
  const [loading,   setLoading]   = useState(false);

  useEffect(() => {
    AdminApi.getSubjects().then(res => setSubjects(res.data)).catch(() => {});
  }, []);

  const handleView = () => {
    if (!subjectId) return;
    setLoading(true);
    setReport(null);
    AdminApi.getReport(subjectId, days)
      .then(res => setReport(res))
      .catch(() => toast.error('Không thể tải báo cáo.'))
      .finally(() => setLoading(false));
  };

  return (
    <div className="ad-card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(8,145,178,0.1)', color: '#0891b2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <FileBarChart size={14} />
        </div>
        <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Báo cáo học phần tự động</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ position: 'relative' }}>
          <select
            value={subjectId}
            onChange={e => setSubjectId(e.target.value)}
            className="ad-select"
          >
            <option value="">Chọn môn học...</option>
            {subjects.map(s => (
              <option key={s.id} value={s.ma_mon}>{s.ten_mon} ({s.ma_mon})</option>
            ))}
          </select>
          <ChevronDown size={13} color="#94a3b8" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        </div>
        <input
          type="number"
          min={1}
          value={days}
          onChange={e => setDays(Number(e.target.value) || 30)}
          className="ad-input"
          style={{ width: 76 }}
          title="Số ngày"
        />
        <button onClick={handleView} disabled={!subjectId || loading} className="ad-btn-primary">
          Xem báo cáo
        </button>
        {report && (
          <button
            onClick={() => window.print()}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 600, color: '#334155', background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 14px', cursor: 'pointer' }}
          >
            <Printer size={13} /> In / Xuất PDF
          </button>
        )}
      </div>

      {loading && <Loader2 size={18} color="#94a3b8" style={{ animation: 'ad-spin 1s linear infinite' }} />}

      {report && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <p style={{ fontWeight: 800, color: '#0f172a', margin: 0, fontSize: '0.92rem' }}>{report.subject.ten_mon}</p>
            <p style={{ fontSize: '0.74rem', color: '#94a3b8', margin: '2px 0 0' }}>{report.subject.ma_mon}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
            {MINI_STATS(report).map(s => (
              <div key={s.label} className="ad-stat-card" style={{ padding: '12px 14px' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.ink, flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: 0 }}>{s.label}</p>
                  <p style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderRadius: 12, border: '1px solid #e8edf3', background: '#f8fafc', padding: 14 }}>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>Kết quả quiz</p>
            {report.quiz.submissions_count === 0 ? (
              <p style={{ fontSize: '0.76rem', color: '#94a3b8', margin: 0 }}>Chưa có bài nộp.</p>
            ) : (
              <p style={{ fontSize: '0.76rem', color: '#64748b', margin: 0 }}>
                {report.quiz.submissions_count} lượt nộp / {report.quiz.assignments_count} đề — điểm TB {report.quiz.avg_score_percent ?? '—'}%
              </p>
            )}
          </div>

          <div style={{ borderRadius: 12, border: '1px solid #e8edf3', background: '#f8fafc', padding: 14 }}>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>Bản đồ vùng rỗng kiến thức</p>
            {report.knowledge_map.knowledge_map.length === 0 ? (
              <p style={{ fontSize: '0.76rem', color: '#94a3b8', margin: 0 }}>Chưa có dữ liệu.</p>
            ) : (
              <ul style={{ fontSize: '0.76rem', color: '#64748b', margin: 0, paddingLeft: 18 }}>
                {report.knowledge_map.knowledge_map.slice(0, 10).map((k, i) => (
                  <li key={i} style={{ marginBottom: 2 }}>{k.chapter_title} — {k.unique_users} SV, {k.hit_count} lượt</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportSection;
