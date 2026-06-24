import { type FC, useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft, BookOpen, FileText, Download, Eye, X,
  GraduationCap, ChevronDown, ChevronUp, Calendar,
  Loader2, ClipboardList,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { renderAsync as renderDocx } from 'docx-preview';
import StudentApi from '@/infra/student/student_api';
import type { IStudentSubject, IStudentSubjectFile, IStudentSemester } from '@/infra/api/interfaces/IStudent';
import type { IStudentAssignmentListItem } from '@/infra/api/interfaces/IAssignment';

// ── Preview types ──────────────────────────────────────
interface PreviewState { blob: Blob; blobUrl: string; filename: string; fileType: string }

const EXT_MAP: Record<string, string> = {
  pdf: 'pdf', docx: 'docx', doc: 'docx',
  png: 'img', jpg: 'img', jpeg: 'img', gif: 'img', bmp: 'img', webp: 'img', svg: 'img',
  txt: 'txt', csv: 'txt',
};
const getFileType = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return EXT_MAP[ext] ?? 'unsupported';
};

// ── File type viewers ──────────────────────────────────
const DocxViewer: FC<{ blob: Blob }> = ({ blob }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    renderDocx(blob, ref.current, undefined, { className: 'ss-docx' }).catch(() => {});
  }, [blob]);
  return <div ref={ref} style={{ padding: '20px 32px', overflowY: 'auto', height: '100%', boxSizing: 'border-box' }} />;
};

const TxtViewer: FC<{ blob: Blob }> = ({ blob }) => {
  const [text, setText] = useState('');
  useEffect(() => { blob.text().then(setText); }, [blob]);
  return (
    <pre style={{ margin: 0, padding: '20px 24px', overflowY: 'auto', height: '100%', boxSizing: 'border-box', fontSize: '0.82rem', color: '#1e293b', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: '#f8faff' }}>
      {text}
    </pre>
  );
};

