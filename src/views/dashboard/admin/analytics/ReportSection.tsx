import { type FC, useEffect, useState } from 'react';
import { Loader2, ChevronDown, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminApi from '@/infra/admin/admin_api';
import type { ISubject, IReportResponse } from '@/infra/api/interfaces/IAnalytics';

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
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-sm font-semibold text-foreground mb-3">Báo cáo học phần tự động</p>

      <div className="flex items-center gap-2 flex-wrap mb-4">
        <div className="relative">
          <select
            value={subjectId}
            onChange={e => setSubjectId(e.target.value)}
            className="text-xs border border-border rounded-lg pl-3 pr-7 py-1.5 bg-card text-foreground appearance-none cursor-pointer"
          >
            <option value="">Chọn môn học...</option>
            {subjects.map(s => (
              <option key={s.id} value={s.ma_mon}>{s.ten_mon} ({s.ma_mon})</option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        <input
          type="number"
          min={1}
          value={days}
          onChange={e => setDays(Number(e.target.value) || 30)}
          className="text-xs border border-border rounded-lg px-3 py-1.5 bg-card text-foreground w-20"
          title="Số ngày"
        />
        <button
          onClick={handleView}
          disabled={!subjectId || loading}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#2F6B3F] text-white disabled:opacity-50"
        >
          Xem báo cáo
        </button>
        {report && (
          <button
            onClick={() => window.print()}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border text-foreground flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" /> In / Xuất PDF
          </button>
        )}
      </div>

      {loading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}

      {report && (
        <div className="space-y-4">
          <div>
            <p className="font-bold text-foreground">{report.subject.ten_mon}</p>
            <p className="text-xs text-muted-foreground">{report.subject.ma_mon}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Tin nhắn</p>
              <p className="text-lg font-bold text-foreground">{report.chat.total_messages}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Người dùng</p>
              <p className="text-lg font-bold text-foreground">{report.chat.unique_users}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Hữu ích</p>
              <p className="text-lg font-bold text-foreground">{report.chat.helpful_rate ?? '—'}%</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Đề đã tạo</p>
              <p className="text-lg font-bold text-foreground">{report.chat.exams_created}</p>
            </div>
          </div>

          <div className="rounded-lg border border-border p-3">
            <p className="text-xs font-semibold text-foreground mb-1">Kết quả quiz</p>
            {report.quiz.submissions_count === 0 ? (
              <p className="text-xs text-muted-foreground">Chưa có bài nộp.</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {report.quiz.submissions_count} lượt nộp / {report.quiz.assignments_count} đề — điểm TB {report.quiz.avg_score_percent ?? '—'}%
              </p>
            )}
          </div>

          <div className="rounded-lg border border-border p-3">
            <p className="text-xs font-semibold text-foreground mb-1">Bản đồ vùng rỗng kiến thức</p>
            {report.knowledge_map.knowledge_map.length === 0 ? (
              <p className="text-xs text-muted-foreground">Chưa có dữ liệu.</p>
            ) : (
              <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-0.5">
                {report.knowledge_map.knowledge_map.slice(0, 10).map((k, i) => (
                  <li key={i}>{k.chapter_title} — {k.unique_users} SV, {k.hit_count} lượt</li>
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
