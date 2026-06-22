import { type FC, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft, ClipboardList, Eye, Trash2, Send,
  Loader2, ChevronLeft, BookOpen, Clock, Hash,
} from 'lucide-react';
import toast from 'react-hot-toast';
import ChatApi from '@/infra/chat/chat_api';
import AssignModal from '@/views/dashboard/teacher/assignments/AssignModal';
import type { ISavedExam, IExamChapter, IExamQuestion } from '@/infra/api/interfaces/IChat';

// ── CSS ──────────────────────────────────────────────────
const CSS = `
  @keyframes se-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes se-spin{to{transform:rotate(360deg)}}
  @keyframes se-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
  .se-card{background:white;border-radius:14px;border:1px solid rgba(37,99,235,0.09);
    box-shadow:0 2px 10px rgba(37,99,235,0.04);overflow:hidden;position:relative;
    animation:se-fade .3s ease both}
  .se-card:hover{box-shadow:0 4px 20px rgba(37,99,235,0.08)}
  .se-action-btn{display:inline-flex;align-items:center;gap:5px;padding:6px 13px;
    border-radius:9px;font-size:0.73rem;font-weight:700;cursor:pointer;border:none;
    transition:opacity .13s;white-space:nowrap}
  .se-action-btn:hover{opacity:.82}
  .se-action-btn:disabled{opacity:.4;cursor:not-allowed}
  .se-skeleton{border-radius:12px;background:linear-gradient(90deg,#eef4ff 25%,#dbeafe 50%,#eef4ff 75%);
    background-size:200% 100%;animation:se-shimmer 1.4s ease infinite}
  .se-opt-row{display:flex;align-items:flex-start;gap:7px;padding:5px 8px;border-radius:7px}
`;

// ── Helpers ──────────────────────────────────────────────
const fmtDate = (iso?: string | null) => {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso));
};

const OPT_COLORS: Record<string, { bg: string; color: string }> = {
  A: { bg: 'rgba(37,99,235,0.06)',   color: '#2563eb' },
  B: { bg: 'rgba(124,58,237,0.06)',  color: '#7c3aed' },
  C: { bg: 'rgba(5,150,105,0.06)',   color: '#059669' },
  D: { bg: 'rgba(217,119,6,0.06)',   color: '#d97706' },
};

// ── Detail view ──────────────────────────────────────────
type ExamDetail = ISavedExam & { questions?: IExamQuestion[]; session_id?: string | null; teacher_id?: string | null; updated_at?: string | null };

