import { type FC, useEffect, useMemo, useState } from 'react';
import { X, Users, UserCheck, Calendar, Loader2, Send, Search, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import TeacherApi from '@/infra/teacher/teacher_api';
import type { ISavedExam } from '@/infra/api/interfaces/IChat';
import type { ITeacherClass, ITeacherStudent } from '@/infra/api/interfaces/ITeacher';

const CSS = `
  @keyframes assign-pop { from{opacity:0;transform:scale(.94)} to{opacity:1;transform:scale(1)} }
  @keyframes assign-spin { to{transform:rotate(360deg)} }
  .am-stu-row {
    display:flex; align-items:center; gap:10px; padding:8px 10px;
    border-radius:9px; cursor:pointer; transition:background .12s;
    border:1.5px solid transparent;
  }
  .am-stu-row:hover { background:rgba(37,99,235,0.04); }
  .am-stu-row.selected { background:rgba(37,99,235,0.06); border-color:rgba(37,99,235,0.2); }
`;

interface Props {
  exam: ISavedExam;
  subject: { ma_mon: string; ten_mon: string };
  onClose: () => void;
  onSuccess: () => void;
}

const toApiDate = (dt: string) => dt ? dt.replace('T', ' ') + ':00' : '';

// Format Date → local datetime string for <input type="datetime-local">
// toISOString() gives UTC which is wrong for Vietnam (UTC+7)
const toLocalInput = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

const defaultFrom = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() + 5, 0, 0); // +5 phút so với hiện tại
  return toLocalInput(d);
};
const defaultDue = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  d.setHours(23, 59, 0, 0);
  return toLocalInput(d);
};

