import { type FC, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import {
  ClipboardList, Eye, Trash2, Send,
  Loader2, ChevronLeft, BookOpen, Clock, Hash,
  Pencil, X, Save, Calendar, Users, CheckCircle,
  AlertCircle, Search, User, BarChart2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import ChatApi from '@/infra/chat/chat_api';
import TeacherApi from '@/infra/teacher/teacher_api';
import AssignModal from '@/views/dashboard/teacher/assignments/AssignModal';
import type { ISavedExam, IExamChapter, IExamQuestion } from '@/infra/api/interfaces/IChat';
import type {
  IAssignmentListItem, IAssignmentDetail, IAssignmentStudentItem,
} from '@/infra/api/interfaces/IAssignment';

// ── LaTeX renderer ─────────────────────────────────────
const _renderKatex = (src: string, display: boolean) => {
  try { return katex.renderToString(src, { throwOnError: false, displayMode: display, output: 'html' }); }
  catch { return src; }
};
const _parseLatex = (text: string) => {
  const chunks: Array<{ t: 'text' | 'inline' | 'display'; c: string }> = [];
  const re = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;
  let last = 0, m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) chunks.push({ t: 'text', c: text.slice(last, m.index) });
    const raw = m[0];
    if (raw.startsWith('$$')) chunks.push({ t: 'display', c: raw.slice(2, -2) });
    else                      chunks.push({ t: 'inline',  c: raw.slice(1, -1) });
    last = m.index + raw.length;
  }
  if (last < text.length) chunks.push({ t: 'text', c: text.slice(last) });
  return chunks;
};
const LT: FC<{ text: string }> = ({ text }) => (
  <span>
    {_parseLatex(text ?? '').map((c, i) =>
      c.t === 'text'
        ? <span key={i}>{c.c}</span>
        : <span key={i} dangerouslySetInnerHTML={{ __html: _renderKatex(c.c, c.t === 'display') }} />
    )}
  </span>
);

// ── CSS ──────────────────────────────────────────────────
const CSS = `
  @keyframes se-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes se-spin{to{transform:rotate(360deg)}}
  @keyframes se-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
  @keyframes se-pop{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
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
  .se-edit-input{width:100%;padding:8px 11px;border-radius:10px;border:1.5px solid rgba(37,99,235,0.18);
    font-size:0.82rem;color:#1e293b;background:white;outline:none;box-sizing:border-box;transition:border-color .15s}
  .se-edit-input:focus{border-color:#2563eb}
  .se-tab{padding:7px 16px;border-radius:9px;font-size:0.75rem;font-weight:700;cursor:pointer;
    border:none;transition:all .15s;white-space:nowrap}
  .se-tab.active{background:white;color:#1e3a8a;box-shadow:0 2px 8px rgba(37,99,235,0.12)}
  .se-tab.inactive{background:transparent;color:rgba(255,255,255,0.6)}
  .se-tab.inactive:hover{color:white}
  .se-stu-row{display:flex;align-items:center;gap:10px;padding:10px 16px;transition:background .12s}
  .se-stu-row:hover{background:rgba(37,99,235,0.03)}
  .se-search{width:100%;padding:8px 12px 8px 34px;border-radius:10px;border:1.5px solid rgba(37,99,235,0.15);
    font-size:0.8rem;outline:none;box-sizing:border-box;transition:border-color .15s}
  .se-search:focus{border-color:#2563eb}
  .se-stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
  .se-edit-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .se-meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  @media (max-width:420px) {
    .se-stats-grid{grid-template-columns:repeat(2,1fr)}
    .se-edit-grid{grid-template-columns:1fr}
    .se-meta-grid{grid-template-columns:1fr}
  }
`;

// ── Helpers ──────────────────────────────────────────────
const fmtDate = (iso?: string | null) => {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso));
};
const fmtDt = (s?: string | null) => {
  if (!s) return '—';
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(s.replace(' ', 'T')));
};
const toInput   = (s?: string | null) => s ? s.slice(0, 16).replace(' ', 'T') : '';
const toApiDate = (dt: string)         => dt ? dt.replace('T', ' ') + ':00' : '';
const aStatusBadge = (s: string) =>
  s === 'published' ? { label: 'Đang mở', bg: 'rgba(5,150,105,0.1)', color: '#059669' }
                    : { label: 'Đã đóng', bg: 'rgba(100,116,139,0.1)', color: '#64748b' };

