import { type FC, useState } from 'react';
import { ChevronLeft, Users, CheckCircle, Clock, AlertCircle, Search, User, UserPlus, Loader2, Save, Settings, X, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import TeacherApi from '@/infra/teacher/teacher_api';
import type { IAssignmentDetail, IAssignmentStudentItem, IAssignmentListItem } from '@/infra/api/interfaces/IAssignment';
import { toInput, toApiDate, fmtDt } from '../helpers';

type RosterFilter = 'all' | 'submitted' | 'in_progress' | 'not_started';

const stuBadge = (st: IAssignmentStudentItem['status']) =>
  st === 'submitted'   ? { label: 'Đã nộp',   bg: '#ecfdf3', color: '#16a34a' } :
  st === 'in_progress' ? { label: 'Đang làm', bg: '#eff5ff', color: '#2563eb' } :
                         { label: 'Chưa làm', bg: '#f1f5f9', color: '#64748b' };

interface Props {
  detail: IAssignmentDetail | null;
  loading: boolean;
  onBack: () => void;
  onAssignMore?: () => void;
  onUpdated: (patch: Partial<IAssignmentListItem>) => void;
}

const AssignmentView: FC<Props> = ({ detail, loading, onBack, onAssignMore, onUpdated }) => {
  const [rosterFilter, setRosterFilter] = useState<RosterFilter>('all');
  const [search, setSearch]             = useState('');
  const [eFrom, setEFrom]               = useState(() => toInput(detail?.available_from));
  const [eDue, setEDue]                 = useState(() => toInput(detail?.due_at));
  const [eStatus, setEStatus]           = useState<'published' | 'closed'>(() =>
    (detail?.status as 'published' | 'closed') ?? 'published');
  const [saving, setSaving]             = useState(false);
  const [sidebarOpen, setSidebarOpen]       = useState(false);
  const [dropdownOpen, setDropdownOpen]     = useState(false);
  const [closingSidebar, setClosingSidebar] = useState(false);

  const handleCloseSidebar = () => {
    setClosingSidebar(true);
    setTimeout(() => { setSidebarOpen(false); setClosingSidebar(false); }, 240);
  };

  const stats = detail?.stats;

  const filtered = (detail?.students ?? []).filter(s => {
    if (rosterFilter !== 'all' && s.status !== rosterFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.student_code.toLowerCase().includes(q);
  });

  const handleSave = () => {
    if (!detail) return;
    if (!eFrom) { toast.error('Chưa nhập ngày mở bài.'); return; }
    if (!eDue)  { toast.error('Chưa nhập hạn nộp.'); return; }
    if (new Date(eDue) <= new Date(eFrom)) { toast.error('Hạn nộp phải sau ngày mở.'); return; }
    setSaving(true);
    TeacherApi.updateAssignment(detail.id, {
      available_from: toApiDate(eFrom),
      due_at:         toApiDate(eDue),
      status:         eStatus,
    })
      .then(r => {
        if (r.success) {
          toast.success('Đã cập nhật bài giao.');
          onUpdated({ available_from: toApiDate(eFrom), due_at: toApiDate(eDue), status: eStatus });
        } else toast.error(r.message ?? 'Cập nhật thất bại.');
      })
      .catch(() => toast.error('Cập nhật thất bại.'))
      .finally(() => setSaving(false));
  };

  const pct = stats?.total ? Math.round((stats.submitted / stats.total) * 100) : 0;
  const C = 2 * Math.PI * 52;

  const rosterCounts: Record<RosterFilter, number> = {
    all:         stats?.total ?? 0,
    submitted:   stats?.submitted ?? 0,
    in_progress: stats?.in_progress ?? 0,
    not_started: stats?.not_started ?? 0,
  };

  const TABS: { id: RosterFilter; label: string }[] = [
    { id: 'all',         label: 'Tất cả' },
    { id: 'submitted',   label: 'Đã nộp' },
    { id: 'in_progress', label: 'Đang làm' },
    { id: 'not_started', label: 'Chưa làm' },
  ];

  const sidebarContent = (
    <>
      {/* Progress donut */}
      <div style={{ background: '#fff', border: '1px solid #e7ecf3', borderRadius: 18, padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Tiến độ nộp bài</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ position: 'relative', width: 104, height: 104, flexShrink: 0 }}>
            <svg width="104" height="104" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#eef2f7" strokeWidth="13" />
              <circle cx="60" cy="60" r="52" fill="none" stroke="#2563eb" strokeWidth="13"
                strokeLinecap="round"
                strokeDasharray={String(C)}
                strokeDashoffset={C * (1 - pct / 100)}
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{pct}%</div>
              <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>đã nộp</div>
            </div>
          </div>
          <div style={{ flex: 1, fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
            Đã có <b style={{ color: '#16a34a' }}>{stats?.submitted ?? 0}</b> học sinh nộp bài, còn <b style={{ color: '#0f172a' }}>{(stats?.total ?? 0) - (stats?.submitted ?? 0)}</b> chưa hoàn thành.
          </div>
        </div>
      </div>

      {/* Settings form */}
      <div style={{ background: '#fff', border: '1px solid #e7ecf3', borderRadius: 18, padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Cài đặt bài giao</div>

        <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, letterSpacing: .4, color: '#475569', textTransform: 'uppercase', marginBottom: 7 }}>Ngày mở bài</label>
        <input type="datetime-local" value={eFrom} onChange={e => setEFrom(e.target.value)} className="ex-input" style={{ marginBottom: 13 }} />

        <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, letterSpacing: .4, color: '#475569', textTransform: 'uppercase', marginBottom: 7 }}>Hạn nộp</label>
        <input type="datetime-local" value={eDue} onChange={e => setEDue(e.target.value)} className="ex-input" style={{ marginBottom: 15 }} />

        <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, letterSpacing: .4, color: '#475569', textTransform: 'uppercase', marginBottom: 9 }}>Trạng thái</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginBottom: 16 }}>
          {(['published', 'closed'] as const).map(s => {
            const on = eStatus === s;
            const isOpen = s === 'published';
            return (
              <button key={s} onClick={() => setEStatus(s)} style={{
                height: 44, border: `2px solid ${on ? (isOpen ? '#16a34a' : '#dc2626') : '#e7ecf3'}`,
                borderRadius: 12, fontFamily: 'inherit', fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: on ? (isOpen ? '#f0fdf4' : '#fef2f2') : '#fff',
                color: on ? (isOpen ? '#16a34a' : '#dc2626') : '#64748b',
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: isOpen ? '#16a34a' : '#dc2626' }} />
                {isOpen ? 'Đang mở' : 'Đã đóng'}
              </button>
            );
          })}
        </div>

        {detail?.due_at && (
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 14 }}>
            Hạn hiện tại: <span style={{ color: '#64748b', fontWeight: 600 }}>{fmtDt(detail.due_at)}</span>
          </div>
        )}

        <button onClick={handleSave} disabled={saving} style={{
          width: '100%', height: 44, border: 'none', borderRadius: 12,
          background: saving ? 'rgba(37,99,235,.3)' : 'linear-gradient(135deg,#2563eb,#1d4ed8)',
          color: '#fff', fontWeight: 700, fontSize: 14, fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 6px 15px rgba(37,99,235,.24)',
        }}>
          {saving
            ? <><Loader2 size={16} style={{ animation: 'ex-spin 1s linear infinite' }} /> Đang lưu...</>
            : <><Save size={16} /> Lưu thay đổi</>}
        </button>
      </div>
    </>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>

      {/* Sub header */}
      <div className="ex-sub-header">
        {/* Left: back + divider + title */}
        <div className="ex-sub-left">
          <button onClick={onBack} className="ex-btn outline-gray" style={{ height: 40, padding: '0 15px', flexShrink: 0 }}>
            <ChevronLeft size={16} /> Đề kiểm tra
          </button>
          <div className="ex-sub-divider" />
          <div className="ex-sub-left-text">
            <div className="ex-sub-title">{detail?.title ?? '—'}</div>
            <div className="ex-sub-subtitle">Bài giao &amp; kết quả nộp</div>
          </div>
        </div>
        {/* Right: status pill + buttons */}
        <div className="ex-sub-right">
          {detail && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 700,
              padding: '5px 12px', borderRadius: 999,
              background: detail.status === 'published' ? '#ecfdf3' : '#f1f5f9',
              color: detail.status === 'published' ? '#16a34a' : '#64748b',
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor' }} />
              {detail.status === 'published' ? 'Đang mở' : 'Đã đóng'}
            </span>
          )}
          {onAssignMore && (
            <button onClick={onAssignMore} className="ex-btn primary" style={{ height: 40, padding: '0 17px' }}>
              <UserPlus size={15} /> Giao thêm HS
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="ex-main-pad" style={{ flex: 1 }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[1, 2, 3].map(i => <div key={i} className="ex-skeleton" style={{ height: 120, animationDelay: `${i * 0.1}s` }} />)}
          </div>
        ) : !detail ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#94a3b8', fontSize: '0.9rem' }}>Không tìm thấy bài giao.</div>
        ) : (
          <div style={{ animation: 'ex-fade .25s ease' }}>

            {/* Compact stat bar */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
              {[
                { label: 'Tổng học sinh', val: stats?.total       ?? 0, icon: Users,       bg: '#eff5ff', color: '#2563eb' },
                { label: 'Đã nộp bài',   val: stats?.submitted   ?? 0, icon: CheckCircle, bg: '#f0fdf4', color: '#16a34a' },
                { label: 'Đang làm bài', val: stats?.in_progress ?? 0, icon: Clock,       bg: '#eff5ff', color: '#2563eb' },
                { label: 'Chưa làm bài', val: stats?.not_started ?? 0, icon: AlertCircle, bg: '#f1f5f9', color: '#94a3b8' },
              ].map(({ label, val, icon: Icon, bg, color }) => (
                <div key={label} style={{
                  flex: '1 1 160px', display: 'flex', alignItems: 'center', gap: 11,
                  background: '#fff', border: '1px solid #e7ecf3', borderRadius: 14,
                  padding: '12px 16px',
                }}>
                  <span style={{ width: 34, height: 34, borderRadius: 9, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={17} />
                  </span>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{val}</div>
                    <div style={{ fontSize: 11.5, color: '#64748b', fontWeight: 500, marginTop: 3 }}>{label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Main 2-col grid */}
            <div className="ex-assign-grid">

              {/* Roster */}
              <div style={{ background: '#fff', border: '1px solid #e7ecf3', borderRadius: 18 }}>
                <div className="ex-filter-bar" style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', borderRadius: '18px 18px 0 0' }}>
                  {/* Search */}
                  <div style={{ position: 'relative', minWidth: 0 }}>
                    <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Tìm học sinh..."
                      className="ex-input"
                      style={{ paddingLeft: 34, height: 38 }}
                    />
                  </div>
                  {/* Custom filter dropdown */}
                  <div className="ex-dropdown" onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDropdownOpen(false); }} tabIndex={-1}>
                    <button
                      className="ex-dropdown-trigger"
                      aria-expanded={dropdownOpen}
                      onClick={() => setDropdownOpen(o => !o)}
                    >
                      <span>{TABS.find(t => t.id === rosterFilter)?.label ?? 'Tất cả'}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, padding: '1px 8px', borderRadius: 999, background: '#eff5ff', color: '#2563eb' }}>
                          {rosterCounts[rosterFilter]}
                        </span>
                        <ChevronDown size={14} color="#94a3b8" style={{ transition: 'transform .15s', transform: dropdownOpen ? 'rotate(180deg)' : 'none' }} />
                      </span>
                    </button>
                    {dropdownOpen && (
                      <div className="ex-dropdown-menu">
                        {TABS.map(t => (
                          <div
                            key={t.id}
                            className={`ex-dropdown-item ${rosterFilter === t.id ? 'active' : ''}`}
                            onMouseDown={() => { setRosterFilter(t.id); setDropdownOpen(false); }}
                          >
                            <span>{t.label}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 9px', borderRadius: 999, background: rosterFilter === t.id ? '#dbeafe' : '#f1f5f9', color: rosterFilter === t.id ? '#1d4ed8' : '#64748b' }}>
                              {rosterCounts[t.id]}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  {filtered.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 13.5 }}>
                      Không có học sinh phù hợp.
                    </div>
                  ) : filtered.map(s => {
                    const b = stuBadge(s.status);
                    const pctScore = s.score !== null && s.total ? Math.round((s.score / s.total) * 100) : null;
                    return (
                      <div key={s.student_code} className="ex-roster-row">
                        <span style={{ width: 36, height: 36, borderRadius: 10, background: '#eff5ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <User size={15} />
                        </span>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{s.student_code}</div>
                        </div>
                        {s.status === 'submitted' && s.score !== null && s.total ? (
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 800, lineHeight: 1, color: pctScore !== null && pctScore >= 50 ? '#16a34a' : '#dc2626' }}>
                              {s.score}<span style={{ fontSize: 10, color: '#94a3b8' }}>/{s.total}</span>
                            </div>
                            {pctScore !== null && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{pctScore}%</div>}
                          </div>
                        ) : null}
                        <span style={{ fontSize: 11.5, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: b.bg, color: b.color, flexShrink: 0 }}>
                          {b.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right rail — desktop only (hidden on mobile via CSS) */}
              <div className="ex-assign-rail">
                {sidebarContent}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FAB — mobile only */}
      <button className="ex-sidebar-fab" onClick={() => setSidebarOpen(true)}>
        <Settings size={17} /> Cài đặt
      </button>

      {/* Sidebar drawer — mobile */}
      {sidebarOpen && (
        <>
          <div
            onClick={handleCloseSidebar}
            style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(15,23,42,.45)', backdropFilter: 'blur(2px)', animation: `${closingSidebar ? 'ex-overlay-out' : 'ex-overlay'} .22s ease forwards` }}
          />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0,
            width: 'min(380px,100vw)', background: '#fff', zIndex: 201,
            display: 'flex', flexDirection: 'column',
            boxShadow: '-16px 0 40px rgba(15,23,42,.18)',
            animation: `${closingSidebar ? 'ex-sidebar-out' : 'ex-sidebar-in'} .24s cubic-bezier(.2,.8,.2,1) forwards`,
            fontFamily: "'Be Vietnam Pro',system-ui,sans-serif",
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Cài đặt bài giao</span>
              <button onClick={handleCloseSidebar} style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid #e7ecf3', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                <X size={15} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {sidebarContent}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AssignmentView;
