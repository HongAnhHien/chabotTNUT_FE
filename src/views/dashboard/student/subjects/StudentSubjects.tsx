import { type FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft, BookOpen, FileText, Download,
  GraduationCap, ChevronDown, ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import StudentApi from '@/infra/student/student_api';
import type { IStudentSubject, IStudentSubjectFile } from '@/infra/api/interfaces/IStudent';

// ── CSS ───────────────────────────────────────────────
const CSS = `
  @keyframes ss-fade { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ss-spin { to{transform:rotate(360deg)} }
  @keyframes ss-shimmer {
    0%{background-position:200% 0} 100%{background-position:-200% 0}
  }
  .ss-card {
    background: white;
    border-radius: 16px;
    border: 1px solid rgba(37,99,235,0.09);
    overflow: hidden;
    transition: box-shadow .2s, transform .2s;
    animation: ss-fade .35s ease both;
  }
  .ss-card:hover {
    box-shadow: 0 8px 28px rgba(37,99,235,0.1);
    transform: translateY(-2px);
  }
  .ss-file-row {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 14px; transition: background .14s; cursor: default;
  }
  .ss-file-row:hover { background: rgba(37,99,235,0.03); }
  .ss-dl-btn {
    display: flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; border-radius: 8px;
    background: rgba(37,99,235,0.08); border: 1px solid rgba(37,99,235,0.15);
    color: #2563eb; cursor: pointer; transition: all .14s; text-decoration: none; flex-shrink: 0;
  }
  .ss-dl-btn:hover { background: rgba(37,99,235,0.15); }
  .ss-skeleton {
    border-radius: 14px; height: 96px;
    background: linear-gradient(90deg,#f0f4ff 25%,#e8f0fe 50%,#f0f4ff 75%);
    background-size: 200% 100%;
    animation: ss-shimmer 1.4s ease infinite;
  }
`;

// ── Helpers ───────────────────────────────────────────
const fmtSize = (bytes: number | null) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const TYPE_STYLE: Record<string, { bg: string; color: string }> = {
  de_cuong:          { bg: 'rgba(30,58,138,0.08)',   color: '#1e3a8a' },
  ly_thuyet:         { bg: 'rgba(124,58,237,0.08)',  color: '#7c3aed' },
  ma_tran_cau_hoi:   { bg: 'rgba(5,150,105,0.08)',   color: '#059669' },
  ngan_hang_cau_hoi: { bg: 'rgba(217,119,6,0.08)',   color: '#d97706' },
  khac:              { bg: 'rgba(100,116,139,0.08)', color: '#64748b' },
};

// ── Sub-component: subject card ───────────────────────
const SubjectCard: FC<{ subject: IStudentSubject; delay: number }> = ({ subject, delay }) => {
  const [open, setOpen] = useState(false);
  const hasFiles = subject.files.length > 0;

  const typeStyle = (type: string) => TYPE_STYLE[type] ?? TYPE_STYLE.khac;

  return (
    <div className="ss-card" style={{ animationDelay: `${delay}s` }}>
      {/* Header */}
      <div
        onClick={() => hasFiles && setOpen(v => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: hasFiles ? 'pointer' : 'default' }}
      >
        {/* TC badge */}
        <div style={{ flexShrink: 0, width: 46, height: 46, borderRadius: 13, background: 'linear-gradient(135deg,rgba(30,58,138,0.1),rgba(37,99,235,0.07))', border: '1px solid rgba(37,99,235,0.12)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
          <span style={{ fontSize: '1rem', fontWeight: 900, color: '#1e3a8a', lineHeight: 1 }}>{subject.so_tc}</span>
          <span style={{ fontSize: '0.5rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>TC</span>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#1e293b', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {subject.ten_mon}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'monospace' }}>{subject.ma_mon}</span>
            {hasFiles ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.65rem', fontWeight: 700, color: '#2563eb', background: 'rgba(37,99,235,0.08)', borderRadius: 20, padding: '1px 7px' }}>
                <FileText size={9} /> {subject.files.length} tài liệu
              </span>
            ) : (
              <span style={{ fontSize: '0.65rem', color: '#cbd5e1', fontStyle: 'italic' }}>Chưa có tài liệu</span>
            )}
          </div>
        </div>

        {/* Toggle */}
        {hasFiles && (
          <div style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 8, background: open ? 'rgba(37,99,235,0.08)' : 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}>
            {open ? <ChevronUp size={13} color="#2563eb" /> : <ChevronDown size={13} color="#94a3b8" />}
          </div>
        )}
      </div>

      {/* File list (expandable) */}
      {hasFiles && open && (
        <div style={{ borderTop: '1px solid rgba(37,99,235,0.06)', background: 'rgba(248,250,255,0.6)' }}>
          {subject.files.map((f, i) => (
            <FileRow key={f.id} file={f} last={i === subject.files.length - 1} typeStyle={typeStyle(f.type)} />
          ))}
        </div>
      )}
    </div>
  );
};

// ── File row ──────────────────────────────────────────
const FileRow: FC<{ file: IStudentSubjectFile; last: boolean; typeStyle: { bg: string; color: string } }> = ({ file, last, typeStyle }) => (
  <div className="ss-file-row" style={{ borderBottom: last ? 'none' : '1px solid rgba(37,99,235,0.05)' }}>
    {/* File icon */}
    <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 9, background: typeStyle.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <FileText size={14} color={typeStyle.color} />
    </div>

    {/* Info */}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {file.original_name}
      </div>
      <div style={{ display: 'flex', gap: 7, marginTop: 2, alignItems: 'center' }}>
        <span style={{ fontSize: '0.62rem', fontWeight: 700, borderRadius: 20, padding: '1px 6px', background: typeStyle.bg, color: typeStyle.color }}>{file.type_label}</span>
        {file.file_size && <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>{fmtSize(file.file_size)}</span>}
        {file.uploaded_by && <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>· {file.uploaded_by}</span>}
      </div>
    </div>

    {/* Download */}
    {file.download_url ? (
      <a href={file.download_url} target="_blank" rel="noreferrer" className="ss-dl-btn" title="Tải xuống">
        <Download size={13} />
      </a>
    ) : (
      <div style={{ width: 28, flexShrink: 0 }} />
    )}
  </div>
);

// ── Main page ─────────────────────────────────────────
const StudentSubjects: FC = () => {
  const navigate = useNavigate();
  const [data,    setData]    = useState<{ hoc_ky: number; ten_hoc_ky: string; subjects: IStudentSubject[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    StudentApi.getSubjects()
      .then(r => setData(r.data))
      .catch(() => toast.error('Không thể tải danh sách môn học.'))
      .finally(() => setLoading(false));
  }, []);

  const withFiles    = data?.subjects.filter(s => s.files.length > 0).length ?? 0;
  const totalCredits = data?.subjects.reduce((sum, s) => sum + Number(s.so_tc || 0), 0) ?? 0;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#f0f4ff 0%,#e8f0fe 40%,#eff6ff 100%)' }}>
      <style>{CSS}</style>

      {/* ── Sticky header ── */}
      <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e3a8a)', position: 'sticky', top: 0, zIndex: 20, boxShadow: '0 2px 16px rgba(15,23,42,0.2)' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/student/dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', color: 'white', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
          >
            <ArrowLeft size={13} /> Quay lại
          </button>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
            <BookOpen size={16} color="#93c5fd" />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'white' }}>Môn học của tôi</div>
              {data && <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.5)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{data.ten_hoc_ky}</div>}
            </div>
          </div>
          {data && (
            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600, flexShrink: 0 }}>
              {data.subjects.length} môn · {totalCredits} TC
            </div>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '20px 16px' }}>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3,4,5].map(i => <div key={i} className="ss-skeleton" style={{ animationDelay: `${i*0.07}s` }} />)}
          </div>
        ) : !data ? (
          <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
            <GraduationCap size={48} color="#bfdbfe" style={{ margin: '0 auto 12px', display: 'block' }} />
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>Không thể tải dữ liệu</div>
            <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: 4 }}>Vui lòng thử lại sau.</div>
          </div>
        ) : (
          <>
            {/* Stats bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 18 }}>
              {[
                { label: 'Môn học',      value: data.subjects.length, color: '#1e3a8a', bg: 'rgba(30,58,138,0.07)' },
                { label: 'Tổng tín chỉ', value: totalCredits,         color: '#7c3aed', bg: 'rgba(124,58,237,0.07)' },
                { label: 'Có tài liệu',  value: withFiles,             color: '#059669', bg: 'rgba(5,150,105,0.07)' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: 'white', borderRadius: 12, border: `1px solid ${color}18`, padding: '12px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Subject list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.subjects.map((s, i) => (
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
