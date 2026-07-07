import { type FC, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  Loader2, Search, ChevronLeft, Trash2, Bell, UserPlus,
  Pencil, Save, Eye, Check, Settings, X, ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import TeacherApi from '@/infra/teacher/teacher_api';
import type { IAssignmentDetail, IAssignmentStudentItem } from '@/infra/api/interfaces/IAssignment';
import CSS from './assignments.styles';
import StudentAnswerView from './StudentAnswerView';
import { fmtDt, toInput, toApiDate, initials, statusPill, studentStatusMeta, scoreColor } from './helpers';

type RosterTab = 'all' | 'submitted' | 'in_progress' | 'not_started';
type SortKey   = 'name' | 'status' | 'score' | 'time';

const STATUS_RANK: Record<IAssignmentStudentItem['status'], number> = { submitted: 0, in_progress: 1, not_started: 2 };

const ROSTER_TABS: { key: RosterTab; label: string }[] = [
  { key: 'all',          label: 'Tất cả' },
  { key: 'submitted',    label: 'Đã nộp' },
  { key: 'in_progress',  label: 'Đang làm' },
  { key: 'not_started',  label: 'Chưa làm' },
];

// ── Edit form (left rail) ──────────────────────────────
interface EditState {
  title: string;
  available_from: string;
  due_at: string;
  status: 'published' | 'closed';
}

const EditPanel: FC<{
  detail: IAssignmentDetail;
  onSaved: (updated: Partial<IAssignmentDetail>) => void;
}> = ({ detail, onSaved }) => {
  const [form, setForm] = useState<EditState>({
    title:          detail.title ?? '',
    available_from: toInput(detail.available_from),
    due_at:         toInput(detail.due_at),
    status:         (detail.status as 'published' | 'closed') ?? 'published',
  });
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof EditState>(k: K, v: EditState[K]) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.available_from) { toast.error('Chưa nhập ngày mở bài.'); return; }
    if (!form.due_at)         { toast.error('Chưa nhập hạn nộp.'); return; }
    if (new Date(form.due_at) <= new Date(form.available_from)) {
      toast.error('Hạn nộp phải sau ngày mở bài.'); return;
    }

    setSaving(true);
    try {
      const r = await TeacherApi.updateAssignment(detail.id, {
        title:          form.title.trim() || undefined,
        available_from: toApiDate(form.available_from),
        due_at:         toApiDate(form.due_at),
        status:         form.status,
      });
      if (r.success) {
        toast.success('Đã lưu thay đổi bài giao.');
        onSaved({
          title:          form.title.trim(),
          available_from: toApiDate(form.available_from),
          due_at:         toApiDate(form.due_at),
          status:         form.status,
        });
      } else {
        toast.error(r.message ?? 'Cập nhật thất bại.');
      }
    } catch (e: unknown) {
      const data = (e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
      const msg = data?.errors ? Object.values(data.errors).flat()[0] : data?.message;
      toast.error(msg ?? 'Cập nhật thất bại. Vui lòng thử lại.', { duration: 5000 });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="as-rail-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Pencil size={16} color="#2563eb" />
        <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Chỉnh sửa bài giao</div>
      </div>

      <label className="as-field-label">Tiêu đề</label>
      <input className="as-input" value={form.title} onChange={e => set('title', e.target.value)} />

      <label className="as-field-label">Ngày mở bài</label>
      <input type="datetime-local" className="as-input" value={form.available_from} onChange={e => set('available_from', e.target.value)} />

      <label className="as-field-label">Hạn nộp</label>
      <input type="datetime-local" className="as-input" value={form.due_at} onChange={e => set('due_at', e.target.value)} />

      <label className="as-field-label" style={{ marginBottom: 8 }}>Trạng thái</label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginBottom: 14 }}>
        <button className="as-seg" onClick={() => set('status', 'published')}
          style={{ borderColor: form.status === 'published' ? '#16a34a' : '#e7ecf3', background: form.status === 'published' ? '#f0fdf4' : '#fff', color: form.status === 'published' ? '#15803d' : '#64748b' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a' }} />Đang mở
        </button>
        <button className="as-seg" onClick={() => set('status', 'closed')}
          style={{ borderColor: form.status === 'closed' ? '#dc2626' : '#e7ecf3', background: form.status === 'closed' ? '#fef2f2' : '#fff', color: form.status === 'closed' ? '#dc2626' : '#64748b' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626' }} />Đã đóng
        </button>
      </div>

      <button className="as-btn primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 size={16} style={{ animation: 'as-spin 1s linear infinite' }} /> : <Save size={16} />}
        {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
      </button>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────
const TeacherAssignmentDetail: FC = () => {
  const { id }                  = useParams<{ id: string }>();
  const navigate                = useNavigate();
  const [detail,    setDetail]  = useState<IAssignmentDetail | null>(null);
  const [loading,   setLoading] = useState(true);
  const [deleting,  setDeleting] = useState(false);
  const [remindingAll, setRemindingAll] = useState(false);
  const [remindingCode, setRemindingCode] = useState<string | null>(null);
  const [remindedCodes, setRemindedCodes] = useState<Set<string>>(new Set());

  const [selectedStudent, setSelectedStudent] = useState<IAssignmentStudentItem | null>(null);
  const [rosterTab, setRosterTab] = useState<RosterTab>('all');
  const [rosterDropdownOpen, setRosterDropdownOpen] = useState(false);
  const [search,    setSearch]    = useState('');
  const [sortKey,   setSortKey]   = useState<SortKey>('name');
  const [sortDir,   setSortDir]   = useState<1 | -1>(1);

  const [sidebarOpen,    setSidebarOpen]    = useState(false);
  const [closingSidebar, setClosingSidebar] = useState(false);
  const handleCloseSidebar = () => {
    setClosingSidebar(true);
    setTimeout(() => { setSidebarOpen(false); setClosingSidebar(false); }, 240);
  };

  useEffect(() => {
    if (!id) return;
    TeacherApi.getAssignmentDetail(id)
      .then(r => {
        setDetail(r.data);
        // Khôi phục trạng thái "đã nhắc" từ backend nếu có (xem docs/backend-todo.md)
        const reminded = r.data.students.filter(s => s.last_reminded_at).map(s => s.student_code);
        if (reminded.length) setRemindedCodes(new Set(reminded));
      })
      .catch(() => toast.error('Không thể tải chi tiết bài giao.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm('Xóa bài giao và toàn bộ bài nộp của học sinh?')) return;
    setDeleting(true);
    try {
      const r = await TeacherApi.deleteAssignment(id);
      if (r.success) { toast.success('Đã xóa bài giao.'); navigate('/teacher/assignments'); }
      else toast.error(r.message ?? 'Xóa thất bại.');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Xóa thất bại. Vui lòng thử lại.');
    } finally {
      setDeleting(false);
    }
  };

  const handleRemindAll = async () => {
    if (!id || !detail) return;
    setRemindingAll(true);
    try {
      const r = await TeacherApi.remindAllPending(id);
      toast.success(r.message || 'Đã gửi nhắc nhở.');
      setRemindedCodes(prev => {
        const next = new Set(prev);
        detail.students.filter(s => s.status === 'not_started').forEach(s => next.add(s.student_code));
        return next;
      });
    } catch { toast.error('Không thể gửi nhắc nhở.'); }
    finally { setRemindingAll(false); }
  };

  const handleRemindOne = async (studentCode: string, name: string) => {
    if (!id) return;
    setRemindingCode(studentCode);
    try {
      const r = await TeacherApi.remindStudent(id, studentCode);
      toast.success(r.message || `Đã nhắc nhở ${name}.`);
      setRemindedCodes(prev => new Set(prev).add(studentCode));
    } catch { toast.error('Không thể gửi nhắc nhở.'); }
    finally { setRemindingCode(null); }
  };

  const roster = useMemo(() => {
    if (!detail) return [];
    let rows = detail.students;
    if (rosterTab !== 'all') rows = rows.filter(s => s.status === rosterTab);
    const q = search.trim().toLowerCase();
    if (q) rows = rows.filter(s => s.name.toLowerCase().includes(q) || s.student_code.toLowerCase().includes(q));
    return rows.slice().sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name')   cmp = a.name.localeCompare(b.name);
      if (sortKey === 'status') cmp = STATUS_RANK[a.status] - STATUS_RANK[b.status];
      if (sortKey === 'score')  cmp = (a.score ?? -1) - (b.score ?? -1);
      if (sortKey === 'time')   cmp = (a.submitted_at ?? '').localeCompare(b.submitted_at ?? '');
      return cmp * sortDir;
    });
  }, [detail, rosterTab, search, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => (d === 1 ? -1 : 1));
    else { setSortKey(key); setSortDir(1); }
  };
  const arrow = (key: SortKey) => sortKey === key ? (sortDir === 1 ? '↑' : '↓') : '';

  if (loading) {
    return (
      <div style={{ minHeight: '100%', background: 'linear-gradient(160deg,#eef4ff 0%,#e0eaff 40%,#f0f9ff 100%)' }}>
        <style>{CSS}</style>
        <div style={{ textAlign: 'center', padding: '5rem' }}>
          <Loader2 size={28} color="#2563eb" style={{ animation: 'as-spin 1s linear infinite', margin: '0 auto 10px', display: 'block' }} />
          <div style={{ fontSize: 13, color: '#94a3b8' }}>Đang tải...</div>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div style={{ minHeight: '100%', background: 'linear-gradient(160deg,#eef4ff 0%,#e0eaff 40%,#f0f9ff 100%)' }}>
        <style>{CSS}</style>
        <div style={{ textAlign: 'center', padding: '5rem', color: '#94a3b8' }}>Không tìm thấy bài giao.</div>
      </div>
    );
  }

  const total = detail.stats.total;
  const done  = detail.stats.submitted;
  const doing = detail.stats.in_progress;
  const todo  = detail.stats.not_started;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
  const pill  = statusPill(detail.status);
  const notStartedStudents = detail.students.filter(s => s.status === 'not_started');
  const allTodoReminded = todo > 0 && notStartedStudents.every(s => remindedCodes.has(s.student_code));

  const sidebarContent = (
    <>
      <div className="as-rail-card">
        <div className="as-rail-label">Thao tác nhanh</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          <button className="as-btn outline-amber" style={{ width: '100%' }} onClick={handleRemindAll} disabled={remindingAll || todo === 0 || allTodoReminded}>
            {remindingAll ? <Loader2 size={16} style={{ animation: 'as-spin 1s linear infinite' }} /> : <Bell size={16} />}
            {allTodoReminded ? 'Đã nhắc toàn bộ' : `Nhắc ${todo} HS chưa làm`}
          </button>
          <button className="as-btn outline-blue" style={{ width: '100%' }} onClick={() => navigate(`/teacher/subjects/${detail.ma_mon}/exams`)}>
            <UserPlus size={16} /> Giao thêm học sinh
          </button>
          <button className="as-btn outline-red" style={{ width: '100%' }} onClick={handleDelete} disabled={deleting}>
            {deleting ? <Loader2 size={16} style={{ animation: 'as-spin 1s linear infinite' }} /> : <Trash2 size={16} />}
            Xóa bài giao
          </button>
        </div>
      </div>

      <EditPanel detail={detail} onSaved={updated => setDetail(p => p ? { ...p, ...updated } : p)} />
    </>
  );

  return (
    <div style={{ minHeight: '100%', background: 'linear-gradient(160deg,#eef4ff 0%,#e0eaff 40%,#f0f9ff 100%)', fontFamily: "'Be Vietnam Pro',system-ui,sans-serif" }}>
      <style>{CSS}</style>

      <div className="as-list-content">
        {selectedStudent ? (
          <StudentAnswerView
            assignmentId={detail.id}
            examTitle={detail.title}
            studentCode={selectedStudent.student_code}
            studentName={selectedStudent.name}
            onBack={() => setSelectedStudent(null)}
          />
        ) : (
          <>
            <button className="as-back-link" onClick={() => navigate('/teacher/assignments')}>
              <ChevronLeft size={14} /> Bài kiểm tra đã giao
            </button>

            {/* Summary card */}
            <div className="as-summary-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: '-.3px', color: '#0f172a' }}>{detail.title}</h1>
                <span style={{ fontFamily: 'monospace', fontSize: 12.5, fontWeight: 600, color: '#2563eb', background: '#eff5ff', padding: '3px 9px', borderRadius: 8 }}>{detail.ma_mon}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, padding: '4px 11px', borderRadius: 999, background: pill.background, color: pill.color }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />{pill.label}
                </span>
                <span style={{ fontSize: 13, color: '#64748b' }}>{total} học sinh · Hạn {fmtDt(detail.due_at)}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ display: 'flex', height: 11, borderRadius: 999, overflow: 'hidden', background: '#eef2f7' }}>
                    <div style={{ width: `${total ? (done / total) * 100 : 0}%`, background: '#16a34a' }} />
                    <div style={{ width: `${total ? (doing / total) * 100 : 0}%`, background: '#2563eb' }} />
                    <div style={{ width: `${total ? (todo / total) * 100 : 0}%`, background: '#cbd5e1' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: '#16a34a' }} /><span style={{ fontSize: 13, color: '#475569' }}><b style={{ color: '#15803d' }}>{done}</b> đã nộp</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: '#2563eb' }} /><span style={{ fontSize: 13, color: '#475569' }}><b style={{ color: '#1d4ed8' }}>{doing}</b> đang làm</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: '#cbd5e1' }} /><span style={{ fontSize: 13, color: '#475569' }}><b>{todo}</b> chưa làm</span></div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#2563eb' }}>{pct}%</div>
                </div>
              </div>
            </div>

            <div className="as-detail-grid">
              {/* Left rail — sticky on desktop, hidden on mobile (see drawer below) */}
              <div className="as-rail">
                {sidebarContent}
              </div>

              {/* Gradebook */}
              <div className="as-gradebook-card">
                <div className="as-gb-toolbar">
                  <div className="as-gb-search-wrap">
                    <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                    <input className="as-gb-search" placeholder="Tìm học sinh..." value={search} onChange={e => setSearch(e.target.value)} />
                  </div>

                  <div
                    className="as-gb-dropdown"
                    onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setRosterDropdownOpen(false); }}
                    tabIndex={-1}
                  >
                    <button
                      className="as-gb-dropdown-trigger"
                      aria-expanded={rosterDropdownOpen}
                      onClick={() => setRosterDropdownOpen(o => !o)}
                    >
                      <span>{ROSTER_TABS.find(t => t.key === rosterTab)?.label ?? 'Tất cả'}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, padding: '1px 8px', borderRadius: 999, background: '#eff5ff', color: '#2563eb' }}>
                          {roster.length}
                        </span>
                        <ChevronDown size={14} color="#94a3b8" style={{ transition: 'transform .15s', transform: rosterDropdownOpen ? 'rotate(180deg)' : 'none' }} />
                      </span>
                    </button>
                    {rosterDropdownOpen && (
                      <div className="as-gb-dropdown-menu">
                        {ROSTER_TABS.map(t => {
                          const count = t.key === 'all' ? total : t.key === 'submitted' ? done : t.key === 'in_progress' ? doing : todo;
                          return (
                            <div
                              key={t.key}
                              className={`as-gb-dropdown-item ${rosterTab === t.key ? 'active' : ''}`}
                              onMouseDown={() => { setRosterTab(t.key); setRosterDropdownOpen(false); }}
                            >
                              <span>{t.label}</span>
                              <span style={{ fontSize: 11, fontWeight: 800, padding: '1px 8px', borderRadius: 999, background: rosterTab === t.key ? '#dbeafe' : '#f1f5f9', color: rosterTab === t.key ? '#1d4ed8' : '#64748b' }}>
                                {count}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="as-gb-thead">
                  <div data-sort onClick={() => toggleSort('name')}>Học sinh {arrow('name')}</div>
                  <div data-sort onClick={() => toggleSort('status')}>Trạng thái {arrow('status')}</div>
                  <div data-sort onClick={() => toggleSort('score')}>Điểm {arrow('score')}</div>
                  <div data-sort onClick={() => toggleSort('time')}>Nộp lúc {arrow('time')}</div>
                  <div style={{ textAlign: 'right' }}>Thao tác</div>
                </div>

                <div>
                  {roster.length === 0 ? (
                    <div style={{ padding: 44, textAlign: 'center', color: '#94a3b8', fontSize: 13.5 }}>Không có học sinh phù hợp bộ lọc.</div>
                  ) : roster.map(s => {
                    const meta = studentStatusMeta[s.status];
                    return (
                      <div key={s.student_code} className="as-gb-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
                          <span style={{ width: 34, height: 34, borderRadius: 9, background: '#eff5ff', color: '#2563eb', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{initials(s.name)}</span>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{s.student_code}</div>
                          </div>
                        </div>
                        <div>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, padding: '4px 11px', borderRadius: 999, background: meta.bg, color: meta.color, whiteSpace: 'nowrap' }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />{meta.label}
                          </span>
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: scoreColor(s.score, s.total) }}>{s.score ?? '—'}</div>
                        <div style={{ fontSize: 12.5, color: '#64748b' }}>{s.submitted_at ? fmtDt(s.submitted_at) : '—'}</div>
                        <div className="as-gb-actions">
                          {s.status === 'submitted' && (
                            <button className="as-btn outline-blue" style={{ height: 32, padding: '0 12px', fontSize: 12 }} onClick={() => setSelectedStudent(s)}>
                              <Eye size={13} /> Xem
                            </button>
                          )}
                          {s.status === 'not_started' && (
                            remindedCodes.has(s.student_code) ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, padding: '4px 11px', borderRadius: 999, background: '#ecfdf3', color: '#15803d', whiteSpace: 'nowrap' }}>
                                <Check size={12} /> Đã nhắc
                              </span>
                            ) : (
                              <button className="as-btn outline-amber" style={{ height: 32, padding: '0 12px', fontSize: 12 }}
                                onClick={() => handleRemindOne(s.student_code, s.name)} disabled={remindingCode === s.student_code}>
                                {remindingCode === s.student_code ? <Loader2 size={13} style={{ animation: 'as-spin 1s linear infinite' }} /> : <Bell size={13} />} Nhắc
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* FAB — mobile only */}
            <button className="as-rail-fab" onClick={() => setSidebarOpen(true)}>
              <Settings size={17} /> Cài đặt
            </button>

            {/* Sidebar drawer — mobile */}
            {sidebarOpen && (
              <>
                <div
                  className="as-drawer-overlay"
                  onClick={handleCloseSidebar}
                  style={{ animation: `${closingSidebar ? 'as-overlay-out' : 'as-overlay'} .22s ease forwards` }}
                />
                <div
                  className="as-drawer-panel"
                  style={{ animation: `${closingSidebar ? 'as-drawer-out' : 'as-drawer-in'} .24s cubic-bezier(.2,.8,.2,1) forwards` }}
                >
                  <div className="as-drawer-head">
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Cài đặt bài giao</span>
                    <button className="as-drawer-close" onClick={handleCloseSidebar}>
                      <X size={15} />
                    </button>
                  </div>
                  <div className="as-drawer-body">
                    {sidebarContent}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TeacherAssignmentDetail;