// ── File preview modal ─────────────────────────────────
const FilePreviewModal: FC<{ state: PreviewState; onClose: () => void }> = ({ state, onClose }) => {
  const { blob, blobUrl, filename, fileType } = state;

  const renderViewer = () => {
    if (fileType === 'pdf')
      return <iframe src={blobUrl} title={filename} style={{ width: '100%', height: '100%', border: 'none' }} />;
    if (fileType === 'img')
      return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#f1f5f9', overflow: 'auto' }}><img src={blobUrl} alt={filename} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8 }} /></div>;
    if (fileType === 'docx')
      return <DocxViewer blob={blob} />;
    if (fileType === 'txt')
      return <TxtViewer blob={blob} />;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
        <FileText size={48} color="#cbd5e1" />
        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#64748b' }}>Không hỗ trợ xem trực tiếp loại file này</div>
        <a href={blobUrl} download={filename}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', color: 'white', fontWeight: 700, fontSize: '0.82rem', textDecoration: 'none' }}>
          <Download size={13} /> Tải xuống để xem
        </a>
      </div>
    );
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(10,15,30,0.65)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 401, display: 'flex', flexDirection: 'column', padding: 20, boxSizing: 'border-box' }}>
        <div style={{ background: 'white', borderRadius: 18, overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1, boxShadow: '0 30px 80px rgba(0,0,0,0.35)', animation: 'ss-fade .22s ease' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'linear-gradient(135deg,#0f172a,#1e3a8a)', flexShrink: 0 }}>
            <FileText size={14} color="#93c5fd" />
            <span style={{ flex: 1, fontSize: '0.82rem', fontWeight: 700, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{filename}</span>
            <a href={blobUrl} download={filename}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 8, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', fontSize: '0.72rem', fontWeight: 700, textDecoration: 'none' }}>
              <Download size={11} /> Tải xuống
            </a>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={14} />
            </button>
          </div>
          {/* Content */}
          <div style={{ flex: 1, overflow: 'hidden' }}>{renderViewer()}</div>
        </div>
      </div>
    </>
  );
};

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
  .ss-file-action {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 4px 9px; border-radius: 8px; font-size: 0.68rem; font-weight: 700;
    cursor: pointer; text-decoration: none; border: 1px solid; flex-shrink: 0;
    transition: all .14s; white-space: nowrap;
  }
  .ss-file-action.view {
    background: rgba(37,99,235,0.06); border-color: rgba(37,99,235,0.18); color: #2563eb;
  }
  .ss-file-action.view:hover { background: rgba(37,99,235,0.13); }
  .ss-file-action.dl {
    background: rgba(5,150,105,0.07); border-color: rgba(5,150,105,0.2); color: #059669;
  }
  .ss-file-action.dl:hover { background: rgba(5,150,105,0.14); }
  .ss-sem-pill {
    white-space: nowrap; padding: 5px 13px; border-radius: 20px;
    font-size: .75rem; font-weight: 600; cursor: pointer;
    border: 1px solid rgba(37,99,235,0.18);
    transition: all .15s; background: transparent; color: #475569;
  }
  .ss-sem-pill:hover  { background: rgba(37,99,235,0.06); color: #1e3a8a; border-color: rgba(37,99,235,0.3); }
  .ss-sem-pill.active { background: linear-gradient(135deg,#1e3a8a,#2563eb); color: white; border-color: transparent; font-weight: 700; box-shadow: 0 2px 8px rgba(37,99,235,0.25); }
  .ss-skeleton {
    border-radius: 14px; height: 96px;
    background: linear-gradient(90deg,#f0f4ff 25%,#e8f0fe 50%,#f0f4ff 75%);
    background-size: 200% 100%;
    animation: ss-shimmer 1.4s ease infinite;
  }

  .ss-assign-btn {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 11px; border-radius: 20px; font-size: 0.7rem; font-weight: 700;
    cursor: pointer; border: none; text-decoration: none; white-space: nowrap;
    transition: opacity .13s; flex-shrink: 0;
  }
  .ss-assign-btn:hover { opacity: .82; }

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
const FileRow: FC<{
  file: IStudentSubjectFile;
  last: boolean;
  onPreview: (s: PreviewState) => void;
}> = ({ file, last, onPreview }) => {
  const ts    = TYPE_STYLE[file.type] ?? TYPE_STYLE.khac;
  const label = file.type_label || TYPE_LABEL[file.type] || file.type;
  const [loadingView, setLoadingView] = useState(false);
  const [loadingDl,   setLoadingDl]   = useState(false);

  const fetchBlob = async (mode: 'view' | 'dl') => {
    const setLoading = mode === 'view' ? setLoadingView : setLoadingDl;
    setLoading(true);
    try {
      const { blob, filename } = await StudentApi.downloadFile(file.id);
      const url = URL.createObjectURL(blob);
      if (mode === 'view') {
        onPreview({ blob, blobUrl: url, filename: file.original_name || filename, fileType: getFileType(file.original_name) });
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = file.original_name || filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      }
    } catch {
      toast.error('Không thể tải file. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

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
      <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
        <button onClick={() => fetchBlob('view')} disabled={loadingView || loadingDl} className="ss-file-action view" style={{ background: 'none' }}>
          {loadingView ? <Loader2 size={11} style={{ animation: 'ss-spin 1s linear infinite' }} /> : <Eye size={11} />} Xem
        </button>
        <button onClick={() => fetchBlob('dl')} disabled={loadingView || loadingDl} className="ss-file-action dl" style={{ background: 'none' }}>
          {loadingDl ? <Loader2 size={11} style={{ animation: 'ss-spin 1s linear infinite' }} /> : <Download size={11} />} Tải
        </button>
      </div>
    </div>
  );
};

// ── Assignment badge helper ───────────────────────────
const assignBadge = (list: IStudentAssignmentListItem[]) => {
  if (!list.length) return null;
  const pending  = list.filter(a => a.my_status === 'not_started' && !a.is_overdue);
  const overdue  = list.filter(a => a.my_status === 'not_started' && a.is_overdue);
  const submitted = list.filter(a => a.my_status === 'submitted');

  if (pending.length)
    return { label: `Làm bài${pending.length > 1 ? ` (${pending.length})` : ''}`, bg: '#059669', color: 'white', dot: '🟢', ids: pending.map(a => a.id) };
  if (overdue.length)
    return { label: `Quá hạn${overdue.length > 1 ? ` (${overdue.length})` : ''}`, bg: 'rgba(220,38,38,0.1)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.2)', dot: '⏰', ids: overdue.map(a => a.id) };
  if (submitted.length)
    return { label: `Đã nộp${submitted.length > 1 ? ` (${submitted.length})` : ''}`, bg: 'rgba(5,150,105,0.08)', color: '#059669', border: '1px solid rgba(5,150,105,0.18)', dot: '✅', ids: submitted.map(a => a.id) };
  return null;
};

// ── Subject card ──────────────────────────────────────
const SubjectCard: FC<{ subject: IStudentSubject; delay: number; assignments: IStudentAssignmentListItem[]; onPreview: (s: PreviewState) => void }> = ({ subject, delay, assignments, onPreview }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const files = subject.files ?? [];
  const hasFiles = files.length > 0;
  const badge = assignBadge(assignments);

  // Group files by type
  const grouped = files.reduce<Record<string, IStudentSubjectFile[]>>((acc, f) => {
    const key = f.type ?? 'khac';
    (acc[key] ??= []).push(f);
    return acc;
  }, {});

  const handleAssignClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!badge) return;
    if (badge.ids.length === 1) navigate(`/student/assignments/${badge.ids[0]}`);
    else navigate('/student/assignments');
  };

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

        {/* Assignment badge + toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
          {badge && (
            <button
              onClick={handleAssignClick}
              className="ss-assign-btn"
              style={{ background: badge.bg, color: badge.color, border: badge.border ?? 'none' }}
            >
              <ClipboardList size={11} />
              {badge.dot} {badge.label}
            </button>
          )}
          {hasFiles && (
            <div style={{ width: 28, height: 28, borderRadius: 8, background: open ? 'rgba(37,99,235,0.08)' : 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}>
              {open ? <ChevronUp size={13} color="#2563eb" /> : <ChevronDown size={13} color="#94a3b8" />}
            </div>
          )}
        </div>
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
                  <FileRow key={f.id} file={f} last={i === files.length - 1 && Object.keys(grouped).indexOf(type) === Object.keys(grouped).length - 1} onPreview={onPreview} />
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

  const [subjects,     setSubjects]     = useState<IStudentSubject[]>([]);
  const [semLabel,     setSemLabel]     = useState('');
  const [loadingSub,   setLoadingSub]   = useState(false);
  const [assignments,  setAssignments]  = useState<IStudentAssignmentListItem[]>([]);
  const [preview,      setPreview]      = useState<PreviewState | null>(null);

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

  // Load semesters + assignments in parallel on mount
  useEffect(() => {
    Promise.all([
      StudentApi.getSemesters(),
      StudentApi.getAssignments(),
    ]).then(([semRes, asnRes]) => {
      const semList = semRes.data.ds_hoc_ky;
      setSemesters(semList);
      setSelectedHk(semRes.data.hoc_ky_hien_tai);
      loadSubjects(semRes.data.hoc_ky_hien_tai, semList);
      setAssignments(asnRes.data ?? []);
    })
      .catch(() => toast.error('Không thể tải dữ liệu.'))
      .finally(() => setLoadingSem(false));
  }, [loadSubjects]);

  // Reload when user manually switches semester
  const handleSelectSem = (hk: number) => {
    setSelectedHk(hk);
    loadSubjects(hk, semesters);
  };

  const totalCredits = subjects.reduce((sum, s) => sum + Number(s.so_tc || 0), 0);
  const currentSem   = semesters.find(s => s.hoc_ky === selectedHk);

  const [showAllSem, setShowAllSem] = useState(false);
  // Show 6 most-recent semesters; rest behind "Xem thêm"
  const PILL_LIMIT   = 6;
  const visibleSems  = showAllSem ? semesters : semesters.slice(0, PILL_LIMIT);
  const hiddenCount  = Math.max(0, semesters.length - PILL_LIMIT);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#f0f4ff 0%,#e8f0fe 40%,#eff6ff 100%)' }}>
      <style>{CSS}</style>

      {/* ── Sticky header ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20 }}>

        {/* Dark top bar */}
        <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e3a8a)', boxShadow: '0 2px 16px rgba(15,23,42,0.2)' }}>
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
        </div>

        {/* White semester selector bar */}
        <div style={{ background: 'white', borderBottom: '1px solid rgba(37,99,235,0.08)', boxShadow: '0 2px 8px rgba(37,99,235,0.05)' }}>
          {loadingSem ? (
            <div className="ss-header-inner" style={{ padding: '10px 0', display: 'flex', alignItems: 'center', gap: 7 }}>
              <Loader2 size={12} color="#94a3b8" style={{ animation: 'ss-spin 1s linear infinite' }} />
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Đang tải học kỳ...</span>
            </div>
          ) : semesters.length > 0 ? (
            <div style={{ padding: '10px 0 8px' }}>
              {/* Label + date range */}
              <div className="ss-header-inner" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Calendar size={12} color="#94a3b8" />
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.03em' }}>Chọn học kỳ</span>
                {currentSem && (
                  <>
                    <span style={{ fontSize: '0.65rem', color: '#cbd5e1' }}>·</span>
                    <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>
                      {currentSem.ngay_bat_dau_hk} – {currentSem.ngay_ket_thuc_hk}
                    </span>
                    {currentSem.is_current && (
                      <span style={{ fontSize: '0.58rem', fontWeight: 700, color: '#059669', background: 'rgba(5,150,105,0.08)', borderRadius: 20, padding: '1px 7px' }}>Hiện tại</span>
                    )}
                  </>
                )}
              </div>

              {/* Pills */}
              <div className="ss-header-inner" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {visibleSems.map(s => (
                  <button
                    key={s.hoc_ky}
                    className={`ss-sem-pill${selectedHk === s.hoc_ky ? ' active' : ''}`}
                    onClick={() => handleSelectSem(s.hoc_ky)}
                  >
                    {s.is_current && <span style={{ marginRight: 3, fontSize: '0.55rem', verticalAlign: 'middle' }}>●</span>}{s.ten_hoc_ky}
                  </button>
                ))}
              </div>

              {/* Xem thêm */}
              {hiddenCount > 0 && (
                <div className="ss-header-inner" style={{ marginTop: 8 }}>
                  <button
                    onClick={() => setShowAllSem(v => !v)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', fontSize: '0.72rem', fontWeight: 600, padding: 0 }}
                  >
                    <span style={{ fontSize: '0.6rem' }}>{showAllSem ? '▲' : '▼'}</span>
                    {showAllSem ? 'Ẩn bớt' : `Xem thêm ${hiddenCount} học kỳ`}
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
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
            {/* Subject cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {subjects.map((s, i) => (
                <SubjectCard
                  key={s.ma_mon}
                  subject={s}
                  delay={i * 0.04}
                  assignments={assignments.filter(a => a.ma_mon === s.ma_mon)}
                  onPreview={setPreview}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {preview && (
        <FilePreviewModal
          state={preview}
          onClose={() => {
            URL.revokeObjectURL(preview.blobUrl);
            setPreview(null);
          }}
        />
      )}
    </div>
  );
};

export default StudentSubjects;
