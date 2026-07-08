import { type FC, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import {
  ArrowLeft, Loader2, BookOpen, Search, X,
  AlertTriangle, CalendarDays, Clock, ChevronDown, Mail, Sparkles, Users, CheckCircle,
  Download, Send, Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import TeacherApi from '@/infra/teacher/teacher_api';
import type { IClassAnalytics, ITeacherStudent, IScheduleItem } from '@/infra/api/interfaces/ITeacher';
import CSS from './analytics.styles';
import ClassAnalyticsView, { StatCard } from './ClassAnalyticsView';

// ── Constants ────────────────────────────────────────────
const WARN_CFG = {
  rat_nguy_co: { color:'#dc2626', bg:'rgba(220,38,38,0.09)', cls:'warn-red',    label:'Rất nguy cơ' },
  nguy_co:     { color:'#ea580c', bg:'rgba(234,88,12,0.09)',  cls:'warn-orange', label:'Nguy cơ' },
  nhe:         { color:'#d97706', bg:'rgba(217,119,6,0.09)',  cls:'warn-yellow', label:'Cần chú ý' },
} as const;
const STATUS_OK = { color:'#16a34a', bg:'rgba(22,163,74,0.09)', label:'Bình thường' };

const AI_USAGE_CFG: Record<string, { label: string; bg: string; color: string }> = {
  high: { label:'Tích cực',  bg:'rgba(124,58,237,0.09)', color:'#7c3aed' },
  mid:  { label:'Vừa phải',  bg:'rgba(79,70,229,0.09)',  color:'#4f46e5' },
  low:  { label:'Ít dùng',   bg:'rgba(100,116,139,0.08)', color:'#64748b' },
  none: { label:'Chưa dùng', bg:'rgba(148,163,184,0.08)', color:'#94a3b8' },
};
const AI_USAGE_UNKNOWN = { label:'Chưa có dữ liệu', bg:'#f8fafc', color:'#cbd5e1' };

function progressColor(pct: number) {
  if (pct >= 70) return '#16a34a';
  if (pct >= 40) return '#2563eb';
  return '#f97316';
}

const EXAM_TYPE: Record<string, string> = {
  giua_ky:         'Giữa kỳ',
  kiem_tra_chuong: 'Kiểm tra chương',
  on_luyen_chuong: 'Ôn luyện chương',
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
}
function isPast(iso: string) { return new Date(iso) < new Date(); }
function initials(name: string) {
  const parts = name.trim().split(' ');
  return (parts.pop()?.[0] ?? '?').toUpperCase();
}

// ── Student row ──────────────────────────────────────────
const StudentListHeader: FC = () => (
  <div className="an-list-header">
    <div>#</div>
    <div>Học sinh</div>
    <div>Tiến độ bài tập</div>
    <div>Trợ lý AI</div>
    <div>Trạng thái</div>
  </div>
);

const StudentRow: FC<{ student: ITeacherStudent; idx: number }> = ({ student, idx }) => {
  const w = student.warning_level ? WARN_CFG[student.warning_level] : null;
  const status = w ?? STATUS_OK;
  const pct = student.total_assignments
    ? Math.round(((student.total_assignments - (student.pending_assignments ?? 0)) / student.total_assignments) * 100)
    : null;
  const ai = student.ai_usage_level ? AI_USAGE_CFG[student.ai_usage_level] : AI_USAGE_UNKNOWN;

  return (
    <div className={`an-student-row ${w?.cls ?? ''}`}>
      {/* Index + avatar */}
      <div style={{ fontSize:'0.7rem', color:'#94a3b8', width:22, textAlign:'right', flexShrink:0 }}>{idx + 1}</div>
      <div style={{
        width:36, height:36, borderRadius:10, flexShrink:0,
        background: w ? w.bg : 'rgba(37,99,235,0.09)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontWeight:800, fontSize:'0.8rem', color: w ? w.color : '#2563eb',
      }}>
        {initials(student.ho_ten)}
      </div>

      {/* Name + info */}
      <div style={{ flex:'1 1 180px', minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:7, flexWrap:'wrap' }}>
          <span style={{ fontWeight:700, fontSize:'0.86rem', color:'#0f172a' }}>{student.ho_ten}</span>
          <span style={{ fontSize:'0.7rem', color:'#94a3b8' }}>{student.ma_sinh_vien}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:3, fontSize:'0.72rem', color:'#94a3b8' }}>
          <Mail size={10} />{student.e_mail}
        </div>
      </div>

      {/* Tiến độ bài tập */}
      <div style={{ flex:'0 1 170px', minWidth:130 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5, gap:8 }}>
          <span style={{ fontSize:'0.68rem', color:'#94a3b8', fontWeight:500 }}>Bài tập</span>
          <span style={{ fontSize:'0.75rem', fontWeight:700, color: pct !== null ? progressColor(pct) : '#94a3b8' }}>
            {pct !== null ? `${pct}%` : '—'}
          </span>
        </div>
        <div style={{ height:7, borderRadius:6, background:'#eef2f7', overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${pct ?? 0}%`, borderRadius:6, background: pct !== null ? progressColor(pct) : '#e2e8f0' }} />
        </div>
      </div>

      {/* Trợ lý AI */}
      <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 11px', borderRadius:20, fontSize:'0.72rem', fontWeight:600, background:ai.bg, color:ai.color, flexShrink:0, whiteSpace:'nowrap' }}>
        <Sparkles size={11} /> {ai.label}
      </span>

      {/* Trạng thái */}
      <span style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'5px 12px', borderRadius:20, fontSize:'0.72rem', fontWeight:600, background:status.bg, color:status.color, flexShrink:0, whiteSpace:'nowrap' }}>
        <span style={{ width:7, height:7, borderRadius:'50%', background:status.color }} />{status.label}
      </span>
    </div>
  );
};

// ── Assignment card ──────────────────────────────────────
function daysLeftLabel(dueIso: string): { label: string; color: string } {
  const ms = new Date(dueIso).getTime() - Date.now();
  if (ms <= 0) return { label:'Quá hạn', color:'#dc2626' };
  const days = Math.ceil(ms / 86_400_000);
  return { label: days <= 1 ? 'Còn hôm nay' : `Còn ${days} ngày`, color: days <= 2 ? '#dc2626' : '#f97316' };
}

const AssignmentCard: FC<{ item: IScheduleItem; idx: number }> = ({ item, idx }) => {
  const [open, setOpen] = useState(false);
  const [remindingAll, setRemindingAll] = useState(false);
  const [remindingIds, setRemindingIds] = useState<Set<string>>(new Set());
  const [remindedIds,  setRemindedIds]  = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);

  const pct     = item.total_students > 0 ? Math.round(item.submitted / item.total_students * 100) : 0;
  const overdue = isPast(item.due_at);
  const notSubmitted = item.total_students - item.submitted;
  const ringLen = 2 * Math.PI * 44;
  const ringOff = ringLen * (1 - pct / 100);
  const left = daysLeftLabel(item.due_at);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { blob, filename } = await TeacherApi.exportAssignmentRoster(item.assignment_id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Không thể xuất danh sách. Vui lòng thử lại.');
    } finally {
      setExporting(false);
    }
  };

  const handleRemindAll = async () => {
    setRemindingAll(true);
    try {
      const res = await TeacherApi.remindAllPending(item.assignment_id);
      toast.success(res.message || 'Đã gửi nhắc nhở.');
      setRemindedIds(new Set(item.pending_students.map(s => s.ma_sinh_vien)));
    } catch {
      toast.error('Không thể gửi nhắc nhở. Vui lòng thử lại.');
    } finally {
      setRemindingAll(false);
    }
  };

  const handleRemindOne = async (maSinhVien: string) => {
    setRemindingIds(prev => new Set(prev).add(maSinhVien));
    try {
      const res = await TeacherApi.remindStudent(item.assignment_id, maSinhVien);
      toast.success(res.message || 'Đã gửi nhắc nhở.');
      setRemindedIds(prev => new Set(prev).add(maSinhVien));
    } catch {
      toast.error('Không thể gửi nhắc nhở. Vui lòng thử lại.');
    } finally {
      setRemindingIds(prev => { const next = new Set(prev); next.delete(maSinhVien); return next; });
    }
  };

  return (
    <div style={{ border:'1px solid #e8edf3', borderRadius:12, overflow:'hidden', background:'white' }}>
      <div
        style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 16px', cursor:'pointer', userSelect:'none', transition:'background .13s' }}
        onClick={() => setOpen(v => !v)}
        onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.background = '#f8fafc')}
        onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = 'white')}
      >
        <div style={{ width:32, height:32, borderRadius:9, background: overdue && item.pending_count > 0 ? 'rgba(220,38,38,0.08)' : 'rgba(37,99,235,0.08)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <span style={{ fontSize:'0.72rem', fontWeight:800, color: overdue && item.pending_count > 0 ? '#dc2626' : '#2563eb' }}>{idx + 1}</span>
        </div>

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:7, flexWrap:'wrap' }}>
            <span style={{ fontWeight:700, fontSize:'0.86rem', color:'#0f172a' }}>{item.title}</span>
            <span style={{ fontSize:'0.64rem', fontWeight:700, color:'#7c3aed', background:'rgba(124,58,237,0.08)', borderRadius:5, padding:'1px 7px' }}>
              {EXAM_TYPE[item.exam_type] ?? item.exam_type}
            </span>
            {overdue && item.pending_count > 0 && (
              <span style={{ fontSize:'0.64rem', fontWeight:700, color:'#dc2626', background:'rgba(220,38,38,0.08)', borderRadius:5, padding:'1px 7px' }}>
                {item.pending_count} chưa nộp
              </span>
            )}
            {!overdue && (
              <span style={{ fontSize:'0.64rem', fontWeight:700, color:'#16a34a', background:'rgba(22,163,74,0.08)', borderRadius:5, padding:'1px 7px' }}>
                Đang mở
              </span>
            )}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:5, flexWrap:'wrap' }}>
            <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:'0.7rem', color:'#64748b' }}>
              <Clock size={10} />{fmtDate(item.available_from)} → {fmtDate(item.due_at)}
            </span>
            <span style={{ fontSize:'0.7rem', color:'#64748b' }}>{item.submitted}/{item.total_students} đã nộp ({pct}%)</span>
          </div>
          <div style={{ marginTop:6 }}>
            <div style={{ height:5, borderRadius:3, background:'#e2e8f0', overflow:'hidden' }}>
              <div style={{ height:'100%', borderRadius:3, width:`${pct}%`, background: pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444', transition:'width .5s ease' }} />
            </div>
          </div>
        </div>

        <ChevronDown size={14} color="#94a3b8" style={{ flexShrink:0, transition:'transform .2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </div>

      {open && (
        <div style={{ borderTop:'1px solid #f1f5f9', background:'#fafbfd', padding:'16px', animation:'an-expand .2s ease both', display:'flex', flexDirection:'column', gap:14 }}>

          {/* Ring + summary stats */}
          <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:20 }}>
            <div style={{ width:88, height:88, position:'relative', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width={88} height={88} viewBox="0 0 104 104" style={{ transform:'rotate(-90deg)' }}>
                <circle cx={52} cy={52} r={44} fill="none" stroke="#e7edf6" strokeWidth={11} />
                <circle cx={52} cy={52} r={44} fill="none" stroke="#2563eb" strokeWidth={11} strokeLinecap="round" strokeDasharray={ringLen} strokeDashoffset={ringOff} />
              </svg>
              <div style={{ position:'absolute', textAlign:'center' }}>
                <div style={{ fontSize:'1.15rem', fontWeight:800, color:'#2563eb', lineHeight:1 }}>{pct}%</div>
                <div style={{ fontSize:'0.6rem', color:'#94a3b8' }}>đã nộp</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap', flex:1 }}>
              <div className="an-stat-card" style={{ padding:'10px 14px', flex:'1 1 120px' }}>
                <div style={{ fontSize:'0.68rem', color:'#94a3b8' }}>Đã nộp</div>
                <div style={{ fontSize:'1.15rem', fontWeight:800, color:'#16a34a' }}>{item.submitted}</div>
              </div>
              <div className="an-stat-card" style={{ padding:'10px 14px', flex:'1 1 120px' }}>
                <div style={{ fontSize:'0.68rem', color:'#94a3b8' }}>Chưa nộp</div>
                <div style={{ fontSize:'1.15rem', fontWeight:800, color:'#dc2626' }}>{notSubmitted}</div>
              </div>
              <div className="an-stat-card" style={{ padding:'10px 14px', flex:'1 1 120px' }}>
                <div style={{ fontSize:'0.68rem', color:'#94a3b8' }}>Thời hạn</div>
                <div style={{ fontSize:'0.95rem', fontWeight:800, color:left.color }}>{left.label}</div>
              </div>
            </div>
          </div>

          {item.pending_students.length > 0 && (
            <>
              {/* Bulk action bar */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10, background:'white', border:'1px solid #eaf0f7', borderRadius:12, padding:'10px 14px' }}>
                <span style={{ fontSize:'0.76rem', fontWeight:700, color:'#334155' }}>Chưa nộp bài · {item.pending_students.length} học sinh</span>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  <button onClick={handleExport} disabled={exporting} className="an-back-btn" style={{ background:'white' }}>
                    {exporting ? <Loader2 size={12} style={{ animation:'an-spin 1s linear infinite' }} /> : <Download size={12} />} Xuất danh sách
                  </button>
                  <button
                    onClick={handleRemindAll}
                    disabled={remindingAll}
                    style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:8, border:'none', background:'#2563eb', color:'white', fontSize:'0.76rem', fontWeight:600, cursor: remindingAll ? 'not-allowed' : 'pointer', opacity: remindingAll ? 0.7 : 1 }}
                  >
                    {remindingAll ? <Loader2 size={12} style={{ animation:'an-spin 1s linear infinite' }} /> : <Send size={12} />} Nhắc tất cả chưa nộp
                  </button>
                </div>
              </div>

              {/* Pending list */}
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {item.pending_students.map(s => {
                  const reminding = remindingIds.has(s.ma_sinh_vien);
                  const reminded  = remindedIds.has(s.ma_sinh_vien);
                  return (
                    <div key={s.ma_sinh_vien} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 10px', background:'white', borderRadius:8, border:'1px solid #f1f5f9', flexWrap:'wrap' }}>
                      <div style={{ width:26, height:26, borderRadius:7, background:'rgba(220,38,38,0.08)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <span style={{ fontSize:'0.62rem', fontWeight:800, color:'#dc2626' }}>{initials(s.ho_ten)}</span>
                      </div>
                      <div style={{ flex:'1 1 140px', minWidth:0 }}>
                        <div style={{ fontSize:'0.8rem', fontWeight:600, color:'#1e293b' }}>{s.ho_ten}</div>
                        <div style={{ fontSize:'0.68rem', color:'#94a3b8' }}>{s.ma_sinh_vien}</div>
                      </div>
                      <button
                        onClick={() => handleRemindOne(s.ma_sinh_vien)}
                        disabled={reminding || reminded}
                        style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 11px', borderRadius:8, border:'1px solid', borderColor: reminded ? '#d6efe0' : '#c9ddfb', background: reminded ? '#f0faf4' : '#eef4ff', color: reminded ? '#16a34a' : '#2563eb', fontSize:'0.7rem', fontWeight:600, cursor: reminding || reminded ? 'default' : 'pointer', flexShrink:0 }}
                      >
                        {reminding ? <Loader2 size={11} style={{ animation:'an-spin 1s linear infinite' }} /> : reminded ? <Check size={11} /> : <Mail size={11} />}
                        {reminded ? 'Đã nhắc' : 'Nhắc nhở'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ── Custom filter dropdown ────────────────────────────────
interface DropdownOption { value: string; label: string }

const FilterDropdown: FC<{
  value: string;
  options: DropdownOption[];
  onChange: (v: string) => void;
}> = ({ value, options, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const current = options.find(o => o.value === value);

  return (
    <div ref={ref} className="an-dd">
      <button type="button" className={`an-dd-trigger${open ? ' open' : ''}`} onClick={() => setOpen(o => !o)}>
        <span className="an-dd-label">{current?.label ?? ''}</span>
        <ChevronDown size={14} className="an-dd-chevron" />
      </button>
      {open && (
        <div className="an-dd-menu">
          {options.map(o => (
            <button
              key={o.value}
              type="button"
              className={`an-dd-item${value === o.value ? ' on' : ''}`}
              onClick={() => { onChange(o.value); setOpen(false); }}
            >
              <span>{o.label}</span>
              {value === o.value && <Check size={13} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Page ─────────────────────────────────────────────────
const ClassAnalyticsPage: FC = () => {
  const { idToHoc } = useParams<{ idToHoc: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Analytics
  const [data,    setData]    = useState<IClassAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  // Tabs
  const [tab, setTab] = useState(() => {
    const t = Number(searchParams.get('tab'));
    return t === 1 || t === 2 ? t : 0;
  });

  // Students tab
  const [students,       setStudents]       = useState<ITeacherStudent[]>([]);
  const [studentTotal,   setStudentTotal]   = useState(0);
  const [studentsLoaded, setStudentsLoaded] = useState(false);
  const [studentsLoading,setStudentsLoading]= useState(false);
  const [searchInput,    setSearchInput]    = useState('');
  const [search,         setSearch]         = useState('');
  const [statusFilter,   setStatusFilter]   = useState('');
  const [levelFilter,    setLevelFilter]    = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load analytics
  useEffect(() => {
    if (!idToHoc) return;
    TeacherApi.getClassAnalytics(idToHoc)
      .then(res => setData(res.data))
      .catch(() => toast.error('Không thể tải dữ liệu lớp.'))
      .finally(() => setLoading(false));
  }, [idToHoc]);

  const loadStudents = useCallback((q: string, status: string, level: string) => {
    if (!idToHoc) return;
    setStudentsLoading(true);
    TeacherApi.getCourseStudents(idToHoc, {
      search:        q      || undefined,
      status:        status || undefined,
      warning_level: level  || undefined,
    })
      .then(res => {
        setStudents(res.data.students);
        setStudentTotal(res.data.total);
        setStudentsLoaded(true);
      })
      .catch(() => toast.error('Không thể tải danh sách học sinh.'))
      .finally(() => setStudentsLoading(false));
  }, [idToHoc]);

  useEffect(() => {
    if (tab === 1 && !studentsLoaded) loadStudents('', '', '');
  }, [tab, studentsLoaded, loadStudents]);

  const handleSearch = (val: string) => {
    setSearchInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(val);
      loadStudents(val, statusFilter, levelFilter);
    }, 400);
  };

  const handleStatusFilter = (val: string) => {
    setStatusFilter(val);
    if (val === '') setLevelFilter('');
    loadStudents(search, val, val === '' ? '' : levelFilter);
  };

  const handleLevelFilter = (val: string) => {
    setLevelFilter(val);
    loadStudents(search, statusFilter, val);
  };

  const attentionCount = data?.attention_count ?? 0;

  return (
    <div style={{ minHeight:'100%', background:'#f4f6fb' }}>
      <style>{CSS}</style>

      {/* ── Sticky header ── */}
      <div className="an-sticky-header">
        <div className="an-header-inner">
          <button className="an-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={13} /> Quay lại
          </button>
          {data && (
            <>
              <div style={{ width:1, height:20, background:'#e2e8f0', flexShrink:0 }} />
              <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
                <div style={{ width:32, height:32, borderRadius:9, background:'linear-gradient(135deg,#1e3a8a,#2563eb)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <BookOpen size={16} color="white" strokeWidth={1.8} />
                </div>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontWeight:800, fontSize:'0.95rem', color:'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{data.ten_lop}</div>
                  <div style={{ fontSize:'0.7rem', color:'#64748b', marginTop:1 }}>{data.ten_mon} · {data.ma_mon}</div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Tab bar */}
        <div className="an-tabs">
          <button className={`an-tab-btn ${tab === 0 ? 'active' : ''}`} onClick={() => setTab(0)}>
            Tổng quan
          </button>
          <button className={`an-tab-btn ${tab === 1 ? 'active' : ''}`} onClick={() => setTab(1)}>
            Danh sách học sinh
            {data && <span className="an-tab-badge">{data.total_students}</span>}
            {attentionCount > 0 && <span className="an-tab-badge red">{attentionCount}</span>}
          </button>
          <button className={`an-tab-btn ${tab === 2 ? 'active' : ''}`} onClick={() => setTab(2)}>
            Bài kiểm tra đã giao
            {data && data.schedule.length > 0 && <span className="an-tab-badge">{data.schedule.length}</span>}
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="an-content">
        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', alignItems:'center', padding:'5rem', gap:10, color:'#64748b', fontSize:'0.85rem' }}>
            <Loader2 size={20} color="#2563eb" style={{ animation:'an-spin 1s linear infinite' }} />
            Đang tải...
          </div>
        ) : !data ? (
          <div className="an-card" style={{ padding:'3rem', textAlign:'center', color:'#94a3b8', fontSize:'0.85rem' }}>Không có dữ liệu</div>
        ) : (
          <>
            {/* Tab 0 — Overview */}
            {tab === 0 && <ClassAnalyticsView data={data} />}

            {/* Tab 1 — Student list */}
            {tab === 1 && (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

                {/* Summary stat strip */}
                <div className="an-stat-grid">
                  <StatCard icon={<Users size={15} color="#4f46e5" />} label="Sĩ số lớp" color="#4f46e5" value={data.total_students} sub={data.ten_lop} />
                  <StatCard icon={<Sparkles size={15} color="#7c3aed" />} label="Đã dùng AI" color="#7c3aed" value={data.ai_users} sub={`${data.total_students > 0 ? Math.round(data.ai_users / data.total_students * 100) : 0}% sĩ số`} />
                  <StatCard icon={<CheckCircle size={15} color="#2563eb" />} label="Hoàn thành TB" color="#2563eb" value={`${data.assignments.completion_rate.toFixed(0)}%`} sub={`${data.assignments.total_submitted} lượt nộp`} />
                  <StatCard icon={<AlertTriangle size={15} color="#f97316" />} label="Cần chú ý" color="#f97316" value={attentionCount} sub={attentionCount > 0 ? 'chậm tiến độ' : 'Tốt'} />
                </div>

                {/* Toolbar: search + custom dropdowns */}
                <div className="an-toolbar-row">
                  {/* Search */}
                  <div className="an-search-box">
                    <Search size={14} color="#94a3b8" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                    <input
                      type="text"
                      value={searchInput}
                      onChange={e => handleSearch(e.target.value)}
                      placeholder="Tìm tên, mã sinh viên..."
                      style={{ width:'100%', boxSizing:'border-box', paddingLeft:32, paddingRight: search ? 30 : 12, paddingTop:8, paddingBottom:8, borderRadius:10, border:'1.5px solid rgba(37,99,235,0.18)', fontSize:'0.78rem', color:'#1e293b', outline:'none', background:'white', transition:'border-color .15s' }}
                      onFocus={e => (e.target.style.borderColor = 'rgba(37,99,235,0.5)')}
                      onBlur={e  => (e.target.style.borderColor = 'rgba(37,99,235,0.18)')}
                    />
                    {search && (
                      <button onClick={() => handleSearch('')} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', padding:0, display:'flex' }}>
                        <X size={13} color="#94a3b8" />
                      </button>
                    )}
                  </div>

                  {/* Trạng thái */}
                  <FilterDropdown
                    value={statusFilter === '' ? 'all' : 'attention'}
                    options={[
                      { value:'all',       label:`Tất cả (${studentTotal})` },
                      { value:'attention', label:`Cần chú ý (${attentionCount})` },
                    ]}
                    onChange={v => handleStatusFilter(v === 'all' ? '' : 'attention')}
                  />

                  {/* Mức độ — chỉ hiện khi đang lọc "Cần chú ý" */}
                  {statusFilter === 'attention' && (
                    <FilterDropdown
                      value={levelFilter || 'all'}
                      options={[
                        { value:'all', label:'Tất cả mức độ' },
                        { value:'nhe', label: WARN_CFG.nhe.label },
                        { value:'nguy_co', label: WARN_CFG.nguy_co.label },
                        { value:'rat_nguy_co', label: WARN_CFG.rat_nguy_co.label },
                      ]}
                      onChange={v => handleLevelFilter(v === 'all' ? '' : v)}
                    />
                  )}
                </div>

                {/* Count */}
                {!studentsLoading && (
                  <div style={{ fontSize:'0.72rem', color:'#94a3b8' }}>
                    {statusFilter || levelFilter || search ? `${students.length} kết quả` : `${studentTotal} học sinh`}
                  </div>
                )}

                {/* List */}
                {studentsLoading ? (
                  <div style={{ display:'flex', justifyContent:'center', padding:'3rem', gap:8, color:'#64748b', fontSize:'0.82rem' }}>
                    <Loader2 size={18} color="#2563eb" style={{ animation:'an-spin 1s linear infinite' }} /> Đang tải...
                  </div>
                ) : students.length === 0 ? (
                  <div className="an-card" style={{ padding:'2rem', textAlign:'center', color:'#94a3b8', fontSize:'0.82rem' }}>
                    Không tìm thấy học sinh nào
                  </div>
                ) : (
                  <div>
                    <StudentListHeader />
                    <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                      {students.map((s, i) => <StudentRow key={s.ma_sinh_vien} student={s} idx={i} />)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2 — Assignments */}
            {tab === 2 && (
              data.schedule.length === 0 ? (
                <div className="an-card" style={{ padding:'2rem', textAlign:'center', color:'#94a3b8', fontSize:'0.82rem' }}>
                  Chưa có bài kiểm tra nào được giao
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <CalendarDays size={14} color="#2563eb" />
                    <span style={{ fontSize:'0.82rem', fontWeight:700, color:'#1e293b' }}>Bài kiểm tra đã giao</span>
                    <span style={{ fontSize:'0.68rem', color:'#64748b', background:'#f1f5f9', borderRadius:20, padding:'1px 8px' }}>{data.schedule.length} bài</span>
                    {data.schedule.some(s => isPast(s.due_at) && s.pending_count > 0) && (
                      <span style={{ fontSize:'0.68rem', fontWeight:700, color:'#dc2626', background:'rgba(220,38,38,0.08)', borderRadius:20, padding:'1px 8px', display:'flex', alignItems:'center', gap:3 }}>
                        <AlertTriangle size={10} />Có bài chưa nộp
                      </span>
                    )}
                  </div>
                  {data.schedule.map((item, i) => (
                    <AssignmentCard key={item.assignment_id} item={item} idx={i} />
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ClassAnalyticsPage;
