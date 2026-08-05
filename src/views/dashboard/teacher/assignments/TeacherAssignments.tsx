import { type FC, useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Loader2, Plus, ClipboardList, Calendar, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import TeacherApi from '@/infra/teacher/teacher_api';
import type { IAssignmentListItem } from '@/infra/api/interfaces/IAssignment';
import type { ISemester, ITeacherSubject } from '@/infra/api/interfaces/ITeacher';
import CSS from './assignments.styles';
import { fmtDt, statusPill } from './helpers';

const TeacherAssignments: FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [assignments, setAssignments] = useState<IAssignmentListItem[]>([]);
  const [loading,      setLoading]      = useState(true);

  // Học kỳ — chốt mặc định = học kỳ hiện tại, cùng cách làm với trang Môn học
  // (TeacherSubjectList.tsx: field `hoc_ky`/`ten_hoc_ky`/`hoc_ky_hien_tai`/`ds_hoc_ky`).
  const [semesters,     setSemesters]     = useState<ISemester[]>([]);
  const [currentHocKy,  setCurrentHocKy]  = useState<number | null>(null);
  const [selectedHocKy, setSelectedHocKy] = useState<number | null>(null);
  const [loadingSem,    setLoadingSem]    = useState(true);

  // Môn học trong học kỳ đã chọn — dùng để biết những ma_mon nào thuộc học kỳ này
  // (bài kiểm tra không có field hoc_ky riêng, phải suy ra qua danh sách môn của học kỳ).
  const [subjects,        setSubjects]        = useState<ITeacherSubject[]>([]);
  const [selectedMaMon,   setSelectedMaMon]   = useState('');
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  const [hocKyOpen, setHocKyOpen] = useState(false);
  const [monHopOpen, setMonHopOpen] = useState(false);

  const loadSubjects = useCallback((hocKy: number) => {
    setLoadingSubjects(true);
    TeacherApi.getSemesterCourses(hocKy)
      .then(res => setSubjects(res.data.map(c => c.subject)))
      .catch(() => setSubjects([]))
      .finally(() => setLoadingSubjects(false));
  }, []);

  useEffect(() => {
    TeacherApi.getSemesters()
      .then(res => {
        const list    = res.data.ds_hoc_ky;
        const current = res.data.hoc_ky_hien_tai;
        const hkFromUrl = Number(searchParams.get('hk')) || null;
        const initialHocKy = (hkFromUrl && list.some(s => s.hoc_ky === hkFromUrl))
          ? hkFromUrl
          : current ?? list[0]?.hoc_ky ?? null;

        setSemesters(list);
        setCurrentHocKy(current);
        setSelectedHocKy(initialHocKy);
        if (initialHocKy) loadSubjects(initialHocKy);
      })
      .catch(() => toast.error('Không thể tải danh sách học kỳ.'))
      .finally(() => setLoadingSem(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadSubjects]);

  useEffect(() => {
    TeacherApi.getAssignments()
      .then(r => setAssignments(r.data ?? []))
      .catch(() => toast.error('Không thể tải danh sách bài giao.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSelectHocKy = (hocKy: number) => {
    setSelectedHocKy(hocKy);
    setSelectedMaMon('');
    setHocKyOpen(false);
    loadSubjects(hocKy);
    setSearchParams(prev => { const next = new URLSearchParams(prev); next.set('hk', String(hocKy)); return next; }, { replace: true });
  };

  const currentSem = semesters.find(s => s.hoc_ky === selectedHocKy);
  const subjectMaMonSet = new Set(subjects.map(s => s.ma_mon));

  // Bài kiểm tra không lưu hoc_ky riêng — lọc theo học kỳ bằng cách đối chiếu ma_mon
  // với danh sách môn học của học kỳ đang chọn (đã tải ở loadSubjects).
  const filteredAssignments = assignments
    .filter(a => subjectMaMonSet.has(a.ma_mon))
    .filter(a => !selectedMaMon || a.ma_mon === selectedMaMon);

  return (
    <div style={{ minHeight: '100%', background: 'linear-gradient(160deg,#eef4ff 0%,#e0eaff 40%,#f0f9ff 100%)', fontFamily: "'Be Vietnam Pro',system-ui,sans-serif" }}>
      <style>{CSS}</style>

      <div className="as-list-hdr">
        <div className="as-list-hdr-row">
          <div>
            <h1 className="as-list-hdr-title">Bài kiểm tra đã giao</h1>
            <div style={{ marginTop: 5, fontSize: 13.5, color: '#64748b' }}>
              {!loading && !loadingSubjects && (
                <>{filteredAssignments.length} bài kiểm tra{currentSem ? ` · ${currentSem.ten_hoc_ky}` : ''}</>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto', flexWrap: 'wrap' }}>
            {/* ── Học kỳ dropdown ── */}
            {loadingSem ? (
              <Loader2 size={16} color="#94a3b8" style={{ animation: 'as-spin 1s linear infinite' }} />
            ) : semesters.length > 0 && (
              <div
                className="as-gb-dropdown"
                style={{ flex: '0 0 auto', minWidth: 200 }}
                onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setHocKyOpen(false); }}
                tabIndex={-1}
              >
                <button className="as-gb-dropdown-trigger" aria-expanded={hocKyOpen} onClick={() => setHocKyOpen(o => !o)}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Calendar size={13} color="#2563eb" />
                    {currentSem?.ten_hoc_ky ?? 'Chọn học kỳ'}
                    {currentSem && currentSem.hoc_ky === currentHocKy && (
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: '#059669', background: 'rgba(5,150,105,0.1)', borderRadius: 999, padding: '1px 8px', whiteSpace: 'nowrap' }}>
                        Hiện tại
                      </span>
                    )}
                  </span>
                  <ChevronDown size={14} color="#94a3b8" style={{ transition: 'transform .15s', transform: hocKyOpen ? 'rotate(180deg)' : 'none' }} />
                </button>
                {hocKyOpen && (
                  <div className="as-gb-dropdown-menu">
                    {semesters.map(s => (
                      <div
                        key={s.hoc_ky}
                        className={`as-gb-dropdown-item ${s.hoc_ky === selectedHocKy ? 'active' : ''}`}
                        onMouseDown={() => handleSelectHocKy(s.hoc_ky)}
                      >
                        <span>{s.ten_hoc_ky}</span>
                        {s.hoc_ky === currentHocKy && (
                          <span style={{ fontSize: 10.5, fontWeight: 700, color: '#059669', background: 'rgba(5,150,105,0.1)', borderRadius: 999, padding: '1px 7px' }}>
                            Hiện tại
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Môn học dropdown ── */}
            {!loadingSem && subjects.length > 0 && (
              <div
                className="as-gb-dropdown"
                style={{ flex: '0 0 auto', minWidth: 180 }}
                onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setMonHopOpen(false); }}
                tabIndex={-1}
              >
                <button className="as-gb-dropdown-trigger" aria-expanded={monHopOpen} onClick={() => setMonHopOpen(o => !o)}>
                  <span>{selectedMaMon ? subjects.find(s => s.ma_mon === selectedMaMon)?.ten_mon ?? selectedMaMon : 'Tất cả môn học'}</span>
                  <ChevronDown size={14} color="#94a3b8" style={{ transition: 'transform .15s', transform: monHopOpen ? 'rotate(180deg)' : 'none' }} />
                </button>
                {monHopOpen && (
                  <div className="as-gb-dropdown-menu">
                    <div
                      className={`as-gb-dropdown-item ${!selectedMaMon ? 'active' : ''}`}
                      onMouseDown={() => { setSelectedMaMon(''); setMonHopOpen(false); }}
                    >
                      <span>Tất cả môn học</span>
                    </div>
                    {subjects.map(s => (
                      <div
                        key={s.ma_mon}
                        className={`as-gb-dropdown-item ${s.ma_mon === selectedMaMon ? 'active' : ''}`}
                        onMouseDown={() => { setSelectedMaMon(s.ma_mon); setMonHopOpen(false); }}
                      >
                        <span>{s.ten_mon}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', fontFamily: 'monospace' }}>{s.ma_mon}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button className="as-btn primary" onClick={() => navigate('/teacher/subjects')}>
              <Plus size={18} /> Giao đề mới
            </button>
          </div>
        </div>
      </div>

      <div className="as-list-content">
        {loading || loadingSem || loadingSubjects ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <Loader2 size={28} color="#2563eb" style={{ animation: 'as-spin 1s linear infinite', margin: '0 auto 10px', display: 'block' }} />
            <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Đang tải...</div>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(37,99,235,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <ClipboardList size={32} color="#93c5fd" />
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
              {assignments.length === 0 ? 'Chưa có bài giao nào' : 'Không có bài kiểm tra nào khớp bộ lọc'}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
              {assignments.length === 0 ? 'Vào Bài kiểm tra của môn học để giao đề cho học sinh' : 'Thử chọn học kỳ hoặc môn học khác.'}
            </div>
          </div>
        ) : (
          <div className="as-table-card">
            <div className="as-table-head">
              <div>Đề kiểm tra</div><div>Trạng thái</div><div>Tiến độ nộp</div><div>Hạn nộp</div>
            </div>
            {filteredAssignments.map((a, idx) => {
              const pill = statusPill(a.status);
              const pct  = a.student_count > 0 ? Math.round((a.submitted_count / a.student_count) * 100) : 0;
              return (
                <div key={a.id} className="as-table-row" style={{ animationDelay: `${idx * 0.03}s` }}
                  onClick={() => navigate(`/teacher/assignments/${a.id}`)}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.title}</div>
                    <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>
                      <span style={{ fontFamily: 'monospace', color: '#2563eb' }}>{a.ma_mon}</span> · {a.student_count} học sinh
                    </div>
                  </div>
                  <div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, padding: '4px 11px', borderRadius: 999, background: pill.background, color: pill.color, whiteSpace: 'nowrap' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />{pill.label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                    <div style={{ flex: 1, height: 7, borderRadius: 999, background: '#eef2f7', overflow: 'hidden', maxWidth: 150 }}>
                      <div style={{ height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#2563eb,#3b82f6)', width: `${pct}%` }} />
                    </div>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: '#475569' }}>{a.submitted_count}/{a.student_count}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>{fmtDt(a.due_at)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherAssignments;