const DetailView: FC<{ detail: ExamDetail; onBack: () => void }> = ({ detail, onBack }) => {
  const isConfirmed = detail.status === 'confirmed';
  const metaItems = [
    { label: 'Mã môn',      value: detail.ma_mon ?? '—' },
    { label: 'Số câu',      value: detail.question_count ?? '—' },
    { label: 'Thời gian',   value: detail.time_limit ? `${detail.time_limit} phút` : '—' },
    { label: 'Trạng thái',  value: isConfirmed ? 'Đã xác nhận' : 'Nháp' },
    { label: 'Ngày tạo',    value: fmtDate(detail.created_at) },
    { label: 'Xác nhận lúc',value: fmtDate(detail.confirmed_at) },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'se-fade .25s ease' }}>
      {/* Sub-header */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid rgba(37,99,235,0.08)', background: '#f8faff' }}>
        <button onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 8, background: 'rgba(37,99,235,0.07)', border: '1px solid rgba(37,99,235,0.15)', color: '#2563eb', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
          <ChevronLeft size={13} /> Quay lại
        </button>
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>Chi tiết đề kiểm tra</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 10px', borderRadius: 20, background: isConfirmed ? 'rgba(5,150,105,0.1)' : 'rgba(217,119,6,0.1)', color: isConfirmed ? '#059669' : '#d97706' }}>
          {isConfirmed ? 'Đã xác nhận' : 'Nháp'}
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {/* Meta grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
          {metaItems.map(({ label, value }) => (
            <div key={label} style={{ background: 'white', border: '1px solid rgba(37,99,235,0.08)', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>{String(value)}</div>
            </div>
          ))}
        </div>

        {/* Chapters */}
        {(detail.chapters ?? []).length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
              <BookOpen size={11} /> Chương
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {(detail.chapters as IExamChapter[]).map(ch => (
                <span key={ch.id} style={{ fontSize: '0.72rem', fontWeight: 600, color: '#1e3a8a', background: 'rgba(30,58,138,0.07)', borderRadius: 20, padding: '3px 10px', border: '1px solid rgba(30,58,138,0.1)' }}>
                  {ch.title}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Questions */}
        {(detail.questions ?? []).length > 0 && (
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Hash size={11} /> Câu hỏi ({(detail.questions ?? []).length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(detail.questions as IExamQuestion[]).map((q, i) => (
                <div key={i} style={{ background: 'white', borderRadius: 11, border: '1px solid rgba(37,99,235,0.1)', overflow: 'hidden' }}>
                  <div style={{ padding: '5px 12px', background: 'linear-gradient(135deg,rgba(30,58,138,0.06),rgba(37,99,235,0.04))', borderBottom: '1px solid rgba(37,99,235,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#1e3a8a' }}>Câu {i + 1}</span>
                    {q.chapter_title && <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>{q.chapter_title}</span>}
                  </div>
                  <div style={{ padding: '8px 12px', fontSize: '0.82rem', color: '#1e293b', lineHeight: 1.55, borderBottom: q.options ? '1px solid rgba(37,99,235,0.06)' : 'none' }}>
                    {q.question}
                  </div>
                  {q.options && (
                    <div style={{ padding: '8px 12px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {Object.entries(q.options).map(([key, val]) => {
                        const isAnswer = key === q.answer;
                        const col = OPT_COLORS[key] ?? OPT_COLORS.A;
                        return (
                          <div key={key} className="se-opt-row" style={{ background: isAnswer ? 'rgba(5,150,105,0.07)' : col.bg, border: `1px solid ${isAnswer ? 'rgba(5,150,105,0.2)' : 'transparent'}` }}>
                            <span style={{ flexShrink: 0, width: 18, height: 18, borderRadius: '50%', background: isAnswer ? '#059669' : col.color, color: 'white', fontSize: '0.62rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{key}</span>
                            <span style={{ fontSize: '0.78rem', color: isAnswer ? '#059669' : '#334155', fontWeight: isAnswer ? 700 : 400, lineHeight: 1.4, flex: 1 }}>{val as string}</span>
                            {isAnswer && <span style={{ fontSize: '0.6rem', color: '#059669', fontWeight: 800 }}>✓ Đáp án</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {q.explanation && (
                    <div style={{ padding: '6px 12px 8px', borderTop: '1px solid rgba(37,99,235,0.06)', fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic' }}>
                      💡 {q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────
const TeacherSubjectExams: FC = () => {
  const { maMon } = useParams<{ maMon: string }>();
  const navigate   = useNavigate();

  const [exams,        setExams]        = useState<ISavedExam[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [detail,       setDetail]       = useState<ExamDetail | null>(null);
  const [loadingDetail,setLoadingDetail]= useState<string | null>(null);
  const [deletingId,   setDeletingId]   = useState<string | null>(null);
  const [assigningExam,setAssigningExam]= useState<ISavedExam | null>(null);
  const tenMon = exams[0]?.ten_mon ?? maMon ?? '';

  useEffect(() => {
    if (!maMon) return;
    setLoading(true);
    ChatApi.getExams(maMon)
      .then(r => setExams(r.data ?? []))
      .catch(() => { setExams([]); toast.error('Không thể tải danh sách đề.'); })
      .finally(() => setLoading(false));
  }, [maMon]);

  const handleViewDetail = async (exam: ISavedExam) => {
    setLoadingDetail(exam.id);
    try {
      const r = await ChatApi.getExamDetail(exam.id);
      setDetail(r.data ?? null);
    } catch { toast.error('Không thể tải chi tiết đề.'); }
    finally { setLoadingDetail(null); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa đề kiểm tra này?')) return;
    setDeletingId(id);
    try {
      const r = await ChatApi.deleteExam(id);
      if (r.success) { toast.success('Đã xóa đề kiểm tra.'); setExams(p => p.filter(e => e.id !== id)); }
      else toast.error(r.message ?? 'Xóa thất bại.');
    } catch { toast.error('Xóa thất bại. Vui lòng thử lại.'); }
    finally { setDeletingId(null); }
  };

  const confirmed  = exams.filter(e => e.status === 'confirmed').length;
  const draft      = exams.filter(e => e.status !== 'confirmed').length;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#eef4ff 0%,#e0eaff 40%,#f0f9ff 100%)', fontFamily: "'Be Vietnam Pro',system-ui,sans-serif" }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e3a8a)', position: 'sticky', top: 0, zIndex: 20, boxShadow: '0 2px 16px rgba(15,23,42,0.25)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', color: 'white', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
            <ArrowLeft size={13} /> Quay lại
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'white', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ClipboardList size={14} color="#93c5fd" /> Đề kiểm tra
            </div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)' }}>{tenMon} · <span style={{ fontFamily: 'monospace' }}>{maMon}</span></div>
          </div>
          <button onClick={() => navigate(`/teacher/chat`)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 9, background: 'rgba(147,197,253,0.15)', border: '1px solid rgba(147,197,253,0.25)', color: '#bfdbfe', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
            + Tạo đề mới
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Stats */}
        {!detail && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {[
              { label: 'Tổng đề',      value: exams.length, color: '#1e3a8a', bg: 'rgba(30,58,138,0.07)'  },
              { label: 'Đã xác nhận',  value: confirmed,    color: '#059669', bg: 'rgba(5,150,105,0.07)'  },
              { label: 'Nháp',         value: draft,        color: '#d97706', bg: 'rgba(217,119,6,0.07)'  },
            ].map(({ label, value, color, bg }) => (
              <div key={label} style={{ background: 'white', borderRadius: 12, border: `1px solid ${color}18`, padding: '12px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, marginTop: 3 }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Detail or list */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid rgba(37,99,235,0.08)', overflow: 'hidden', minHeight: 300 }}>
          {detail ? (
            <DetailView detail={detail} onBack={() => setDetail(null)} />
          ) : loading ? (
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="se-skeleton" style={{ height: 90, animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          ) : exams.length === 0 ? (
            <div style={{ padding: '4rem 1rem', textAlign: 'center' }}>
              <ClipboardList size={42} color="#bfdbfe" style={{ margin: '0 auto 12px', display: 'block' }} />
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>Chưa có đề kiểm tra nào</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>Sử dụng chatbot TAI để tạo đề mới</div>
              <button onClick={() => navigate('/teacher/chat')}
                style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', border: 'none', color: 'white', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                Mở chatbot TAI
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {exams.map((exam, idx) => {
                const isConfirmed = exam.status === 'confirmed';
                const ribbon = isConfirmed
                  ? { bg: 'linear-gradient(135deg,#059669,#10b981)', text: 'Đã xác nhận', shadow: 'rgba(5,150,105,0.35)' }
                  : { bg: 'linear-gradient(135deg,#d97706,#f59e0b)', text: 'Nháp',         shadow: 'rgba(217,119,6,0.35)'  };

                return (
                  <div key={exam.id} style={{ position: 'relative', overflow: 'hidden', borderBottom: idx < exams.length - 1 ? '1px solid rgba(37,99,235,0.06)' : 'none', animation: `se-fade .3s ease ${idx * 0.05}s both` }}>
                    {/* Diagonal ribbon */}
                    <div style={{ position: 'absolute', top: 14, right: -26, width: 96, background: ribbon.bg, boxShadow: `0 2px 6px ${ribbon.shadow}`, transform: 'rotate(45deg)', textAlign: 'center', padding: '4px 0', zIndex: 1, pointerEvents: 'none' }}>
                      <span style={{ fontSize: '0.5rem', fontWeight: 900, color: 'white', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{ribbon.text}</span>
                    </div>

                    {/* Main content */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px 10px' }}>
                      <div style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 12, background: isConfirmed ? 'linear-gradient(135deg,rgba(5,150,105,0.12),rgba(16,185,129,0.07))' : 'linear-gradient(135deg,rgba(30,58,138,0.09),rgba(37,99,235,0.06))', border: `1px solid ${isConfirmed ? 'rgba(5,150,105,0.18)' : 'rgba(37,99,235,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ClipboardList size={18} color={isConfirmed ? '#059669' : '#1e3a8a'} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0, paddingRight: 50 }}>
                        <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 5 }}>
                          {exam.ten_mon || exam.ma_mon || '—'}
                        </div>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                          {exam.question_count != null && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.65rem', fontWeight: 700, color: '#1e3a8a', background: 'rgba(30,58,138,0.07)', borderRadius: 20, padding: '2px 8px' }}>
                              <Hash size={9} /> {exam.question_count} câu
                            </span>
                          )}
                          {exam.time_limit != null && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.65rem', fontWeight: 700, color: '#7c3aed', background: 'rgba(124,58,237,0.07)', borderRadius: 20, padding: '2px 8px' }}>
                              <Clock size={9} /> {exam.time_limit} phút
                            </span>
                          )}
                          {(exam.chapters ?? []).length > 0 && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.65rem', fontWeight: 700, color: '#0369a1', background: 'rgba(3,105,161,0.07)', borderRadius: 20, padding: '2px 8px' }}>
                              <BookOpen size={9} /> {(exam.chapters ?? []).length} chương
                            </span>
                          )}
                          <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>{fmtDate(exam.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px 12px', borderTop: '1px solid rgba(37,99,235,0.05)' }}>
                      {isConfirmed && (
                        <button onClick={() => setAssigningExam(exam)} disabled={!!loadingDetail || !!deletingId} className="se-action-btn"
                          style={{ background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', color: 'white', boxShadow: '0 2px 8px rgba(37,99,235,0.25)' }}>
                          <Send size={11} /> Giao bài
                        </button>
                      )}
                      <div style={{ flex: 1 }} />
                      <button onClick={() => handleViewDetail(exam)} disabled={!!loadingDetail || !!deletingId} className="se-action-btn"
                        style={{ background: 'rgba(30,58,138,0.06)', border: '1px solid rgba(30,58,138,0.12)', color: '#1e3a8a' }}>
                        {loadingDetail === exam.id
                          ? <Loader2 size={11} style={{ animation: 'se-spin 1s linear infinite' }} />
                          : <Eye size={11} />}
                        Xem
                      </button>
                      <button onClick={() => handleDelete(exam.id)} disabled={deletingId === exam.id || !!loadingDetail} className="se-action-btn"
                        style={{ background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.13)', color: '#dc2626', opacity: deletingId === exam.id ? 0.5 : 1 }}>
                        {deletingId === exam.id
                          ? <Loader2 size={11} style={{ animation: 'se-spin 1s linear infinite' }} />
                          : <Trash2 size={11} />}
                        Xóa
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Assign modal */}
      {assigningExam && (
        <AssignModal
          exam={assigningExam}
          subject={{ ma_mon: maMon ?? '', ten_mon: tenMon }}
          onClose={() => setAssigningExam(null)}
          onSuccess={() => setAssigningExam(null)}
        />
      )}
    </div>
  );
};

export default TeacherSubjectExams;
