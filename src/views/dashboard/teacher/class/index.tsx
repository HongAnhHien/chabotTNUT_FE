import { type FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft, RefreshCw,
  AlertTriangle, BookOpen,
} from 'lucide-react';
import TeacherApi from '@/infra/teacher/teacher_api';
import logoTNUT from '@/assets/logo_tnut/logoTNUT.png';
import type { ITeacherStudent } from '@/infra/api/interfaces/ITeacher';
import { columns } from './table/Column';
import { DataTable } from './table/DataTable';

const CSS = `
  @keyframes cl-fade { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes cl-spin  { to{transform:rotate(360deg)} }
`;

// ── Main ─────────────────────────────────────────────
const ClassStudentsPage: FC = () => {
  const navigate     = useNavigate();
  const { idToHoc }  = useParams<{ idToHoc: string }>();

  const [students,      setStudents]      = useState<ITeacherStudent[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [search,        setSearch]        = useState('');
  const [classFilter,   setClassFilter]   = useState('all');

  const fetchStudents = useCallback(() => {
    if (!idToHoc) return;
    setLoading(true);
    setError(null);
    TeacherApi.getCourseStudents(idToHoc)
      .then(res => {
        setStudents(res.data.students);
      })
      .catch(() => setError('Không thể tải danh sách sinh viên. Vui lòng thử lại.'))
      .finally(() => setLoading(false));
  }, [idToHoc]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const classOptions = useMemo(() => {
    const set = new Set(students.map(s => s.ten_lop || s.ma_lop).filter(Boolean));
    return [...set].sort();
  }, [students]);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#eef4ff,#e0eaff)', fontFamily: "'Be Vietnam Pro',system-ui,sans-serif" }}>
      <style>{CSS}</style>

      {/* ══ NAVBAR ══ */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(37,99,235,0.1)', boxShadow: '0 2px 16px rgba(37,99,235,0.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 58 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src={logoTNUT} alt="TNUT" style={{ width: 32, height: 32, objectFit: 'contain' }} />
            <div style={{ width: 1, height: 22, background: 'rgba(37,99,235,0.15)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e3a8a' }}>Danh sách sinh viên</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={fetchStudents}
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(37,99,235,0.07)', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 9, padding: '5px 12px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#2563eb' }}
            >
              <RefreshCw size={13} style={{ animation: loading ? 'cl-spin .8s linear infinite' : 'none' }} />
              Làm mới
            </button>
            <button
              onClick={() => navigate(-1)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(37,99,235,0.18)', borderRadius: 9, padding: '5px 12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#1e3a8a' }}
            >
              <ArrowLeft size={13} /> Quay lại
            </button>
          </div>
        </div>
      </div>

      {/* ══ HERO ══ */}
      <div style={{ background: 'linear-gradient(135deg,#1e3a8a 0%,#1d4ed8 60%,#3b82f6 100%)', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -50, right: -30, width: 200, height: 200, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: -20, left: '40%', width: 120, height: 120, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)' }} />
        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <BookOpen size={14} color="#93c5fd" />
            <span style={{ fontSize: '0.72rem', color: '#93c5fd', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Tổ học</span>
          </div>
          <h1 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 800, color: 'white', fontFamily: 'monospace' }}>{idToHoc ?? '—'}</h1>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)' }}>
            {loading ? 'Đang tải dữ liệu...' : `${students.length} sinh viên · ${classOptions.length} lớp`}
          </p>
        </div>
      </div>

      {/* ══ BODY ══ */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Stats */}
        {/* <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '0.875rem' }}>
          <StatCard icon={<Users size={20} />}        label="Tổng sinh viên"  value={loading ? '…' : students.length}      color="#2563eb" delay={0}    />
          <StatCard icon={<Layers size={20} />}       label="Số lớp"          value={loading ? '…' : classOptions.length}  color="#7c3aed" delay={0.05} />
          <StatCard icon={<GraduationCap size={20} />}label="Kết quả lọc"     value={loading ? '…' : filteredCount}        color="#059669" delay={0.1}  />
        </div> */}

        {/* Error */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 14, padding: '0.875rem 1rem' }}>
            <AlertTriangle size={18} color="#dc2626" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.875rem', color: '#dc2626', flex: 1 }}>{error}</span>
            <button onClick={fetchStudents} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: '0.78rem', color: '#dc2626', fontWeight: 600 }}>
              <RefreshCw size={12} /> Thử lại
            </button>
          </div>
        )}

        {/* Table */}
        <DataTable
          columns={columns}
          data={students}
          loading={loading}
          search={search}
          onSearchChange={setSearch}
          classFilter={classFilter}
          onClassFilter={setClassFilter}
          classOptions={classOptions}
        />

      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid rgba(37,99,235,0.08)', padding: '10px 1.5rem', textAlign: 'center', fontSize: '0.7rem', color: '#94a3b8' }}>
        © 2026 Thai Nguyen University of Technology
      </div>
    </div>
  );
};

export default ClassStudentsPage;