const stuBadge = (st: IAssignmentStudentItem['status']) =>
  st === 'submitted'   ? { label: 'Đã nộp',   bg: 'rgba(5,150,105,0.1)',   color: '#059669' } :
  st === 'in_progress' ? { label: 'Đang làm', bg: 'rgba(37,99,235,0.1)',   color: '#2563eb' } :
                         { label: 'Chưa làm', bg: 'rgba(100,116,139,0.08)', color: '#94a3b8' };

const OPT_COLORS: Record<string, { bg: string; color: string }> = {
  A: { bg: 'rgba(37,99,235,0.06)',   color: '#2563eb' },
  B: { bg: 'rgba(124,58,237,0.06)',  color: '#7c3aed' },
  C: { bg: 'rgba(5,150,105,0.06)',   color: '#059669' },
  D: { bg: 'rgba(217,119,6,0.06)',   color: '#d97706' },
};

// ── Assignment Detail Modal ───────────────────────────────
const AssignmentDetailModal: FC<{
  assignId: string;
  onClose: () => void;
  onUpdated: (patch: Partial<IAssignmentListItem>) => void;
}> = ({ assignId, onClose, onUpdated }) => {
  const [detail,  setDetail]  = useState<IAssignmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState<'detail' | 'edit'>('detail');
  const [search,  setSearch]  = useState('');

  // Edit form state
  const [eTitle,  setETitle]  = useState('');
  const [eFrom,   setEFrom]   = useState('');
  const [eDue,    setEDue]    = useState('');
  const [eStatus, setEStatus] = useState<'published' | 'closed'>('published');
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    TeacherApi.getAssignmentDetail(assignId)
      .then(r => {
        setDetail(r.data);
        setETitle(r.data.title ?? '');
        setEFrom(toInput(r.data.available_from));
        setEDue(toInput(r.data.due_at));
        setEStatus((r.data.status as 'published' | 'closed') ?? 'published');
      })
      .catch(() => toast.error('Không thể tải chi tiết bài giao.'))
      .finally(() => setLoading(false));
  }, [assignId]);

  const handleSave = async () => {
    if (!eFrom) { toast.error('Chưa nhập ngày mở bài.'); return; }
    if (!eDue)  { toast.error('Chưa nhập hạn nộp.'); return; }
    if (new Date(eDue) <= new Date(eFrom)) { toast.error('Hạn nộp phải sau ngày mở.'); return; }
    setSaving(true);
    try {
      const r = await TeacherApi.updateAssignment(assignId, {
        title:          eTitle.trim() || undefined,
        available_from: toApiDate(eFrom),
        due_at:         toApiDate(eDue),
        status:         eStatus,
      });
      if (r.success) {
        toast.success('Đã cập nhật bài giao.');
        setDetail(p => p ? { ...p, title: eTitle.trim(), available_from: toApiDate(eFrom), due_at: toApiDate(eDue), status: eStatus } : p);
        onUpdated({ title: eTitle.trim(), available_from: toApiDate(eFrom), due_at: toApiDate(eDue), status: eStatus });
        setTab('detail');
      } else toast.error(r.message ?? 'Cập nhật thất bại.');
    } catch (e: unknown) {
      const data = (e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
      toast.error((data?.errors ? Object.values(data.errors).flat()[0] : data?.message) ?? 'Thất bại.', { duration: 5000 });
    } finally { setSaving(false); }
  };

  const filtered = (detail?.students ?? []).filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.student_code.toLowerCase().includes(search.toLowerCase())
  );

  const stats = detail?.stats;

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(10,15,30,0.6)', backdropFilter: 'blur(3px)' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 401, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
        <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 620, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 30px 80px rgba(0,0,0,0.25)', animation: 'se-pop .22s cubic-bezier(.34,1.2,.64,1) both', overflow: 'hidden' }}>

          {/* ── Header ── */}
          <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e3a8a)', padding: '16px 18px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
                <div style={{ fontSize: '0.7rem', color: '#93c5fd', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Bài giao kiểm tra</div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {loading ? '...' : (detail?.title ?? '—')}
                </div>
                {detail && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, ...( detail.status === 'published' ? { background: 'rgba(74,222,128,0.18)', color: '#4ade80' } : { background: 'rgba(148,163,184,0.18)', color: '#94a3b8' } ) }}>
                      {detail.status === 'published' ? '● Đang mở' : '● Đã đóng'}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)' }}>Mở: {fmtDt(detail.available_from)}</span>
                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)' }}>HN: {fmtDt(detail.due_at)}</span>
                  </div>
                )}
              </div>
              <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <X size={13} />
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, background: 'rgba(0,0,0,0.2)', borderRadius: 11, padding: 4, width: 'fit-content' }}>
              {([['detail', <BarChart2 size={11} />, 'Chi tiết'], ['edit', <Pencil size={11} />, 'Chỉnh sửa']] as const).map(([v, icon, label]) => (
                <button key={v} className={`se-tab ${tab === v ? 'active' : 'inactive'}`} onClick={() => setTab(v as 'detail' | 'edit')}>
                  {icon} {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Body ── */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {loading ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
                <Loader2 size={24} color="#2563eb" style={{ animation: 'se-spin 1s linear infinite' }} />
                <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Đang tải...</div>
              </div>
            ) : tab === 'edit' ? (
              /* ── Edit form ── */
              <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Tiêu đề</div>
                  <input className="se-edit-input" value={eTitle} onChange={e => setETitle(e.target.value)} placeholder="Tiêu đề bài kiểm tra" />
                </div>
                <div className="se-edit-grid">
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={10} /> Ngày mở bài
                    </div>
                    <input type="datetime-local" className="se-edit-input" value={eFrom} onChange={e => setEFrom(e.target.value)} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={10} /> Hạn nộp
                    </div>
                    <input type="datetime-local" className="se-edit-input" value={eDue} onChange={e => setEDue(e.target.value)} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Trạng thái</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['published', 'closed'] as const).map(s => (
                      <button key={s} onClick={() => setEStatus(s)}
                        style={{ flex: 1, padding: '9px 0', borderRadius: 10, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', border: `2px solid ${eStatus === s ? (s === 'published' ? '#059669' : '#64748b') : 'rgba(37,99,235,0.12)'}`, background: eStatus === s ? (s === 'published' ? 'rgba(5,150,105,0.08)' : 'rgba(100,116,139,0.08)') : 'white', color: eStatus === s ? (s === 'published' ? '#059669' : '#64748b') : '#94a3b8', transition: 'all .15s' }}>
                        {s === 'published' ? '🟢 Đang mở' : '⛔ Đã đóng'}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                  <button onClick={() => setTab('detail')} disabled={saving}
                    style={{ flex: 1, padding: '10px', borderRadius: 11, background: 'rgba(100,116,139,0.07)', border: '1px solid rgba(100,116,139,0.15)', color: '#64748b', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>
                    Hủy
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    style={{ flex: 2, padding: '10px', borderRadius: 11, background: saving ? 'rgba(37,99,235,0.3)' : 'linear-gradient(135deg,#1e3a8a,#2563eb)', border: 'none', color: 'white', fontSize: '0.82rem', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                    {saving ? <><Loader2 size={13} style={{ animation: 'se-spin 1s linear infinite' }} /> Đang lưu...</> : <><Save size={13} /> Lưu thay đổi</>}
                  </button>
                </div>
              </div>
            ) : (
              /* ── Detail view ── */
              <>
                {/* Stats */}
                {stats && (
                  <div className="se-stats-grid" style={{ padding: '14px 16px 10px', flexShrink: 0 }}>
                    {[
                      { label: 'Tổng HS',   val: stats.total,       icon: Users,       color: '#1e3a8a', bg: 'rgba(30,58,138,0.07)'  },
                      { label: 'Đã nộp',    val: stats.submitted,   icon: CheckCircle, color: '#059669', bg: 'rgba(5,150,105,0.08)'  },
                      { label: 'Đang làm',  val: stats.in_progress, icon: Clock,       color: '#2563eb', bg: 'rgba(37,99,235,0.08)'  },
                      { label: 'Chưa làm',  val: stats.not_started, icon: AlertCircle, color: '#94a3b8', bg: 'rgba(100,116,139,0.07)' },
                    ].map(({ label, val, icon: Icon, color, bg }) => (
                      <div key={label} style={{ borderRadius: 12, padding: '10px 8px', textAlign: 'center', background: bg, border: `1px solid ${color}18` }}>
                        <Icon size={16} color={color} style={{ margin: '0 auto 4px', display: 'block' }} />
                        <div style={{ fontSize: '1.3rem', fontWeight: 900, color, lineHeight: 1 }}>{val}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, marginTop: 3 }}>{label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Progress bar */}
                {stats && stats.total > 0 && (
                  <div style={{ padding: '0 16px 10px', flexShrink: 0 }}>
                    <div style={{ height: 6, borderRadius: 99, background: 'rgba(37,99,235,0.08)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(stats.submitted / stats.total) * 100}%`, background: 'linear-gradient(90deg,#059669,#10b981)', borderRadius: 99, transition: 'width .4s ease' }} />
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 4, textAlign: 'right' }}>
                      {stats.submitted}/{stats.total} đã nộp ({Math.round((stats.submitted / stats.total) * 100)}%)
                    </div>
                  </div>
                )}

                {/* Search */}
                <div style={{ padding: '0 16px 10px', flexShrink: 0, position: 'relative' }}>
                  <Search size={13} color="#94a3b8" style={{ position: 'absolute', left: 28, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input className="se-search" value={search} onChange={e => setSearch(e.target.value)} placeholder={`Tìm trong ${detail?.students.length ?? 0} học sinh...`} />
                </div>

                {/* Student list */}
                <div style={{ flex: 1, overflowY: 'auto', borderTop: '1px solid rgba(37,99,235,0.06)' }}>
                  {filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.82rem' }}>Không tìm thấy học sinh</div>
                  ) : filtered.map((stu, idx) => {
                    const b = stuBadge(stu.status);
                    const pct = stu.score !== null && stu.total ? Math.round((stu.score / stu.total) * 100) : null;
                    return (
                      <div key={stu.student_code} className="se-stu-row"
                        style={{ borderBottom: idx < filtered.length - 1 ? '1px solid rgba(37,99,235,0.05)' : 'none' }}>
                        {/* Avatar */}
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,rgba(30,58,138,0.08),rgba(37,99,235,0.05))', border: '1px solid rgba(37,99,235,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <User size={14} color="#2563eb" />
                        </div>
                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stu.name}</div>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace', marginTop: 1 }}>{stu.student_code}</div>
                        </div>
                        {/* Score */}
                        {stu.status === 'submitted' && stu.score !== null && stu.total && (
                          <div style={{ textAlign: 'center', flexShrink: 0 }}>
                            <div style={{ fontSize: '1rem', fontWeight: 800, lineHeight: 1, color: pct !== null && pct >= 50 ? '#059669' : '#dc2626' }}>
                              {stu.score}<span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>/{stu.total}</span>
                            </div>
                            {pct !== null && <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 1 }}>{pct}%</div>}
                          </div>
                        )}
                        {/* Status */}
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, borderRadius: 20, padding: '3px 9px', background: b.bg, color: b.color, flexShrink: 0 }}>{b.label}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// ── Detail view (exam questions) ─────────────────────────
type ExamDetail = ISavedExam & { questions?: IExamQuestion[]; session_id?: string | null; updated_at?: string | null };

const DetailView: FC<{ detail: ExamDetail; onBack: () => void }> = ({ detail, onBack }) => {
  const isConfirmed = detail.status === 'confirmed';
  const metaItems = [
    { label: 'Mã môn',       value: detail.ma_mon ?? '—' },
    { label: 'Số câu',       value: detail.question_count ?? '—' },
    { label: 'Thời gian',    value: detail.time_limit ? `${detail.time_limit} phút` : '—' },
    { label: 'Trạng thái',   value: isConfirmed ? 'Đã xác nhận' : 'Nháp' },
    { label: 'Ngày tạo',     value: fmtDate(detail.created_at) },
    { label: 'Xác nhận lúc', value: fmtDate(detail.confirmed_at) },
  ];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'se-fade .25s ease' }}>
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid rgba(37,99,235,0.08)', background: '#f8faff' }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 8, background: 'rgba(37,99,235,0.07)', border: '1px solid rgba(37,99,235,0.15)', color: '#2563eb', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
          <ChevronLeft size={13} /> Quay lại
        </button>
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>Chi tiết đề kiểm tra</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 10px', borderRadius: 20, background: isConfirmed ? 'rgba(5,150,105,0.1)' : 'rgba(217,119,6,0.1)', color: isConfirmed ? '#059669' : '#d97706' }}>
          {isConfirmed ? 'Đã xác nhận' : 'Nháp'}
        </span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        <div className="se-meta-grid" style={{ marginBottom: 16 }}>
          {metaItems.map(({ label, value }) => (
            <div key={label} style={{ background: 'white', border: '1px solid rgba(37,99,235,0.08)', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>{String(value)}</div>
            </div>
          ))}
        </div>
        {(detail.chapters ?? []).length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}><BookOpen size={11} /> Chương</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {(detail.chapters as IExamChapter[]).map(ch => (
                <span key={ch.id} style={{ fontSize: '0.72rem', fontWeight: 600, color: '#1e3a8a', background: 'rgba(30,58,138,0.07)', borderRadius: 20, padding: '3px 10px', border: '1px solid rgba(30,58,138,0.1)' }}>{ch.title}</span>
              ))}
            </div>
          </div>
        )}
        {(detail.questions ?? []).length > 0 && (
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}><Hash size={11} /> Câu hỏi ({(detail.questions ?? []).length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(detail.questions as IExamQuestion[]).map((q, i) => (
                <div key={i} style={{ background: 'white', borderRadius: 11, border: '1px solid rgba(37,99,235,0.1)', overflow: 'hidden' }}>
                  <div style={{ padding: '5px 12px', background: 'rgba(30,58,138,0.04)', borderBottom: '1px solid rgba(37,99,235,0.07)', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1e3a8a' }}>Câu {i + 1}</span>
                    {q.chapter_title && <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{q.chapter_title}</span>}
                  </div>
                  <div style={{ padding: '8px 12px', fontSize: '0.82rem', color: '#1e293b', lineHeight: 1.55, borderBottom: q.options ? '1px solid rgba(37,99,235,0.06)' : 'none' }}><LT text={q.question ?? ''} /></div>
                  {q.options && (
                    <div style={{ padding: '8px 12px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {Object.entries(q.options).map(([key, val]) => {
                        const isAnswer = key === q.answer;
                        const col = OPT_COLORS[key] ?? OPT_COLORS.A;
                        return (
                          <div key={key} className="se-opt-row" style={{ background: isAnswer ? 'rgba(5,150,105,0.07)' : col.bg, border: `1px solid ${isAnswer ? 'rgba(5,150,105,0.2)' : 'transparent'}` }}>
                            <span style={{ flexShrink: 0, width: 18, height: 18, borderRadius: '50%', background: isAnswer ? '#059669' : col.color, color: 'white', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{key}</span>
                            <span style={{ fontSize: '0.78rem', color: isAnswer ? '#059669' : '#334155', fontWeight: isAnswer ? 700 : 400, flex: 1 }}><LT text={val as string} /></span>
                            {isAnswer && <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 800 }}>✓</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {q.explanation && <div style={{ padding: '6px 12px 8px', borderTop: '1px solid rgba(37,99,235,0.06)', fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic' }}>💡 <LT text={q.explanation} /></div>}
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
  const [searchParams, setSearchParams] = useSearchParams();

  const [exams,          setExams]          = useState<ISavedExam[]>([]);
  const [assignments,    setAssignments]    = useState<IAssignmentListItem[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [detail,         setDetail]         = useState<ExamDetail | null>(null);
  const [loadingDetail,  setLoadingDetail]  = useState<string | null>(null);
  const [deletingId,     setDeletingId]     = useState<string | null>(null);
  const [assigningExam,  setAssigningExam]  = useState<ISavedExam | null>(null);
  const [viewingAssignId, setViewingAssignId] = useState<string | null>(null);

  const examParam = searchParams.get('exam');

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

  // Load exam detail whenever ?exam= param changes
  useEffect(() => {
    if (!examParam) { setDetail(null); return; }
    setLoadingDetail(examParam);
    ChatApi.getExamDetail(examParam)
      .then(r => setDetail(r.data ?? null))
      .catch(() => toast.error('Không thể tải chi tiết đề.'))
      .finally(() => setLoadingDetail(null));
  }, [examParam]);

  const handleViewDetail = (exam: ISavedExam) => {
    setSearchParams({ exam: exam.id }, { replace: true });
  };

  const closeDetail = () => {
    setSearchParams({}, { replace: true });
    setDetail(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa đề kiểm tra này?')) return;
    setDeletingId(id);
    try {
      const r = await ChatApi.deleteExam(id);
      if (r.success) { toast.success('Đã xóa đề kiểm tra.'); setExams(p => p.filter(e => e.id !== id)); }
      else toast.error(r.message ?? 'Xóa thất bại.');
    } catch { toast.error('Xóa thất bại.'); }
    finally { setDeletingId(null); }
  };

  const [openingChat,    setOpeningChat]    = useState(false);
  const [search,         setSearch]         = useState('');
  const [examTypeFilter, setExamTypeFilter] = useState('');

  const EXAM_TYPES = [
    { value: 'kiem_tra_chuong', label: 'Kiểm tra chương' },
    { value: 'giua_ky',        label: 'Giữa kỳ'          },
  ];

  const filteredExams = useMemo(() => {
    let list = exams;
    if (examTypeFilter) list = list.filter(e => e.exam_type === examTypeFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(e =>
        (e.ten_mon ?? '').toLowerCase().includes(q) ||
        (e.ma_mon ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [exams, search, examTypeFilter]);

  const openChatbot = async () => {

    if (!maMon || openingChat) return;
    setOpeningChat(true);
    try {
      const r = await ChatApi.createSession(maMon);
      navigate(`/teacher/chat/${r.session_id}`);
    } catch {
      toast.error('Không thể mở chatbot. Vui lòng thử lại.');
    } finally {
      setOpeningChat(false);
    }
  };

  return (
    <div style={{ minHeight: '100%', background: 'linear-gradient(160deg,#eef4ff 0%,#e0eaff 40%,#f0f9ff 100%)', fontFamily: "'Be Vietnam Pro',system-ui,sans-serif" }}>
      <style>{CSS}</style>

      {/* Content */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Title + action bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ClipboardList size={15} color="#2563eb" /> Đề kiểm tra
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 2 }}>{tenMon} · <span style={{ fontFamily: 'monospace' }}>{maMon}</span></div>
          </div>
          <button onClick={openChatbot} disabled={openingChat} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 16px', borderRadius: 10, background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', border: 'none', color: 'white', fontSize: '0.78rem', fontWeight: 700, cursor: openingChat ? 'not-allowed' : 'pointer', opacity: openingChat ? 0.7 : 1, flexShrink: 0 }}>
            {openingChat ? '...' : '+ Tạo đề mới'}
          </button>
        </div>

        {/* Search + Filter bar */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 180, position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kiếm đề..."
              style={{ width: '100%', paddingLeft: 30, paddingRight: 10, height: 36, borderRadius: 10, border: '1px solid rgba(37,99,235,0.18)', fontSize: '0.82rem', outline: 'none', background: 'white', boxSizing: 'border-box' }}
            />
          </div>
          <select
            value={examTypeFilter}
            onChange={e => setExamTypeFilter(e.target.value)}
            style={{ height: 36, borderRadius: 10, border: '1px solid rgba(37,99,235,0.18)', fontSize: '0.82rem', padding: '0 10px 0 10px', background: 'white', color: '#1e293b', cursor: 'pointer', outline: 'none', appearance: 'none', WebkitAppearance: 'none', paddingRight: 28, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
          >
            <option value=''>Tất cả loại đề</option>
            {EXAM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        {/* List */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid rgba(37,99,235,0.08)', overflow: 'hidden', minHeight: 300 }}>
          {loading ? (
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1,2,3].map(i => <div key={i} className="se-skeleton" style={{ height: 100, animationDelay: `${i*0.1}s` }} />)}
            </div>
          ) : exams.length === 0 ? (
            <div style={{ padding: '4rem 1rem', textAlign: 'center' }}>
              <ClipboardList size={42} color="#bfdbfe" style={{ margin: '0 auto 12px', display: 'block' }} />
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>Chưa có đề kiểm tra nào</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>Sử dụng chatbot TAI để tạo đề mới</div>
              <button onClick={openChatbot} disabled={openingChat} style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', border: 'none', color: 'white', fontSize: '0.8rem', fontWeight: 700, cursor: openingChat ? 'not-allowed' : 'pointer', opacity: openingChat ? 0.7 : 1 }}>
                {openingChat ? 'Đang mở...' : 'Mở chatbot TAI'}
              </button>
            </div>
          ) : filteredExams.length === 0 ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>Không tìm thấy đề phù hợp</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredExams.map((exam, idx) => {
                const isConfirmed = exam.status === 'confirmed';
                const ribbon = isConfirmed
                  ? { bg: 'linear-gradient(135deg,#059669,#10b981)', text: 'Đã xác nhận', shadow: 'rgba(5,150,105,0.35)' }
                  : { bg: 'linear-gradient(135deg,#d97706,#f59e0b)', text: 'Nháp', shadow: 'rgba(217,119,6,0.35)' };
                const asgn  = assignByExamId[exam.id];
                const aBadge = asgn ? aStatusBadge(asgn.status) : null;

                return (
                  <div key={exam.id} style={{ position: 'relative', overflow: 'hidden', borderBottom: idx < filteredExams.length - 1 ? '1px solid rgba(37,99,235,0.06)' : 'none', animation: `se-fade .3s ease ${idx * 0.05}s both` }}>
                    {/* Ribbon */}
                    <div style={{ position: 'absolute', top: 14, right: -26, width: 96, background: ribbon.bg, boxShadow: `0 2px 6px ${ribbon.shadow}`, transform: 'rotate(45deg)', textAlign: 'center', padding: '4px 0', zIndex: 1, pointerEvents: 'none' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'white', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{ribbon.text}</span>
                    </div>

                    {/* Main row */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px 10px' }}>
                      <div style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 12, background: isConfirmed ? 'rgba(5,150,105,0.1)' : 'rgba(37,99,235,0.07)', border: `1px solid ${isConfirmed ? 'rgba(5,150,105,0.2)' : 'rgba(37,99,235,0.12)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ClipboardList size={18} color={isConfirmed ? '#059669' : '#1e3a8a'} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0, paddingRight: 50 }}>
                        <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 5 }}>
                          {exam.ten_mon || exam.ma_mon || '—'}
                        </div>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                          {exam.exam_type && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.7rem', fontWeight: 700, color: '#c2410c', background: 'rgba(194,65,12,0.08)', borderRadius: 20, padding: '2px 8px', border: '1px solid rgba(194,65,12,0.15)' }}>
                              {EXAM_TYPES.find(t => t.value === exam.exam_type)?.label ?? exam.exam_type}
                            </span>
                          )}
                          {exam.question_count != null && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.7rem', fontWeight: 700, color: '#1e3a8a', background: 'rgba(30,58,138,0.07)', borderRadius: 20, padding: '2px 8px' }}>
                              <Hash size={9} /> {exam.question_count} câu
                            </span>
                          )}
                          {exam.time_limit != null && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.7rem', fontWeight: 700, color: '#7c3aed', background: 'rgba(124,58,237,0.07)', borderRadius: 20, padding: '2px 8px' }}>
                              <Clock size={9} /> {exam.time_limit} phút
                            </span>
                          )}
                          {(exam.chapters ?? []).length > 0 && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.7rem', fontWeight: 700, color: '#0369a1', background: 'rgba(3,105,161,0.07)', borderRadius: 20, padding: '2px 8px' }}>
                              <BookOpen size={9} /> {(exam.chapters ?? []).length} chương
                            </span>
                          )}
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{fmtDate(exam.created_at)}</span>
                        </div>

                        {/* Assignment strip — click to open detail */}
                        {asgn && (
                          <button onClick={() => setViewingAssignId(asgn.id)}
                            style={{ marginTop: 8, width: '100%', padding: '7px 10px', background: 'rgba(37,99,235,0.04)', borderRadius: 9, border: '1px solid rgba(37,99,235,0.1)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', cursor: 'pointer', textAlign: 'left', transition: 'background .15s' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(37,99,235,0.08)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(37,99,235,0.04)')}
                          >
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, borderRadius: 20, padding: '1px 7px', background: aBadge!.bg, color: aBadge!.color }}>{aBadge!.label}</span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.7rem', color: '#64748b' }}><Users size={9} /> {asgn.student_count} HS</span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.7rem', color: '#059669' }}><CheckCircle size={9} /> {asgn.submitted_count}/{asgn.student_count} nộp</span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.7rem', color: '#94a3b8' }}><Clock size={9} /> HN: {fmtDt(asgn.due_at)}</span>
                            <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#2563eb', fontWeight: 700 }}>Xem chi tiết →</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px 12px', borderTop: '1px solid rgba(37,99,235,0.05)', flexWrap: 'wrap' }}>
                      {isConfirmed && (
                        <button onClick={() => setAssigningExam(exam)} disabled={!!loadingDetail || !!deletingId} className="se-action-btn"
                          style={{ background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', color: 'white', boxShadow: '0 2px 8px rgba(37,99,235,0.25)' }}>
                          <Send size={11} /> Giao bài
                        </button>
                      )}
                      <button
                        onClick={() => asgn ? setViewingAssignId(asgn.id) : setAssigningExam(exam)}
                        disabled={!!loadingDetail || !!deletingId} className="se-action-btn"
                        style={{ background: 'rgba(37,99,235,0.07)', border: '1px solid rgba(37,99,235,0.18)', color: '#1e3a8a' }}>
                        <Pencil size={11} /> {asgn ? 'Bài giao' : 'Chỉnh sửa'}
                      </button>
                      <div style={{ flex: 1 }} />
                      <button onClick={() => handleViewDetail(exam)} disabled={!!loadingDetail || !!deletingId} className="se-action-btn"
                        style={{ background: 'rgba(30,58,138,0.06)', border: '1px solid rgba(30,58,138,0.12)', color: '#1e3a8a' }}>
                        {loadingDetail === exam.id ? <Loader2 size={11} style={{ animation: 'se-spin 1s linear infinite' }} /> : <Eye size={11} />} Xem đề
                      </button>
                      <button onClick={() => handleDelete(exam.id)} disabled={deletingId === exam.id || !!loadingDetail} className="se-action-btn"
                        style={{ background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.13)', color: '#dc2626' }}>
                        {deletingId === exam.id ? <Loader2 size={11} style={{ animation: 'se-spin 1s linear infinite' }} /> : <Trash2 size={11} />} Xóa
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Exam detail modal */}
      {examParam && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '0' }}>
          {/* Backdrop */}
          <div onClick={closeDetail} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }} />
          {/* Panel */}
          <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 740, height: '100dvh', background: 'white', display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 40px rgba(15,23,42,0.3)', overflowY: 'auto' }}>
            {loadingDetail ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#64748b', fontSize: '0.82rem' }}>
                <Loader2 size={20} color="#2563eb" style={{ animation: 'se-spin 1s linear infinite' }} /> Đang tải đề...
              </div>
            ) : detail ? (
              <DetailView detail={detail} onBack={closeDetail} />
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.82rem' }}>Không tìm thấy đề.</div>
            )}
          </div>
        </div>
      )}

      {/* Assign modal */}
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

      {/* Assignment detail + edit modal */}
      {viewingAssignId && (
        <AssignmentDetailModal
          assignId={viewingAssignId}
          onClose={() => setViewingAssignId(null)}
          onUpdated={patch => setAssignments(prev => prev.map(a => a.id === viewingAssignId ? { ...a, ...patch } : a))}
        />
      )}
    </div>
  );
};

export default TeacherSubjectExams;