const AssignModal: FC<Props> = ({ exam, subject, onClose, onSuccess }) => {
  const [mode,           setMode]           = useState<'class' | 'students'>('class');

  // Classes
  const [classes,        setClasses]        = useState<ITeacherClass[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [activeClassId,  setActiveClassId]  = useState('');

  // Students (for specific-student mode)
  const [students,       setStudents]       = useState<ITeacherStudent[]>([]);
  const [loadingStudents,setLoadingStudents]= useState(false);
  const [selected,       setSelected]       = useState<Set<string>>(new Set());
  const [search,         setSearch]         = useState('');

  // Form
  const [availableFrom,  setAvailableFrom]  = useState(defaultFrom);
  const [dueAt,          setDueAt]          = useState(defaultDue);
  const [title,          setTitle]          = useState(exam.ten_mon ?? '');
  const [instructions,   setInstructions]   = useState('');
  const [submitting,     setSubmitting]     = useState(false);

  // Load classes on mount
  useEffect(() => {
    TeacherApi.getSemesters()
      .then(async r => {
        const hk = r.data.hoc_ky_hien_tai;
        const courses = await TeacherApi.getSemesterCourses(hk);
        const match = courses.data.find(c => c.subject.ma_mon === subject.ma_mon);
        const cls = match?.classes ?? [];
        setClasses(cls);
        if (cls.length > 0) setActiveClassId(cls[0].id_to_hoc);
      })
      .catch(() => {})
      .finally(() => setLoadingClasses(false));
  }, [subject.ma_mon]);

  // Load students when switching to "students" mode or class changes
  useEffect(() => {
    if (mode !== 'students' || !activeClassId) return;
    setLoadingStudents(true);
    setStudents([]);
    setSelected(new Set());
    TeacherApi.getCourseStudents(activeClassId)
      .then(r => setStudents(r.data.students ?? []))
      .catch(() => toast.error('Không thể tải danh sách sinh viên.'))
      .finally(() => setLoadingStudents(false));
  }, [mode, activeClassId]);

  const filteredStudents = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return students;
    return students.filter(s =>
      s.ho_ten.toLowerCase().includes(q) || s.ma_sinh_vien.toLowerCase().includes(q)
    );
  }, [students, search]);

  const toggleStudent = (code: string) =>
    setSelected(prev => { const s = new Set(prev); s.has(code) ? s.delete(code) : s.add(code); return s; });

  const toggleAll = () => {
    if (selected.size === filteredStudents.length && filteredStudents.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredStudents.map(s => s.ma_sinh_vien)));
    }
  };

  const activeClass = classes.find(c => c.id_to_hoc === activeClassId);
  const allFilteredSelected = filteredStudents.length > 0 && filteredStudents.every(s => selected.has(s.ma_sinh_vien));

  const handleSubmit = async () => {
    if (mode === 'class' && !activeClassId) { toast.error('Không tìm thấy lớp học.'); return; }
    if (mode === 'students' && selected.size === 0) { toast.error('Chưa chọn học sinh nào.'); return; }
    if (!availableFrom) { toast.error('Chưa chọn ngày mở bài.'); return; }
    if (!dueAt) { toast.error('Chưa chọn hạn nộp.'); return; }
    if (new Date(availableFrom) <= new Date()) { toast.error('Ngày mở bài phải sau thời điểm hiện tại.'); return; }
    if (new Date(dueAt) <= new Date(availableFrom)) { toast.error('Hạn nộp phải sau ngày mở bài.'); return; }

    setSubmitting(true);
    try {
      const r = await TeacherApi.assignExam(exam.id, {
        ...(mode === 'class'
          ? { id_to_hoc: activeClassId }
          : { student_codes: [...selected] }),
        available_from: toApiDate(availableFrom),
        due_at:         toApiDate(dueAt),
        title:          title.trim() || undefined,
        instructions:   instructions.trim() || undefined,
      });
      if (r.success) {
        toast.success(`Đã giao cho ${r.data?.student_count ?? 0} học sinh!`);
        onSuccess();
      } else {
        toast.error(r.message ?? 'Giao bài thất bại.');
      }
    } catch (e: unknown) {
      const data = (e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
      const detail = data?.errors ? Object.values(data.errors).flat()[0] : data?.message;
      toast.error(detail ?? 'Giao bài thất bại. Vui lòng thử lại.', { duration: 5000 });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{CSS}</style>
      {/* Overlay */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }} />

      {/* Modal */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 201, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 500, maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(15,23,42,0.25)', animation: 'assign-pop .25s cubic-bezier(.34,1.2,.64,1) both' }}>

          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', padding: '18px 20px 16px', borderRadius: '20px 20px 0 0', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Send size={13} color="#93c5fd" />
                  <span style={{ fontSize: '0.65rem', color: '#93c5fd', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Giao đề kiểm tra</span>
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'white', lineHeight: 1.3 }}>{exam.ten_mon || subject.ten_mon}</div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                  {exam.question_count ?? '?'} câu · {exam.time_limit ? `${exam.time_limit} phút` : 'Không giới hạn'}
                </div>
              </div>
              <button onClick={onClose} style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Scrollable body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Mode tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {([['class', 'Cả lớp', Users], ['students', 'Học sinh cụ thể', UserCheck]] as const).map(([m, label, Icon]) => (
                <button key={m} onClick={() => setMode(m)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '9px 0', borderRadius: 11, border: `2px solid ${mode === m ? '#2563eb' : 'rgba(37,99,235,0.12)'}`, background: mode === m ? 'rgba(37,99,235,0.07)' : 'white', color: mode === m ? '#1e3a8a' : '#64748b', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', transition: 'all .15s' }}
                >
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>

            {/* ── Class info (auto) ── */}
            {loadingClasses ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'rgba(37,99,235,0.04)', borderRadius: 11, fontSize: '0.78rem', color: '#94a3b8' }}>
                <Loader2 size={13} style={{ animation: 'assign-spin 1s linear infinite', flexShrink: 0 }} /> Đang tải thông tin lớp...
              </div>
            ) : classes.length === 0 ? (
              <div style={{ padding: '10px 12px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 11, fontSize: '0.78rem', color: '#d97706' }}>
                Không tìm thấy lớp học cho môn này trong học kỳ hiện tại.
              </div>
            ) : (
              <div>
                {/* If multiple classes → show chips to pick which class */}
                {classes.length > 1 && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Chọn lớp</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {classes.map(c => (
                        <button key={c.id_to_hoc} onClick={() => setActiveClassId(c.id_to_hoc)}
                          style={{ padding: '5px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', border: `2px solid ${activeClassId === c.id_to_hoc ? '#2563eb' : 'rgba(37,99,235,0.15)'}`, background: activeClassId === c.id_to_hoc ? 'rgba(37,99,235,0.08)' : 'white', color: activeClassId === c.id_to_hoc ? '#1e3a8a' : '#64748b', transition: 'all .13s' }}
                        >
                          {c.ten_lop}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Class summary pill */}
                {activeClass && mode === 'class' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'linear-gradient(135deg,rgba(30,58,138,0.06),rgba(37,99,235,0.04))', border: '1px solid rgba(37,99,235,0.14)', borderRadius: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(37,99,235,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Users size={16} color="#2563eb" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1e293b' }}>{activeClass.ten_lop} — {activeClass.nhom_to}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 1 }}>
                        {activeClass.sl_dk} học sinh · {activeClass.thoi_gian_hoc}
                      </div>
                    </div>
                  
                  </div>
                )}
              </div>
            )}

            {/* ── Student picker ── */}
            {mode === 'students' && activeClassId && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Search + select-all header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={13} color="#94a3b8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input
                      type="text"
                      placeholder="Tìm theo tên hoặc mã sinh viên..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px 8px 30px', borderRadius: 10, border: '1.5px solid rgba(37,99,235,0.18)', fontSize: '0.78rem', color: '#1e293b', background: 'white', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <button onClick={toggleAll}
                    style={{ flexShrink: 0, padding: '7px 12px', borderRadius: 10, border: `1.5px solid ${allFilteredSelected ? '#2563eb' : 'rgba(37,99,235,0.18)'}`, background: allFilteredSelected ? 'rgba(37,99,235,0.08)' : 'white', color: allFilteredSelected ? '#1e3a8a' : '#64748b', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    {allFilteredSelected ? 'Bỏ chọn' : 'Chọn tất cả'}
                  </button>
                </div>

                {/* Selected count */}
                {selected.size > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'rgba(37,99,235,0.07)', borderRadius: 9 }}>
                    <Check size={12} color="#2563eb" />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e3a8a' }}>Đã chọn {selected.size} học sinh</span>
                    <button onClick={() => setSelected(new Set())} style={{ marginLeft: 'auto', fontSize: '0.68rem', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' }}>Xóa chọn</button>
                  </div>
                )}

                {/* Student list */}
                <div style={{ border: '1px solid rgba(37,99,235,0.1)', borderRadius: 13, overflow: 'hidden', maxHeight: 260, overflowY: 'auto' }}>
                  {loadingStudents ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '2rem', color: '#94a3b8', fontSize: '0.78rem' }}>
                      <Loader2 size={15} style={{ animation: 'assign-spin 1s linear infinite' }} /> Đang tải sinh viên...
                    </div>
                  ) : filteredStudents.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', fontSize: '0.78rem', color: '#94a3b8' }}>
                      {search ? 'Không tìm thấy sinh viên phù hợp.' : 'Danh sách trống.'}
                    </div>
                  ) : (
                    <div style={{ padding: '6px' }}>
                      {filteredStudents.map(s => {
                        const isSelected = selected.has(s.ma_sinh_vien);
                        return (
                          <div key={s.ma_sinh_vien}
                            className={`am-stu-row${isSelected ? ' selected' : ''}`}
                            onClick={() => toggleStudent(s.ma_sinh_vien)}
                          >
                            {/* Checkbox */}
                            <div style={{ flexShrink: 0, width: 18, height: 18, borderRadius: 5, border: `2px solid ${isSelected ? '#2563eb' : '#cbd5e1'}`, background: isSelected ? '#2563eb' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .13s' }}>
                              {isSelected && <Check size={11} color="white" strokeWidth={3} />}
                            </div>
                            {/* Avatar */}
                            <div style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 9, background: 'linear-gradient(135deg,rgba(30,58,138,0.15),rgba(37,99,235,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: 800, color: '#1e3a8a' }}>
                              {s.ten?.[0]?.toUpperCase() ?? '?'}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.ho_ten}</div>
                              <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: 1 }}>{s.ma_sinh_vien}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Dates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {([
                ['Ngày mở bài', availableFrom, setAvailableFrom],
                ['Hạn nộp',    dueAt,          setDueAt],
              ] as [string, string, (v: string) => void][]).map(([label, val, setter]) => (
                <div key={label}>
                  <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#1e3a8a', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={10} /> {label}
                  </label>
                  <input type="datetime-local" value={val} onChange={e => setter(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1.5px solid rgba(37,99,235,0.18)', fontSize: '0.78rem', color: '#1e293b', background: 'white', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
            </div>

            {/* Title */}
            <div>
              <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#1e3a8a', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 5, display: 'block' }}>
                Tiêu đề <span style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 400, textTransform: 'none' }}>(tuỳ chọn)</span>
              </label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="VD: Kiểm tra chương 1 — 3"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1.5px solid rgba(37,99,235,0.18)', fontSize: '0.82rem', color: '#1e293b', background: 'white', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Instructions */}
            <div>
              <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#1e3a8a', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 5, display: 'block' }}>
                Hướng dẫn <span style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 400, textTransform: 'none' }}>(tuỳ chọn)</span>
              </label>
              <textarea value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="Lưu ý cho học sinh khi làm bài..."
                rows={2}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1.5px solid rgba(37,99,235,0.18)', fontSize: '0.82rem', color: '#1e293b', background: 'white', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Footer actions */}
          <div style={{ flexShrink: 0, padding: '14px 20px', borderTop: '1px solid rgba(37,99,235,0.07)', display: 'flex', gap: 10, background: 'white', borderRadius: '0 0 20px 20px' }}>
            <button onClick={onClose} disabled={submitting}
              style={{ flex: 1, padding: '10px', borderRadius: 11, background: 'rgba(100,116,139,0.08)', border: '1px solid rgba(100,116,139,0.15)', color: '#64748b', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
            >Hủy</button>
            <button onClick={handleSubmit} disabled={submitting || loadingClasses || classes.length === 0}
              style={{ flex: 2, padding: '10px', borderRadius: 11, background: (submitting || loadingClasses || classes.length === 0) ? 'rgba(37,99,235,0.3)' : 'linear-gradient(135deg,#1e3a8a,#2563eb)', border: 'none', color: 'white', fontSize: '0.82rem', fontWeight: 700, cursor: (submitting || loadingClasses) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
            >
              {submitting
                ? <><Loader2 size={14} style={{ animation: 'assign-spin 1s linear infinite' }} /> Đang giao...</>
                : <><Send size={14} /> Giao bài{mode === 'students' && selected.size > 0 ? ` (${selected.size} HS)` : ''}</>
              }
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AssignModal;
