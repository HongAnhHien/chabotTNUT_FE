import { type FC, useMemo, useState } from 'react';
import {
  ClipboardList, Hash, Clock, BookOpen,
  Users, CheckCircle, Send, BarChart2, Trash2, Search,
  Loader2, Plus, ArrowLeft,
} from 'lucide-react';
import type { ISavedExam } from '@/infra/api/interfaces/IChat';
import type { IAssignmentListItem } from '@/infra/api/interfaces/IAssignment';
import { EXAM_TYPE_LABEL, fmtDate, fmtDt } from '../helpers';

type FilterVal = 'all' | 'open' | 'closed';

interface Props {
  exams: ISavedExam[];
  loading: boolean;
  assignByExamId: Record<string, IAssignmentListItem>;
  deletingId: string | null;
  openingChat: boolean;
  maMon: string;
  tenMon: string;
  onViewExam: (exam: ISavedExam) => void;
  onViewAssignment: (assignId: string) => void;
  onAssign: (exam: ISavedExam) => void;
  onDelete: (exam: ISavedExam) => void;
  onOpenChat: () => void;
  onBack: () => void;
}

const ExamListView: FC<Props> = ({
  exams, loading, assignByExamId, deletingId, openingChat,
  maMon, tenMon,
  onViewExam, onViewAssignment, onAssign, onDelete, onOpenChat, onBack,
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterVal>('all');

  const assignments = useMemo(() => Object.values(assignByExamId), [assignByExamId]);

  const statTotal    = exams.length;
  const statOpen     = assignments.filter(a => a.status === 'published').length;
  const statStudents = assignments.reduce((acc, a) => acc + a.student_count, 0);
  const statSubs     = assignments.reduce((acc, a) => acc + a.submitted_count, 0);

  const filtered = useMemo(() => {
    let list = exams;
    if (filter === 'open')   list = list.filter(e => assignByExamId[e.id]?.status === 'published');
    if (filter === 'closed') list = list.filter(e => assignByExamId[e.id]?.status !== 'published');
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(e =>
        (e.ten_mon ?? '').toLowerCase().includes(q) ||
        (e.ma_mon  ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [exams, filter, search, assignByExamId]);

  const FILTER_CHIPS: { id: FilterVal; label: string }[] = [
    { id: 'all',    label: 'Tất cả'  },
    { id: 'open',   label: 'Đang mở' },
    { id: 'closed', label: 'Đã đóng' },
  ];

  const STATS = [
    { label: 'Tổng đề kiểm tra', val: statTotal,    icon: ClipboardList, iconBg: '#eff5ff', iconColor: '#2563eb' },
    { label: 'Đang mở',          val: statOpen,     icon: Clock,         iconBg: '#ecfdf3', iconColor: '#16a34a' },
    { label: 'Học sinh',         val: statStudents, icon: Users,         iconBg: '#eff5ff', iconColor: '#2563eb' },
    { label: 'Lượt đã nộp',      val: statSubs,     icon: CheckCircle,   iconBg: '#eff5ff', iconColor: '#2563eb' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>

      {/* ─── Page header band ─────────────────────────────── */}
      <div className="ex-list-hdr">
        <div className="ex-list-hdr-row">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 6, flexWrap: 'wrap' }}>
              <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit', fontSize: 12, fontWeight: 600, padding: 0 }}>
                <ArrowLeft size={13} /> Môn học
              </button>
              <span style={{ color: '#cbd5e1' }}>›</span>
              <span style={{ color: '#2563eb', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '40vw' }}>{tenMon ?? maMon}</span>
            </div>
            <h1 className="ex-list-hdr-title">Đề kiểm tra</h1>
          </div>
          <button
            onClick={onOpenChat}
            disabled={openingChat}
            className="ex-btn primary"
            style={{ flexShrink: 0 }}
          >
            {openingChat
              ? <><Loader2 size={16} style={{ animation: 'ex-spin 1s linear infinite' }} /> Đang mở...</>
              : <><Plus size={17} /> Tạo đề mới</>}
          </button>
        </div>
      </div>

      {/* ─── Stats band ───────────────────────────────────── */}
      {!loading && exams.length > 0 && (
        <div className="ex-list-hdr" style={{ background: 'rgba(255,255,255,.7)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(231,236,243,.8)', boxShadow: 'none', borderTop: 'none' }}>
          <div>
            <div className="ex-stats-grid" style={{ marginBottom: 0 }}>
              {STATS.map(({ label, val, icon: Icon, iconBg, iconColor }) => (
                <div key={label} className="ex-stat-card">
                  <div style={{ width: 46, height: 46, borderRadius: 12, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor, flexShrink: 0 }}>
                    <Icon size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1, color: '#0f172a' }}>{val}</div>
                    <div style={{ fontSize: 12.5, color: '#64748b', fontWeight: 500, marginTop: 4 }}>{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Main content ─────────────────────────────────── */}
      <div className="ex-list-content">
        <div>

          {/* Search + filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
              <Search size={17} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tìm đề kiểm tra theo tên..."
                style={{ width: '100%', height: 46, border: '1px solid #e7ecf3', background: '#fff', borderRadius: 13, padding: '0 16px 0 42px', fontFamily: 'inherit', fontSize: 14, color: '#334155', outline: 'none', boxSizing: 'border-box', boxShadow: '0 1px 4px rgba(15,23,42,.04)' }}
                onFocus={e => { e.target.style.borderColor = '#93c5fd'; e.target.style.boxShadow = '0 0 0 3px rgba(147,197,253,.2)'; }}
                onBlur={e  => { e.target.style.borderColor = '#e7ecf3'; e.target.style.boxShadow = '0 1px 4px rgba(15,23,42,.04)'; }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {FILTER_CHIPS.map(c => (
                <button key={c.id} className={`ex-chip ${filter === c.id ? 'on' : 'off'}`} onClick={() => setFilter(c.id)}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[1, 2, 3].map(i => <div key={i} className="ex-skeleton" style={{ height: 200, animationDelay: `${i * 0.1}s` }} />)}
            </div>
          ) : exams.length === 0 ? (
            <div style={{ background: '#fff', border: '1px dashed #d7e0ec', borderRadius: 18, padding: '56px', textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: '#cbd5e1' }}>
                <ClipboardList size={30} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#475569' }}>Chưa có đề kiểm tra nào</div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 5 }}>Sử dụng chatbot TAI để tạo đề mới</div>
              <button onClick={onOpenChat} disabled={openingChat} className="ex-btn primary" style={{ marginTop: 14 }}>
                {openingChat ? 'Đang mở...' : 'Mở chatbot TAI'}
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ background: '#fff', border: '1px dashed #d7e0ec', borderRadius: 18, padding: '56px', textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#475569' }}>Không có đề kiểm tra phù hợp</div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 5 }}>Thử đổi bộ lọc hoặc từ khoá tìm kiếm.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {filtered.map((exam, idx) => {
                const isConfirmed = exam.status === 'confirmed';
                const asgn   = assignByExamId[exam.id];
                const isOpen = asgn?.status === 'published';
                const pct    = asgn?.student_count ? Math.round((asgn.submitted_count / asgn.student_count) * 100) : 0;

                return (
                  <div key={exam.id} className="ex-card" style={{ animationDelay: `${idx * 0.04}s` }}>

                    {/* Header row */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 15 }}>
                      <div
                        onClick={() => onViewExam(exam)}
                        style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg,#eff5ff,#dce9ff)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}
                      >
                        <ClipboardList size={26} />
                      </div>

                      <div style={{ minWidth: 0, flex: 1 }}>
                        {/* Title + confirmed */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <div
                            onClick={() => onViewExam(exam)}
                            style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', letterSpacing: -.2, cursor: 'pointer', transition: 'color .13s' }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#2563eb')}
                            onMouseLeave={e => (e.currentTarget.style.color = '#0f172a')}
                          >
                            {exam.ten_mon || exam.ma_mon || '—'}
                          </div>
                          {isConfirmed && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: '#ecfdf3', color: '#16a34a' }}>
                              ✓ Đã xác nhận
                            </span>
                          )}
                        </div>

                        {/* Badges */}
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 11 }}>
                          {exam.exam_type && (
                            <span className="ex-badge" style={{ background: '#eff5ff', color: '#2563eb' }}>
                              <BookOpen size={13} />{EXAM_TYPE_LABEL[exam.exam_type] ?? exam.exam_type}
                            </span>
                          )}
                          {exam.question_count != null && (
                            <span className="ex-badge" style={{ background: '#f1f5f9', color: '#475569' }}>
                              <Hash size={13} />{exam.question_count} câu
                            </span>
                          )}
                          {exam.time_limit != null && (
                            <span className="ex-badge" style={{ background: '#f1f5f9', color: '#475569' }}>
                              <Clock size={13} />{exam.time_limit} phút
                            </span>
                          )}
                          {exam.cua_toi === false && exam.nguoi_tao && (
                            <span className="ex-badge" style={{ background: '#fff7ed', color: '#c2410c' }}>Tạo bởi {exam.nguoi_tao}</span>
                          )}
                          {(exam.chapters ?? []).length > 0 && (
                            <span className="ex-badge" style={{ background: '#f1f5f9', color: '#475569' }}>
                              <BookOpen size={13} />{(exam.chapters ?? []).length} chương
                            </span>
                          )}
                          <span style={{ alignSelf: 'center', fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
                            Tạo {fmtDate(exam.created_at)}
                          </span>
                        </div>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => onDelete(exam)}
                        disabled={deletingId === exam.id}
                        title="Xóa"
                        style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 10, border: '1px solid #e7ecf3', background: '#fff', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .13s' }}
                        onMouseEnter={e => { const b = e.currentTarget; b.style.background = '#fef2f2'; b.style.color = '#dc2626'; b.style.borderColor = '#fecaca'; }}
                        onMouseLeave={e => { const b = e.currentTarget; b.style.background = '#fff'; b.style.color = '#94a3b8'; b.style.borderColor = '#e7ecf3'; }}
                      >
                        {deletingId === exam.id
                          ? <Loader2 size={15} style={{ animation: 'ex-spin 1s linear infinite' }} />
                          : <Trash2 size={15} />}
                      </button>
                    </div>

                    {/* Assignment strip */}
                    {asgn && (
                      <div className="ex-strip">
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 700,
                          padding: '5px 12px', borderRadius: 999,
                          background: isOpen ? '#ecfdf3' : '#f1f5f9',
                          color: isOpen ? '#16a34a' : '#64748b',
                        }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor' }} />
                          {isOpen ? 'Đang mở' : 'Đã đóng'}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#475569', fontWeight: 500 }}>
                          <Users size={15} color="#94a3b8" />
                          <b style={{ color: '#0f172a' }}>{asgn.student_count}</b> học sinh
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#475569', fontWeight: 500 }}>
                          <CheckCircle size={15} color="#94a3b8" />
                          <b style={{ color: '#0f172a' }}>{asgn.submitted_count}/{asgn.student_count}</b> đã nộp
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#475569', fontWeight: 500 }}>
                          <Clock size={15} color="#94a3b8" />
                          Hạn nộp <b style={{ color: '#0f172a' }}>{fmtDt(asgn.due_at)}</b>
                        </span>
                        <div style={{ marginLeft: 'auto', minWidth: 140, display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ flex: 1, height: 7, borderRadius: 999, background: '#e7ecf3', overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#2563eb,#3b82f6)', width: `${pct}%`, transition: 'width .4s ease' }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#2563eb' }}>{pct}%</span>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="ex-card-actions">
                      {isConfirmed && (
                        <button onClick={() => onAssign(exam)} className="ex-btn primary">
                          <Send size={15} /> Giao bài
                        </button>
                      )}
                      {asgn && (
                        <button onClick={() => onViewAssignment(asgn.id)} className="ex-btn outline-blue">
                          <BarChart2 size={15} /> Bài giao &amp; kết quả
                        </button>
                      )}
                      <button onClick={() => onViewExam(exam)} className="ex-btn outline-gray" style={{ marginLeft: 'auto' }}>
                        <ClipboardList size={15} /> Xem đề
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamListView;
