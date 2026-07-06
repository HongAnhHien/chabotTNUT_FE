import { type FC, useEffect, useMemo, useState } from 'react';
import { X, Users, UserCheck, Loader2, Send, Search, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import TeacherApi from '@/infra/teacher/teacher_api';
import type { ISavedExam } from '@/infra/api/interfaces/IChat';
import type { ITeacherClass, ITeacherStudent } from '@/infra/api/interfaces/ITeacher';

const CSS = `
  @keyframes assign-spin      { to{transform:rotate(360deg)} }
  @keyframes assign-overlay   { from{opacity:0} to{opacity:1} }
  @keyframes assign-overlay-out{ from{opacity:1} to{opacity:0} }
  @keyframes assign-drawer    { from{transform:translateX(100%)} to{transform:none} }
  @keyframes assign-drawer-out{ from{transform:none} to{transform:translateX(100%)} }
  .am-seg {
    height:46px; border-radius:12px; font-family:inherit; font-size:14px; font-weight:700;
    cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;
    transition:all .15s;
  }
  .am-stu-row {
    display:flex; align-items:center; gap:11px; padding:10px 12px;
    border-bottom:1px solid #f1f5f9; cursor:pointer; transition:background .12s;
  }
  .am-stu-row:last-child { border-bottom:none; }
  .am-stu-row:hover { background:#f8fbff; }
  .am-label {
    display:block; font-size:11.5px; font-weight:700; letter-spacing:.4px;
    color:#475569; text-transform:uppercase; margin-bottom:7px;
  }
  .am-input {
    width:100%; height:44px; border:1px solid #e7ecf3; border-radius:11px;
    padding:0 13px; font-family:inherit; font-size:13.5px; color:#334155;
    outline:none; box-sizing:border-box; transition:border-color .15s;
  }
  .am-input:focus { border-color:#93c5fd; }
  .am-dates { display:grid; grid-template-columns:1fr 1fr; gap:13px; }
  @media(max-width:480px) { .am-dates { grid-template-columns:1fr; } }
`;

interface Props {
  exam: ISavedExam;
  subject: { ma_mon: string; ten_mon: string };
  onClose: () => void;
  onSuccess: () => void;
}

const toApiDate = (dt: string) => dt ? dt.replace('T', ' ') + ':00' : '';

const toLocalInput = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
const defaultFrom = () => { const d = new Date(); d.setMinutes(d.getMinutes() + 5, 0, 0); return toLocalInput(d); };
const defaultDue  = () => { const d = new Date(); d.setDate(d.getDate() + 7); d.setHours(23, 59, 0, 0); return toLocalInput(d); };

const AssignModal: FC<Props> = ({ exam, subject, onClose, onSuccess }) => {
  const [mode,            setMode]           = useState<'class' | 'students'>('class');
  const [classes,         setClasses]        = useState<ITeacherClass[]>([]);
  const [loadingClasses,  setLoadingClasses] = useState(true);
  const [activeClassId,   setActiveClassId]  = useState('');
  const [students,        setStudents]       = useState<ITeacherStudent[]>([]);
  const [loadingStudents, setLoadingStudents]= useState(false);
  const [selected,        setSelected]       = useState<Set<string>>(new Set());
  const [search,          setSearch]         = useState('');
  const [availableFrom,   setAvailableFrom]  = useState(defaultFrom);
  const [dueAt,           setDueAt]          = useState(defaultDue);
  const [title,           setTitle]          = useState(exam.ten_mon ?? '');
  const [instructions,    setInstructions]   = useState('');
  const [submitting,      setSubmitting]     = useState(false);
  const [closing,         setClosing]        = useState(false);

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 240);
  };

  useEffect(() => {
    TeacherApi.getSemesters()
      .then(async r => {
        const hk      = r.data.hoc_ky_hien_tai;
        const courses  = await TeacherApi.getSemesterCourses(hk);
        const match    = courses.data.find(c => c.subject.ma_mon === subject.ma_mon);
        const cls      = match?.classes ?? [];
        setClasses(cls);
        if (cls.length > 0) setActiveClassId(cls[0].id_to_hoc);
      })
      .catch(() => {})
      .finally(() => setLoadingClasses(false));
  }, [subject.ma_mon]);

  useEffect(() => {
    if (mode !== 'students' || !activeClassId) return;
    Promise.resolve().then(() => {
      setLoadingStudents(true);
      setStudents([]);
      setSelected(new Set());
    });
    TeacherApi.getCourseStudents(activeClassId)
      .then(r => setStudents(r.data.students ?? []))
      .catch(() => toast.error('Không thể tải danh sách sinh viên.'))
      .finally(() => setLoadingStudents(false));
  }, [mode, activeClassId]);

  const filteredStudents = useMemo(() => {
    const q = search.toLowerCase().trim();
    return q ? students.filter(s => s.ho_ten.toLowerCase().includes(q) || s.ma_sinh_vien.toLowerCase().includes(q)) : students;
  }, [students, search]);

  const toggleStudent = (code: string) =>
    setSelected(prev => { const s = new Set(prev); s.has(code) ? s.delete(code) : s.add(code); return s; });

  const toggleAll = () => {
    if (selected.size === filteredStudents.length && filteredStudents.length > 0) setSelected(new Set());
    else setSelected(new Set(filteredStudents.map(s => s.ma_sinh_vien)));
  };

  const activeClass = classes.find(c => c.id_to_hoc === activeClassId);
  const allFilteredSelected = filteredStudents.length > 0 && filteredStudents.every(s => selected.has(s.ma_sinh_vien));

  const targetCount = mode === 'class' ? (activeClass?.sl_dk ?? 0) : selected.size;

  const handleSubmit = async () => {
    if (mode === 'class' && !activeClassId)   { toast.error('Không tìm thấy lớp học.'); return; }
    if (mode === 'students' && selected.size === 0) { toast.error('Chưa chọn học sinh nào.'); return; }
    if (!availableFrom) { toast.error('Chưa chọn ngày mở bài.'); return; }
    if (!dueAt)         { toast.error('Chưa chọn hạn nộp.'); return; }
    if (new Date(availableFrom) <= new Date()) { toast.error('Ngày mở bài phải sau thời điểm hiện tại.'); return; }
    if (new Date(dueAt) <= new Date(availableFrom)) { toast.error('Hạn nộp phải sau ngày mở bài.'); return; }

    setSubmitting(true);
    try {
      const r = await TeacherApi.assignExam(exam.id, {
        ...(mode === 'class' ? { id_to_hoc: activeClassId } : { student_codes: [...selected] }),
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
      toast.error((data?.errors ? Object.values(data.errors).flat()[0] : data?.message) ?? 'Giao bài thất bại. Vui lòng thử lại.', { duration: 5000 });
    } finally { setSubmitting(false); }
  };

  return (
    <>
      <style>{CSS}</style>

      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(15,23,42,.52)', backdropFilter: 'blur(2px)', animation: `${closing ? 'assign-overlay-out' : 'assign-overlay'} .22s ease forwards` }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'min(580px,100vw)', background: '#fff',
        zIndex: 201, display: 'flex', flexDirection: 'column',
        boxShadow: '-20px 0 50px rgba(15,23,42,.22)',
        animation: `${closing ? 'assign-drawer-out' : 'assign-drawer'} .24s cubic-bezier(.2,.8,.2,1) forwards`,
        fontFamily: "'Be Vietnam Pro',system-ui,sans-serif",
        overflowX: 'hidden',
      }}>

        {/* Header */}
        <div style={{ flexShrink: 0, padding: '22px 24px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 6px 14px rgba(37,99,235,.28)' }}>
              <Send size={20} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: .8, color: '#94a3b8', textTransform: 'uppercase' }}>Giao đề kiểm tra</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginTop: 2, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {exam.ten_mon || subject.ten_mon}
              </div>
              <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 2 }}>
                {exam.question_count ?? '?'} câu · {exam.time_limit ? `${exam.time_limit} phút` : 'Không giới hạn'}
              </div>
            </div>
            <button onClick={handleClose} style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 10, border: '1px solid #e7ecf3', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Mode selector */}
          <div>
            <label className="am-label">Giao cho</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {([
                ['class',    'Cả lớp',            Users],
                ['students', 'Học sinh cụ thể',   UserCheck],
              ] as const).map(([m, label, Icon]) => {
                const on = mode === m;
                return (
                  <button key={m} onClick={() => setMode(m)} className="am-seg"
                    style={{ border: `2px solid ${on ? '#2563eb' : '#e7ecf3'}`, background: on ? '#eff5ff' : '#fff', color: on ? '#1d4ed8' : '#64748b' }}
                  >
                    <Icon size={17} /> {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Class info */}
          {loadingClasses ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', background: '#f8fafc', borderRadius: 12, fontSize: 13, color: '#94a3b8' }}>
              <Loader2 size={14} style={{ animation: 'assign-spin 1s linear infinite', flexShrink: 0 }} /> Đang tải thông tin lớp...
            </div>
          ) : classes.length === 0 ? (
            <div style={{ padding: '12px 14px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, fontSize: 13, color: '#c2410c' }}>
              Không tìm thấy lớp học cho môn này trong học kỳ hiện tại.
            </div>
          ) : (
            <div>
              {classes.length > 1 && (
                <div style={{ marginBottom: 10 }}>
                  <label className="am-label">Chọn lớp</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {classes.map(c => (
                      <button key={c.id_to_hoc} onClick={() => setActiveClassId(c.id_to_hoc)}
                        style={{ padding: '5px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', border: `2px solid ${activeClassId === c.id_to_hoc ? '#2563eb' : '#e7ecf3'}`, background: activeClassId === c.id_to_hoc ? '#eff5ff' : '#fff', color: activeClassId === c.id_to_hoc ? '#1d4ed8' : '#64748b', transition: 'all .13s' }}
                      >
                        {c.ten_lop}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeClass && mode === 'class' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '15px 16px', border: '1px solid #bfdbfe', borderRadius: 14, background: '#eff5ff' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: '#fff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Users size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14.5, fontWeight: 800, color: '#0f172a' }}>{activeClass.ten_lop} — {activeClass.nhom_to}</div>
                    <div style={{ fontSize: 12.5, color: '#2563eb', fontWeight: 600, marginTop: 2 }}>Toàn bộ {activeClass.sl_dk} học sinh · {activeClass.thoi_gian_hoc}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Student picker */}
          {mode === 'students' && activeClassId && (
            <div>
              <div style={{ display: 'flex', gap: 9, marginBottom: 11 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Tìm tên hoặc mã SV..."
                    className="am-input"
                    style={{ paddingLeft: 36, height: 42, fontSize: 13 }}
                  />
                </div>
                <button onClick={toggleAll}
                  style={{ height: 42, padding: '0 14px', border: '1px solid #e7ecf3', borderRadius: 11, background: '#fff', color: '#2563eb', fontWeight: 700, fontSize: 12.5, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#eff5ff')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                >
                  {allFilteredSelected ? 'Bỏ chọn' : 'Chọn tất cả'}
                </button>
              </div>

              {selected.size > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9, padding: '7px 11px', background: '#eff5ff', border: '1px solid #bfdbfe', borderRadius: 9 }}>
                  <Check size={13} color="#2563eb" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1d4ed8', flex: 1 }}>Đã chọn {selected.size} học sinh</span>
                  <button onClick={() => setSelected(new Set())} style={{ fontSize: 12, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', fontFamily: 'inherit' }}>Xóa</button>
                </div>
              )}

              <div style={{ border: '1px solid #e7ecf3', borderRadius: 13, maxHeight: 300, overflowY: 'auto' }}>
                {loadingStudents ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '2rem', color: '#94a3b8', fontSize: 13 }}>
                    <Loader2 size={15} style={{ animation: 'assign-spin 1s linear infinite' }} /> Đang tải sinh viên...
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>
                    {search ? 'Không tìm thấy sinh viên phù hợp.' : 'Danh sách trống.'}
                  </div>
                ) : filteredStudents.map(s => {
                  const isSelected = selected.has(s.ma_sinh_vien);
                  return (
                    <div key={s.ma_sinh_vien} className="am-stu-row" onClick={() => toggleStudent(s.ma_sinh_vien)}>
                      <span style={{ flexShrink: 0, width: 20, height: 20, borderRadius: 6, border: `2px solid ${isSelected ? '#2563eb' : '#cbd5e1'}`, background: isSelected ? '#2563eb' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .13s' }}>
                        {isSelected && <Check size={12} color="white" strokeWidth={3} />}
                      </span>
                      <span style={{ width: 34, height: 34, borderRadius: 9, background: '#eff5ff', color: '#2563eb', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {(s.ten?.[0] ?? s.ho_ten?.[0] ?? '?').toUpperCase()}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.ho_ten}</div>
                        <div style={{ fontSize: 11.5, color: '#94a3b8', fontFamily: 'monospace' }}>{s.ma_sinh_vien}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="am-dates">
            {([
              ['Ngày mở bài', availableFrom, setAvailableFrom],
              ['Hạn nộp',     dueAt,         setDueAt],
            ] as [string, string, (v: string) => void][]).map(([label, val, setter]) => (
              <div key={label}>
                <label className="am-label">{label}</label>
                <input type="datetime-local" value={val} onChange={e => setter(e.target.value)} className="am-input" />
              </div>
            ))}
          </div>

          {/* Title */}
          <div>
            <label className="am-label">
              Tiêu đề <span style={{ fontSize: 11.5, fontWeight: 500, color: '#94a3b8', textTransform: 'none', letterSpacing: 0 }}>(tuỳ chọn)</span>
            </label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="VD: Kiểm tra chương 2 — Điều chế số" className="am-input" />
          </div>

          {/* Instructions */}
          <div>
            <label className="am-label">
              Hướng dẫn <span style={{ fontSize: 11.5, fontWeight: 500, color: '#94a3b8', textTransform: 'none', letterSpacing: 0 }}>(tuỳ chọn)</span>
            </label>
            <textarea
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="Lưu ý cho học sinh khi làm bài..."
              style={{ width: '100%', minHeight: 78, border: '1px solid #e7ecf3', borderRadius: 11, padding: '11px 13px', fontFamily: 'inherit', fontSize: 13.5, color: '#334155', outline: 'none', resize: 'vertical', boxSizing: 'border-box', transition: 'border-color .15s' }}
              onFocus={e  => (e.target.style.borderColor = '#93c5fd')}
              onBlur={e   => (e.target.style.borderColor = '#e7ecf3')}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ flexShrink: 0, padding: '16px 24px', borderTop: '1px solid #f1f5f9', background: '#fbfcfe' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748b', marginBottom: 12 }}>
            <Users size={15} color="#2563eb" />
            Sẽ giao cho <b style={{ color: '#2563eb', marginLeft: 4 }}>{targetCount}</b>&nbsp;học sinh
          </div>
          <div style={{ display: 'flex', gap: 11 }}>
            <button onClick={handleClose} disabled={submitting}
              style={{ flexShrink: 0, height: 46, padding: '0 24px', border: '1px solid #e7ecf3', borderRadius: 12, background: '#fff', color: '#475569', fontWeight: 600, fontSize: 14, fontFamily: 'inherit', cursor: 'pointer' }}
            >
              Hủy
            </button>
            <button onClick={handleSubmit} disabled={submitting || loadingClasses || classes.length === 0}
              style={{ flex: 1, height: 46, border: 'none', borderRadius: 12, background: (submitting || loadingClasses || classes.length === 0) ? 'rgba(37,99,235,.3)' : 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff', fontWeight: 700, fontSize: 14.5, fontFamily: 'inherit', cursor: (submitting || loadingClasses) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, boxShadow: '0 8px 18px rgba(37,99,235,.28)' }}
              onMouseEnter={e => { if (!submitting && !loadingClasses && classes.length > 0) (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.06)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.filter = 'none'; }}
            >
              {submitting
                ? <><Loader2 size={16} style={{ animation: 'assign-spin 1s linear infinite' }} /> Đang giao...</>
                : <><Send size={17} /> Giao bài{mode === 'students' && selected.size > 0 ? ` (${selected.size} HS)` : ''}</>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AssignModal;
