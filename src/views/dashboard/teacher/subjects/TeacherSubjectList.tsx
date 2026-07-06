import { type FC, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Loader2, ChevronDown, Calendar, Search, X, BookOpen, Layers, Users, Target } from 'lucide-react';
import toast from 'react-hot-toast';
import TeacherApi from '@/infra/teacher/teacher_api';
import type { ISemester, ITeacherSubjectWithClasses, ISubjectAnalytics } from '@/infra/api/interfaces/ITeacher';
import CSS from './subjectList.styles';
import SubjectRow from './SubjectRow';
import SubjectStatCards, { type ISubjectOverviewStat } from './SubjectStatCards';

const TeacherSubjectList: FC = () => {
  const navigate = useNavigate();

  const [semesters,     setSemesters]     = useState<ISemester[]>([]);
  const [currentHocKy,  setCurrentHocKy]  = useState<number | null>(null);
  const [selectedHocKy, setSelectedHocKy] = useState<number | null>(null);
  const [courses,       setCourses]       = useState<ITeacherSubjectWithClasses[]>([]);
  const [loadingSem,    setLoadingSem]    = useState(true);
  const [loadingCourses,setLoadingCourses]= useState(false);
  const [dropOpen,      setDropOpen]      = useState(false);
  const [search,        setSearch]        = useState('');
  const [searchInput,   setSearchInput]   = useState('');

  const [subjectAnalytics, setSubjectAnalytics] = useState<Record<string, ISubjectAnalytics>>({});
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const dropRef    = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Per-subject completion/AI/attention metrics aren't in the course-list response —
  // fetch each subject's analytics in parallel. See docs/backend-api-requests.md for
  // a proposed bulk endpoint that would remove the need for this N+1 fan-out.
  const loadAnalytics = useCallback((list: ITeacherSubjectWithClasses[], hocKy: number) => {
    if (!list.length) { setSubjectAnalytics({}); return; }
    setAnalyticsLoading(true);
    Promise.allSettled(list.map(c => TeacherApi.getSubjectAnalytics(c.subject.ma_mon, hocKy)))
      .then(results => {
        const map: Record<string, ISubjectAnalytics> = {};
        results.forEach((r, i) => {
          if (r.status === 'fulfilled') map[list[i].subject.ma_mon] = r.value.data;
        });
        setSubjectAnalytics(map);
      })
      .finally(() => setAnalyticsLoading(false));
  }, []);

  const loadCourses = useCallback((hocKy: number, q?: string) => {
    setLoadingCourses(true);
    TeacherApi.getSemesterCourses(hocKy, q || undefined)
      .then(res => {
        setCourses(res.data);
        loadAnalytics(res.data, hocKy);
      })
      .catch(() => toast.error('Không thể tải danh sách môn học.'))
      .finally(() => setLoadingCourses(false));
  }, [loadAnalytics]);

  const handleSearch = (val: string) => {
    setSearchInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(val);
      if (selectedHocKy) loadCourses(selectedHocKy, val);
    }, 400);
  };

  useEffect(() => {
    TeacherApi.getSemesters()
      .then(res => {
        setSemesters(res.data.ds_hoc_ky);
        setCurrentHocKy(res.data.hoc_ky_hien_tai);
        setSelectedHocKy(res.data.hoc_ky_hien_tai);
        loadCourses(res.data.hoc_ky_hien_tai);
      })
      .catch(() => toast.error('Không thể tải danh sách học kỳ.'))
      .finally(() => setLoadingSem(false));
  }, [loadCourses]);

  // close dropdown on outside click
  useEffect(() => {
    if (!dropOpen) return;
    const handler = (e: MouseEvent) => {
      if (!dropRef.current?.contains(e.target as Node)) setDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropOpen]);

  const totalClasses  = courses.reduce((s, c) => s + c.classes.length, 0);
  const totalStudents = courses.reduce((s, c) => s + c.classes.reduce((a, cl) => a + cl.sl_dk, 0), 0);
  const currentSem    = semesters.find(s => s.hoc_ky === selectedHocKy);

  const analyticsList = Object.values(subjectAnalytics);
  const avgCompletion = analyticsList.length
    ? Math.round(analyticsList.reduce((s, a) => s + a.assignments.completion_rate, 0) / analyticsList.length)
    : null;

  const overviewStats: ISubjectOverviewStat[] = [
    { icon:<BookOpen size={18} />, label:'Môn học',       value:courses.length,  sub:'đang giảng dạy',      tint:'#eef4ff', ink:'#2563eb' },
    { icon:<Layers size={18} />,   label:'Lớp học phần',  value:totalClasses,    sub:'trong học kỳ',        tint:'#eef2ff', ink:'#4f46e5' },
    { icon:<Users size={18} />,    label:'Sinh viên',     value:totalStudents,   sub:'tổng toàn bộ lớp',    tint:'#f1ecfe', ink:'#7c3aed' },
    { icon:<Target size={18} />,   label:'Hoàn thành TB', value: avgCompletion !== null ? `${avgCompletion}%` : '—', sub:'toàn bộ môn học', tint:'#e8f7ef', ink:'#16a34a' },
  ];

  return (
    <div style={{ minHeight:'100%', background:'#f4f6fb' }}>
      <style>{CSS}</style>

      {/* ── Sticky header ── */}
      <div className="sl-sticky-header">
        <div className="sl-header-inner">
          <div style={{ minWidth:0 }}>
            <h1 style={{ margin:0, fontSize:'1.1rem', fontWeight:800, color:'#0f172a', letterSpacing:'-0.02em' }}>
              Môn học
            </h1>
            {!loadingCourses && courses.length > 0 && currentSem && (
              <div style={{ fontSize:'0.72rem', color:'#94a3b8', marginTop:3 }}>
                {courses.length} môn học · {totalClasses} lớp · {totalStudents} sinh viên · {currentSem.ten_hoc_ky}
              </div>
            )}
          </div>

          {/* ── Semester dropdown ── */}
          {loadingSem ? (
            <Loader2 size={14} color="#94a3b8" style={{ animation:'sl-spin 1s linear infinite', flexShrink:0 }} />
          ) : currentSem && (
            <div ref={dropRef} style={{ position:'relative', flexShrink:0 }}>
              <button
                className="sl-drop-btn"
                onClick={() => setDropOpen(v => !v)}
                style={{ boxShadow: dropOpen ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none' }}
              >
                <Calendar size={12} color="#2563eb" />
                <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#1e293b', whiteSpace:'nowrap' }}>
                  {currentSem.ten_hoc_ky}
                </span>
                {currentSem.hoc_ky === currentHocKy && (
                  <span style={{ fontSize:'0.58rem', fontWeight:700, color:'#059669', background:'rgba(5,150,105,0.1)', borderRadius:20, padding:'2px 7px', whiteSpace:'nowrap' }}>
                    Hiện tại
                  </span>
                )}
                <ChevronDown
                  size={13} color="#64748b"
                  style={{ transition:'transform .2s', transform: dropOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </button>

              {dropOpen && (
                <div className="sl-drop-panel">
                  <div style={{ padding:'8px 14px 6px', borderBottom:'1px solid rgba(37,99,235,0.07)' }}>
                    <span style={{ fontSize:'0.62rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                      Chọn học kỳ
                    </span>
                  </div>
                  {semesters.map(s => (
                    <button
                      key={s.hoc_ky}
                      className="sl-drop-item"
                      onClick={() => { setSelectedHocKy(s.hoc_ky); loadCourses(s.hoc_ky); setDropOpen(false); }}
                      style={{ background: s.hoc_ky === selectedHocKy ? 'rgba(37,99,235,0.05)' : 'none' }}
                    >
                      <div style={{ width:7, height:7, borderRadius:'50%', flexShrink:0, background: s.hoc_ky === selectedHocKy ? '#2563eb' : s.hoc_ky === currentHocKy ? '#22c55e' : '#e2e8f0' }} />
                      <span style={{ flex:1, fontSize:'0.78rem', fontWeight: s.hoc_ky === selectedHocKy ? 700 : 500, color: s.hoc_ky === selectedHocKy ? '#1e3a8a' : '#334155' }}>
                        {s.ten_hoc_ky}
                      </span>
                      {s.hoc_ky === currentHocKy && (
                        <span style={{ fontSize:'0.58rem', fontWeight:700, color:'#059669', background:'rgba(5,150,105,0.09)', borderRadius:20, padding:'1px 7px' }}>
                          Hiện tại
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="sl-content">

        {/* Overview stats */}
        {!loadingCourses && courses.length > 0 && <SubjectStatCards stats={overviewStats} />}

        {/* Search */}
        <div style={{ position:'relative' }}>
          <Search size={15} color="#94a3b8" style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
          <input
            type="text"
            value={searchInput}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Tìm môn học, mã môn, mã lớp, tên lớp..."
            style={{ width:'100%', boxSizing:'border-box', paddingLeft:40, paddingRight: search ? 36 : 16, paddingTop:10, paddingBottom:10, borderRadius:12, border:'1.5px solid rgba(37,99,235,0.18)', fontSize:'0.82rem', color:'#1e293b', outline:'none', background:'white', transition:'border-color .15s', boxShadow:'0 1px 3px rgba(15,23,42,0.04)' }}
            onFocus={e => (e.target.style.borderColor = 'rgba(37,99,235,0.5)')}
            onBlur={e  => (e.target.style.borderColor = 'rgba(37,99,235,0.18)')}
          />
          {search && (
            <button onClick={() => handleSearch('')} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', padding:2, display:'flex', alignItems:'center' }}>
              <X size={14} color="#94a3b8" />
            </button>
          )}
        </div>

        {/* Subject list */}
        {loadingCourses ? (
          <div style={{ display:'flex', justifyContent:'center', alignItems:'center', padding:'5rem', gap:10, color:'#64748b', fontSize:'0.85rem' }}>
            <Loader2 size={20} color="#2563eb" style={{ animation:'sl-spin 1s linear infinite' }} />
            Đang tải...
          </div>
        ) : courses.length === 0 ? (
          <div className="sl-card" style={{ padding:'3rem', textAlign:'center', color:'#94a3b8', fontSize:'0.85rem' }}>
            Không có môn học trong học kỳ này
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {courses.map((course, idx) => (
              <SubjectRow
                key={course.subject.ma_mon}
                course={course}
                colorIdx={idx}
                analytics={subjectAnalytics[course.subject.ma_mon]}
                analyticsLoading={analyticsLoading && !subjectAnalytics[course.subject.ma_mon]}
                onDetail={()     => navigate(`/teacher/subjects/${course.subject.ma_mon}/analytics${selectedHocKy ? `?hoc_ky=${selectedHocKy}` : ''}`)}
                onFiles={()      => navigate(`/teacher/subjects/${course.subject.ma_mon}/files`)}
                onExams={()      => navigate(`/teacher/subjects/${course.subject.ma_mon}/exams`)}
                onClsDetail={cls => navigate(`/teacher/courses/${encodeURIComponent(cls.id_to_hoc)}/analytics`)}
                onStudents={cls  => navigate(`/teacher/courses/${encodeURIComponent(cls.id_to_hoc)}/students`)}
                onClsExams={()   => navigate(`/teacher/subjects/${course.subject.ma_mon}/exams`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherSubjectList;
