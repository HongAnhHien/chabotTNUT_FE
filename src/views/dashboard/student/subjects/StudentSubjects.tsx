import { type FC, useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  GraduationCap, ChevronDown, Calendar,
  Loader2, ClipboardList, BookOpen, User, MapPin, FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import StudentApi from '@/infra/student/student_api';
import type { IStudentSubject, IStudentSemester } from '@/infra/api/interfaces/IStudent';
import type { IStudentAssignmentListItem } from '@/infra/api/interfaces/IAssignment';

// ── CSS ───────────────────────────────────────────────
const CSS = `
  @keyframes ss-fade    { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ss-spin    { to{transform:rotate(360deg)} }
  @keyframes ss-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  @keyframes ss-pop     { 0%{transform:scale(.96);opacity:0} 100%{transform:scale(1);opacity:1} }

  .ss-card {
    background: white;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(30,58,138,0.07);
    transition: box-shadow .22s, transform .22s;
    animation: ss-pop .32s cubic-bezier(.34,1.4,.64,1) both;
    border: 1px solid rgba(30,58,138,0.07);
  }
  .ss-card:hover { box-shadow: 0 12px 36px rgba(30,58,138,0.14); transform: translateY(-3px); }

  .ss-skeleton {
    border-radius: 20px; height: 180px;
    background: linear-gradient(90deg,#f0f4ff 25%,#e8f0fe 50%,#f0f4ff 75%);
    background-size: 200% 100%;
    animation: ss-shimmer 1.4s ease infinite;
  }

  .ss-action-btn {
    flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
    padding: 9px 12px; border-radius: 11px; font-size: 0.78rem; font-weight: 700;
    cursor: pointer; border: none; transition: all .15s; text-decoration: none;
  }
  .ss-action-btn:hover { opacity: .88; transform: translateY(-1px); }

  .ss-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  .ss-container { width: 100%; padding: 0 24px; box-sizing: border-box; }
  .ss-content   { padding: 20px 24px; }

  .ss-page-title   { font-size: 1.1rem; }
  .ss-page-subtitle{ font-size: 0.72rem; }

  .ss-header-row {
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
  }

  @media (max-width: 1024px) {
    .ss-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 640px) {
    .ss-grid        { grid-template-columns: 1fr; gap: 12px; }
    .ss-container   { padding: 0 14px; }
    .ss-content     { padding: 14px; }
    .ss-page-title  { font-size: 0.95rem; }
    .ss-page-subtitle { font-size: 0.7rem; }
    .ss-header-row  { flex-direction: column; align-items: flex-start; gap: 10px; }
    .ss-sem-drop      { width: 100%; }
    .ss-sem-drop-btn  { width: 100%; justify-content: space-between; }
    .ss-sem-drop-panel{ left: 0; right: 0; width: auto; min-width: 0; }
  }
`;

const BLUE = { grad: 'linear-gradient(135deg,#2966EB,#5b8ef5)', shadow: 'rgba(41,102,235,0.35)' };

const getAbbr = (name: string) => {
  const ws = name.split(/\s+/).filter(w => w.length > 1 && /[A-ZÀ-Ỵa-zà-ỵ]/i.test(w[0]));
  if (ws.length >= 2) return (ws[0][0] + ws[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

// ── Assignment badge ───────────────────────────────────
const assignBadge = (list: IStudentAssignmentListItem[]) => {
  if (!list.length) return null;
  const pending   = list.filter(a => a.my_status === 'not_started' && !a.is_overdue);
  const overdue   = list.filter(a => a.my_status === 'not_started' && a.is_overdue);
  const submitted = list.filter(a => a.my_status === 'submitted');
  if (pending.length)
    return { label: `Làm bài${pending.length > 1 ? ` (${pending.length})` : ''}`, grad: 'linear-gradient(135deg,#059669,#10b981)', color: 'white', ids: pending.map(a => a.id) };
  if (overdue.length)
    return { label: `Quá hạn`, grad: 'rgba(220,38,38,0.1)', color: '#dc2626', border: '1.5px solid rgba(220,38,38,0.25)', ids: overdue.map(a => a.id) };
  if (submitted.length)
    return { label: 'Đã nộp ✓', grad: 'rgba(5,150,105,0.08)', color: '#059669', border: '1.5px solid rgba(5,150,105,0.22)', ids: submitted.map(a => a.id) };
  return null;
};

// ── Subject card ──────────────────────────────────────
const SubjectCard: FC<{
  subject: IStudentSubject;
  delay: number;
  assignments: IStudentAssignmentListItem[];
  hocKy: number | null;
}> = ({ subject, delay, assignments, hocKy }) => {
  const navigate = useNavigate();
  const files    = subject.files ?? [];
  const hasFiles = files.length > 0;
  const badge    = assignBadge(assignments);
  const palette  = BLUE;
  const abbr     = getAbbr(subject.ten_mon);

  const handleAssignClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/student/subjects/${subject.ma_mon}?tab=exams${hocKy ? `&hk=${hocKy}` : ''}`);
  };

  return (
    <div className="ss-card" style={{ animationDelay: `${delay}s` }}>
      {/* ── Coloured header strip ── */}
      <div style={{ background: palette.grad, padding: '16px 16px 14px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -24, top: -24, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', right: 24, bottom: -32, width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, position: 'relative' }}>
          <div style={{ flexShrink: 0, width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 14px ${palette.shadow}`, border: '1.5px solid rgba(255,255,255,0.3)' }}>
            <span style={{ fontSize: '1rem', fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>{abbr}</span>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'white', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {subject.ten_mon}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.75)', fontFamily: 'monospace', marginTop: 3, fontWeight: 600 }}>{subject.ma_mon}</div>
          </div>

          <div style={{ flexShrink: 0, background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: '4px 9px', border: '1px solid rgba(255,255,255,0.3)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>{subject.so_tc}</div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.75)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>TC</div>
          </div>
        </div>
      </div>

      {/* ── Info section ── */}
      <div style={{ padding: '12px 16px 14px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', fontWeight: 600, color: hasFiles ? '#2563eb' : '#94a3b8', background: hasFiles ? 'rgba(37,99,235,0.07)' : 'rgba(148,163,184,0.08)', borderRadius: 20, padding: '3px 9px', border: `1px solid ${hasFiles ? 'rgba(37,99,235,0.15)' : 'rgba(148,163,184,0.15)'}` }}>
            <FileText size={9} />
            {hasFiles ? `${files.length} tài liệu` : 'Chưa có tài liệu'}
          </span>
          {subject.gv && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', fontWeight: 600, color: '#7c3aed', background: 'rgba(124,58,237,0.06)', borderRadius: 20, padding: '3px 9px', border: '1px solid rgba(124,58,237,0.14)' }}>
              <User size={9} /> {subject.gv}
            </span>
          )}
          {subject.phong && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', fontWeight: 600, color: '#0891b2', background: 'rgba(8,145,178,0.06)', borderRadius: 20, padding: '3px 9px', border: '1px solid rgba(8,145,178,0.14)' }}>
              <MapPin size={9} /> {subject.phong}
            </span>
          )}
        </div>

        {subject.lich_thi && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', fontWeight: 600, color: '#b45309', background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.18)', borderRadius: 10, padding: '6px 10px', marginBottom: 12 }}>
            <Calendar size={11} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Thi {subject.lich_thi.ky_thi.toLowerCase()}: {subject.lich_thi.ngay_thi} · {subject.lich_thi.gio_bat_dau} · {subject.lich_thi.phong_thi}
            </span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="ss-action-btn"
            onClick={() => navigate(`/student/subjects/${subject.ma_mon}${hocKy ? `?hk=${hocKy}` : ''}`)}
            style={{ background: 'rgba(37,99,235,0.05)', color: '#2563eb', border: '1.5px solid rgba(37,99,235,0.15)' }}
          >
            <BookOpen size={13} />
            Xem chi tiết
          </button>
          {badge && (
            <button
              className="ss-action-btn"
              onClick={handleAssignClick}
              style={{ background: badge.grad, color: badge.color, border: badge.border ?? 'none', boxShadow: badge.color === 'white' ? '0 3px 10px rgba(5,150,105,0.28)' : 'none' }}
            >
              <ClipboardList size={13} />
              {badge.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────
const StudentSubjects: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [semesters,   setSemesters]  = useState<IStudentSemester[]>([]);
  const [selectedHk,  setSelectedHk] = useState<number | null>(null);
  const [loadingSem,  setLoadingSem] = useState(true);
  const [subjects,    setSubjects]   = useState<IStudentSubject[]>([]);
  const [loadingSub,  setLoadingSub] = useState(false);
  const [assignments, setAssignments] = useState<IStudentAssignmentListItem[]>([]);
  const [semDropOpen, setSemDropOpen] = useState(false);
  const semDropRef = useRef<HTMLDivElement>(null);

  const loadSubjects = useCallback((hk: number) => {
    setLoadingSub(true);
    setSubjects([]);
    StudentApi.getSubjectsBySemester(hk)
      .then(r => {
        const list = Array.isArray(r.data) ? r.data : [];
        setSubjects(list.map(s => ({ ...s, files: s.files ?? [] })));
      })
      .catch(() => toast.error('Không thể tải danh sách môn học.'))
      .finally(() => setLoadingSub(false));
  }, []);

  useEffect(() => {
    Promise.all([StudentApi.getSemesters(), StudentApi.getAssignments()])
      .then(([semRes, asnRes]) => {
        const semList = semRes.data.ds_hoc_ky;
        const current = semRes.data.hoc_ky_hien_tai;
        // Ưu tiên học kỳ còn lưu trong URL (vd quay lại từ trang chi tiết),
        // sau đó mới đến học kỳ hiện tại, cuối cùng fallback học kỳ đầu danh sách
        const hkFromUrl = Number(searchParams.get('hk')) || null;
        const initialHk = (hkFromUrl && semList.some(s => s.hoc_ky === hkFromUrl))
          ? hkFromUrl
          : current ?? semList[0]?.hoc_ky ?? null;

        setSemesters(semList);
        setSelectedHk(initialHk);
        if (initialHk) loadSubjects(initialHk);
        setAssignments(asnRes.data ?? []);
      })
      .catch(() => toast.error('Không thể tải dữ liệu.'))
      .finally(() => setLoadingSem(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadSubjects]);

  const handleSelectSem = (hk: number) => {
    setSelectedHk(hk);
    loadSubjects(hk);
    setSearchParams(prev => { const next = new URLSearchParams(prev); next.set('hk', String(hk)); return next; }, { replace: true });
  };

  const currentSem = semesters.find(s => s.hoc_ky === selectedHk);

  useEffect(() => {
    if (!semDropOpen) return;
    const handler = (e: MouseEvent) => {
      if (!semDropRef.current?.contains(e.target as Node)) setSemDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [semDropOpen]);

  const totalTC = subjects.reduce((sum, s) => sum + (parseInt(s.so_tc) || 0), 0);

  return (
    <div style={{ minHeight: '100%', background: '#f4f6fb' }}>
      <style>{CSS}</style>

      {/* ── Header + semester selector ── */}
      <div style={{ background: 'white', borderBottom: '1px solid #eef0f5', position: 'sticky', top: 0, zIndex: 20, boxShadow: '0 2px 8px rgba(30,58,138,0.05)' }}>
        <div className="ss-container" style={{ padding: '14px 24px' }}>
          <div className="ss-header-row">
            <div style={{ minWidth: 0 }}>
              <h1 className="ss-page-title" style={{ margin: 0, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Môn học của tôi</h1>
              {!loadingSub && subjects.length > 0 && currentSem && (
                <div className="ss-page-subtitle" style={{ color: '#94a3b8', marginTop: 3 }}>
                  {subjects.length} môn học phần · {totalTC} tín chỉ · {currentSem.ten_hoc_ky}
                </div>
              )}
            </div>

            {loadingSem ? (
              <Loader2 size={14} color="#94a3b8" style={{ animation: 'ss-spin 1s linear infinite', flexShrink: 0 }} />
            ) : semesters.length > 0 && (
              <div ref={semDropRef} className="ss-sem-drop" style={{ position: 'relative', flexShrink: 0 }}>
                <button
                  className="ss-sem-drop-btn"
                  onClick={() => setSemDropOpen(v => !v)}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 13px', borderRadius: 20, background: 'white', border: '1.5px solid rgba(37,99,235,0.18)', cursor: 'pointer', transition: 'all .15s', boxShadow: semDropOpen ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none' }}
                >
                  <Calendar size={12} color="#2563eb" />
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap' }}>{currentSem?.ten_hoc_ky ?? 'Chọn học kỳ'}</span>
                  {currentSem?.is_current && (
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#059669', background: 'rgba(5,150,105,0.1)', borderRadius: 20, padding: '2px 7px', whiteSpace: 'nowrap' }}>Hiện tại</span>
                  )}
                  <ChevronDown size={13} color="#64748b" style={{ transition: 'transform .2s', transform: semDropOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                </button>

                {semDropOpen && (
                  <div className="ss-sem-drop-panel" style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 50, background: 'white', borderRadius: 14, boxShadow: '0 8px 30px rgba(30,58,138,0.15)', border: '1px solid rgba(37,99,235,0.1)', minWidth: 230, overflow: 'hidden', animation: 'ss-fade .15s ease' }}>
                    <div style={{ padding: '8px 14px 6px', borderBottom: '1px solid rgba(37,99,235,0.07)' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Chọn học kỳ</span>
                    </div>
                    {semesters.map(s => (
                      <button
                        key={s.hoc_ky}
                        onClick={() => { handleSelectSem(s.hoc_ky); setSemDropOpen(false); }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 14px', background: s.hoc_ky === selectedHk ? 'rgba(37,99,235,0.05)' : 'none', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background .13s' }}
                        onMouseEnter={e => { if (s.hoc_ky !== selectedHk) (e.currentTarget as HTMLElement).style.background = 'rgba(37,99,235,0.04)'; }}
                        onMouseLeave={e => { if (s.hoc_ky !== selectedHk) (e.currentTarget as HTMLElement).style.background = 'none'; }}
                      >
                        <div style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: s.hoc_ky === selectedHk ? '#2563eb' : s.is_current ? '#22c55e' : '#e2e8f0' }} />
                        <span style={{ flex: 1, fontSize: '0.78rem', fontWeight: s.hoc_ky === selectedHk ? 700 : 500, color: s.hoc_ky === selectedHk ? '#1e3a8a' : '#334155' }}>{s.ten_hoc_ky}</span>
                        {s.is_current && <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#059669', background: 'rgba(5,150,105,0.09)', borderRadius: 20, padding: '1px 7px' }}>Hiện tại</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Content grid ── */}
      <div className="ss-content">
        {loadingSub ? (
          <div className="ss-grid">
            {[1,2,3,4,5,6].map(i => <div key={i} className="ss-skeleton" style={{ animationDelay: `${i*0.06}s` }} />)}
          </div>
        ) : subjects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
            <GraduationCap size={56} color="#bfdbfe" style={{ margin: '0 auto 14px', display: 'block' }} />
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>Không có môn học</div>
            <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: 4 }}>Học kỳ này chưa có môn học nào hoặc chưa có dữ liệu.</div>
          </div>
        ) : (
          <div className="ss-grid">
            {subjects.map((s, i) => (
              <SubjectCard
                key={s.ma_mon}
                subject={s}
                delay={i * 0.04}
                assignments={assignments.filter(a => a.ma_mon === s.ma_mon)}
                hocKy={selectedHk}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentSubjects;
