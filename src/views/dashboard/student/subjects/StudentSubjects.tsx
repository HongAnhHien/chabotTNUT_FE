import { type FC, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft, BookOpen, FileText, Download,
  GraduationCap, ChevronDown, ChevronUp, Calendar,
  Loader2, ChevronLeft, ChevronRight as ChevronRightIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import StudentApi from '@/infra/student/student_api';
import type { IStudentSubject, IStudentSubjectFile, IStudentSemester } from '@/infra/api/interfaces/IStudent';

// ── CSS ───────────────────────────────────────────────
const CSS = `
  @keyframes ss-fade    { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ss-spin    { to{transform:rotate(360deg)} }
  @keyframes ss-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  .ss-card {
    background: white;
    border-radius: 16px;
    border: 1px solid rgba(37,99,235,0.09);
    overflow: hidden;
    transition: box-shadow .2s, transform .2s;
    animation: ss-fade .35s ease both;
  }
  .ss-card:hover { box-shadow: 0 8px 28px rgba(37,99,235,0.1); transform: translateY(-2px); }
  .ss-file-row {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 14px; transition: background .14s; cursor: default;
  }
  .ss-file-row:hover { background: rgba(37,99,235,0.03); }
  .ss-dl-btn {
    display: flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; border-radius: 8px;
    background: rgba(37,99,235,0.08); border: 1px solid rgba(37,99,235,0.15);
    color: #2563eb; cursor: pointer; transition: all .14s; text-decoration: none; flex-shrink: 0;
  }
  .ss-dl-btn:hover { background: rgba(37,99,235,0.15); }
  .ss-sem-pill {
    white-space: nowrap; padding: 5px 13px; border-radius: 20px;
    font-size: .75rem; font-weight: 600; cursor: pointer;
    border: 1px solid rgba(37,99,235,0.2);
    transition: all .15s; background: transparent; color: rgba(255,255,255,0.75);
  }
  .ss-sem-pill:hover  { background: rgba(255,255,255,0.12); color: white; }
  .ss-sem-pill.active { background: white; color: #1e3a8a; border-color: white; font-weight: 700; }
  .ss-skeleton {
    border-radius: 14px; height: 96px;
    background: linear-gradient(90deg,#f0f4ff 25%,#e8f0fe 50%,#f0f4ff 75%);
    background-size: 200% 100%;
    animation: ss-shimmer 1.4s ease infinite;
  }

  /* responsive */
  .ss-header-inner { max-width: 760px; margin: 0 auto; padding: 0 16px; }
  .ss-content { max-width: 760px; margin: 0 auto; padding: 20px 16px; }
  @media (max-width: 480px) {
    .ss-sem-pill { font-size: .68rem; padding: 4px 10px; }
  }
`;

// ── Constants ─────────────────────────────────────────
const TYPE_STYLE: Record<string, { bg: string; color: string }> = {
  de_cuong:          { bg: 'rgba(30,58,138,0.08)',   color: '#1e3a8a' },
  ly_thuyet:         { bg: 'rgba(124,58,237,0.08)',  color: '#7c3aed' },
  ma_tran_cau_hoi:   { bg: 'rgba(5,150,105,0.08)',   color: '#059669' },
  ngan_hang_cau_hoi: { bg: 'rgba(217,119,6,0.08)',   color: '#d97706' },
  khac:              { bg: 'rgba(100,116,139,0.08)', color: '#64748b' },
};

const TYPE_LABEL: Record<string, string> = {
  de_cuong:          'Đề cương',
  ly_thuyet:         'Lý thuyết',
  ma_tran_cau_hoi:   'Ma trận câu hỏi',
  ngan_hang_cau_hoi: 'Ngân hàng câu hỏi',
  khac:              'Khác',
};

// ── Helpers ───────────────────────────────────────────
const fmtSize = (bytes: number | null) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

// ── File row ──────────────────────────────────────────
const FileRow: FC<{ file: IStudentSubjectFile; last: boolean }> = ({ file, last }) => {
  const ts = TYPE_STYLE[file.type] ?? TYPE_STYLE.khac;
  const label = file.type_label || TYPE_LABEL[file.type] || file.type;
  return (
    <div className="ss-file-row" style={{ borderBottom: last ? 'none' : '1px solid rgba(37,99,235,0.05)' }}>
      <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 9, background: ts.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <FileText size={14} color={ts.color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {file.original_name}
        </div>
        <div style={{ display: 'flex', gap: 7, marginTop: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.62rem', fontWeight: 700, borderRadius: 20, padding: '1px 6px', background: ts.bg, color: ts.color }}>{label}</span>
          {file.file_size ? <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>{fmtSize(file.file_size)}</span> : null}
          {file.uploaded_by ? <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>· {file.uploaded_by}</span> : null}
        </div>
      </div>
      {file.download_url ? (
        <a href={file.download_url} target="_blank" rel="noreferrer" className="ss-dl-btn" title="Tải xuống">
          <Download size={13} />
        </a>
      ) : (
        <div style={{ width: 28, flexShrink: 0 }} />
      )}
    </div>
  );
};

// ── Subject card ──────────────────────────────────────
const SubjectCard: FC<{ subject: IStudentSubject; delay: number }> = ({ subject, delay }) => {
  const [open, setOpen] = useState(false);
  const files = subject.files ?? [];
  const hasFiles = files.length > 0;

  // Group files by type
  const grouped = files.reduce<Record<string, IStudentSubjectFile[]>>((acc, f) => {
    const key = f.type ?? 'khac';
    (acc[key] ??= []).push(f);
    return acc;
  }, {});

  return (
    <div className="ss-card" style={{ animationDelay: `${delay}s` }}>
      {/* Header */}
      <div
        onClick={() => hasFiles && setOpen(v => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: hasFiles ? 'pointer' : 'default' }}
      >
        {/* Credit badge */}
        <div style={{ flexShrink: 0, width: 46, height: 46, borderRadius: 13, background: 'linear-gradient(135deg,rgba(30,58,138,0.1),rgba(37,99,235,0.07))', border: '1px solid rgba(37,99,235,0.12)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '1rem', fontWeight: 900, color: '#1e3a8a', lineHeight: 1 }}>{subject.so_tc}</span>
          <span style={{ fontSize: '0.5rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>TC</span>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#1e293b', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {subject.ten_mon}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'monospace' }}>{subject.ma_mon}</span>
            {hasFiles ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.65rem', fontWeight: 700, color: '#2563eb', background: 'rgba(37,99,235,0.08)', borderRadius: 20, padding: '1px 7px' }}>
                <FileText size={9} /> {files.length} tài liệu
              </span>
            ) : (
              <span style={{ fontSize: '0.65rem', color: '#cbd5e1', fontStyle: 'italic' }}>Chưa có tài liệu</span>
            )}
          </div>
        </div>

        {/* Toggle icon */}
        {hasFiles && (
          <div style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 8, background: open ? 'rgba(37,99,235,0.08)' : 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}>
            {open ? <ChevronUp size={13} color="#2563eb" /> : <ChevronDown size={13} color="#94a3b8" />}
          </div>
        )}
      </div>

      {/* Files (expandable, grouped by type) */}
      {hasFiles && open && (
        <div style={{ borderTop: '1px solid rgba(37,99,235,0.06)', background: 'rgba(248,250,255,0.6)' }}>
          {Object.entries(grouped).map(([type, files]) => {
            const ts = TYPE_STYLE[type] ?? TYPE_STYLE.khac;
            const label = TYPE_LABEL[type] ?? type;
            return (
              <div key={type}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px 4px', borderBottom: '1px solid rgba(37,99,235,0.05)' }}>
                  <span style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: ts.color, background: ts.bg, borderRadius: 20, padding: '1px 8px' }}>{label}</span>
                  <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>{files.length} file</span>
                </div>
                {files.map((f, i) => (
                  <FileRow key={f.id} file={f} last={i === files.length - 1 && Object.keys(grouped).indexOf(type) === Object.keys(grouped).length - 1} />
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Main page ─────────────────────────────────────────
const StudentSubjects: FC = () => {
  const navigate = useNavigate();

  const [semesters,    setSemesters]    = useState<IStudentSemester[]>([]);
  const [selectedHk,  setSelectedHk]   = useState<number | null>(null);
  const [loadingSem,  setLoadingSem]   = useState(true);

  const [subjects,    setSubjects]    = useState<IStudentSubject[]>([]);
  const [semLabel,    setSemLabel]    = useState('');
  const [loadingSub,  setLoadingSub]  = useState(false);

  const loadSubjects = useCallback((hk: number, semList: IStudentSemester[]) => {
    setLoadingSub(true);
    setSubjects([]);
    setSemLabel(semList.find(s => s.hoc_ky === hk)?.ten_hoc_ky ?? '');
    StudentApi.getSubjectsBySemester(hk)
      .then(r => {
        const list = Array.isArray(r.data) ? r.data : [];
        setSubjects(list.map(s => ({ ...s, files: s.files ?? [] })));
      })
      .catch(() => toast.error('Không thể tải danh sách môn học.'))
      .finally(() => setLoadingSub(false));
  }, []);

  // Load semesters once, then auto-load current semester subjects
  useEffect(() => {
    StudentApi.getSemesters()
      .then(r => {
        const semList = r.data.ds_hoc_ky;
        setSemesters(semList);
        setSelectedHk(r.data.hoc_ky_hien_tai);
        loadSubjects(r.data.hoc_ky_hien_tai, semList);
      })
      .catch(() => toast.error('Không thể tải danh sách học kỳ.'))
      .finally(() => setLoadingSem(false));
  // loadSubjects is stable (no deps) so safe to include
  }, [loadSubjects]);

  // Reload when user manually switches semester
  const handleSelectSem = (hk: number) => {
    setSelectedHk(hk);
    loadSubjects(hk, semesters);
  };

  const withFiles    = subjects.filter(s => (s.files?.length ?? 0) > 0).length;
  const totalCredits = subjects.reduce((sum, s) => sum + Number(s.so_tc || 0), 0);
  const currentSem   = semesters.find(s => s.hoc_ky === selectedHk);

  // Semester navigation (prev/next)
  const semIdx  = semesters.findIndex(s => s.hoc_ky === selectedHk);
  const hasPrev = semIdx < semesters.length - 1;
  const hasNext = semIdx > 0;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#f0f4ff 0%,#e8f0fe 40%,#eff6ff 100%)' }}>
      <style>{CSS}</style>

      {/* ── Sticky header ── */}
      <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e3a8a)', position: 'sticky', top: 0, zIndex: 20, boxShadow: '0 2px 16px rgba(15,23,42,0.2)' }}>

        {/* Top bar */}
        <div className="ss-header-inner" style={{ height: 56, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/student/dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', color: 'white', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
          >
            <ArrowLeft size={13} /> Quay lại
          </button>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
            <BookOpen size={16} color="#93c5fd" />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'white' }}>Môn học của tôi</div>
              {semLabel && (
                <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.5)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {semLabel}
                </div>
              )}
            </div>
          </div>
          {!loadingSub && subjects.length > 0 && (
            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600, flexShrink: 0 }}>
              {subjects.length} môn · {totalCredits} TC
            </div>
          )}
        </div>

        {/* Semester selector */}
        {!loadingSem && semesters.length > 0 && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '8px 0' }}>
            <div className="ss-header-inner" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {/* Prev semester */}
              <button
                onClick={() => hasPrev && handleSelectSem(semesters[semIdx + 1].hoc_ky)}
                disabled={!hasPrev}
                style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: hasPrev ? 'white' : 'rgba(255,255,255,0.25)', cursor: hasPrev ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                <ChevronLeft size={14} />
              </button>

              {/* Pills scroll area */}
              <div style={{ flex: 1, overflowX: 'auto', display: 'flex', gap: 6, scrollbarWidth: 'none' }}>
                {semesters.map(s => (
                  <button
                    key={s.hoc_ky}
                    className={`ss-sem-pill${selectedHk === s.hoc_ky ? ' active' : ''}`}
                    onClick={() => handleSelectSem(s.hoc_ky)}
                  >
                    {s.is_current ? '🟢 ' : ''}{s.ten_hoc_ky}
                  </button>
                ))}
              </div>

              {/* Next semester */}
              <button
                onClick={() => hasNext && handleSelectSem(semesters[semIdx - 1].hoc_ky)}
                disabled={!hasNext}
                style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: hasNext ? 'white' : 'rgba(255,255,255,0.25)', cursor: hasNext ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                <ChevronRightIcon size={14} />
              </button>
            </div>

            {/* Semester date range */}
            {currentSem && (
              <div className="ss-header-inner" style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
                <Calendar size={10} color="rgba(255,255,255,0.4)" />
                <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                  {currentSem.ngay_bat_dau_hk} – {currentSem.ngay_ket_thuc_hk}
                </span>
                {currentSem.is_current && (
                  <span style={{ fontSize: '0.58rem', fontWeight: 700, color: '#4ade80', background: 'rgba(74,222,128,0.12)', borderRadius: 20, padding: '1px 6px', marginLeft: 4 }}>Hiện tại</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Loading indicator for semesters */}
        {loadingSem && (
          <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 7, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <Loader2 size={12} color="rgba(255,255,255,0.5)" style={{ animation: 'ss-spin 1s linear infinite' }} />
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>Đang tải học kỳ...</span>
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="ss-content">

        {loadingSub ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3,4,5].map(i => <div key={i} className="ss-skeleton" style={{ animationDelay: `${i*0.07}s` }} />)}
          </div>
        ) : subjects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
            <GraduationCap size={48} color="#bfdbfe" style={{ margin: '0 auto 12px', display: 'block' }} />
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>Không có môn học</div>
            <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: 4 }}>
              Học kỳ này chưa có môn học nào hoặc chưa có dữ liệu.
            </div>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 18 }}>
              {[
                { label: 'Môn học',      value: subjects.length, color: '#1e3a8a' },
                { label: 'Tổng tín chỉ', value: totalCredits,    color: '#7c3aed' },
                { label: 'Có tài liệu',  value: withFiles,        color: '#059669' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: 'white', borderRadius: 12, border: `1px solid ${color}18`, padding: '12px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Subject cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {subjects.map((s, i) => (
                <SubjectCard key={s.ma_mon} subject={s} delay={i * 0.04} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StudentSubjects;
