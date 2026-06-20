import { type FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Bell, LogOut, User, BookOpen, Users,
  ChevronRight, RefreshCw, MapPin, Clock,
  Calendar, GraduationCap, Layers, Sparkles, FileText, MessageSquare, ClipboardList,
  X, Loader2, Eye, Trash2, Send,
} from 'lucide-react';
import { useAuthStore } from '@/views/pages/stores/auth_store';
import toast from 'react-hot-toast';
import TeacherApi from '@/infra/teacher/teacher_api';
import ChatApi from '@/infra/chat/chat_api';
import logoTNUT from '@/assets/logo_tnut/logo_tnut.png';
import type { ISemester, ITeacherSubjectWithClasses, ISubjectFile, IFileType, IAiFile } from '@/infra/api/interfaces/ITeacher';
import type { ISavedExam, IExamQuestion, IExamChapter } from '@/infra/api/interfaces/IChat';
import AssignModal from './assignments/AssignModal';

// ── CSS ──────────────────────────────────────────────
const CSS = `
  @keyframes t-fade  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes t-spin  { to{transform:rotate(360deg)} }
  @keyframes t-pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
  @keyframes t-list-in { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
  @keyframes t-drawer-in   { from{transform:translateX(100%)} to{transform:translateX(0)} }
  @keyframes t-backdrop-in { from{opacity:0} to{opacity:1} }
  @keyframes t-expand { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
  .t-card {
    background:rgba(255,255,255,0.78); backdrop-filter:blur(20px);
    border:1px solid rgba(255,255,255,0.95); border-radius:18px;
    box-shadow:0 4px 20px rgba(37,99,235,0.07);
    animation:t-fade .35s ease both;
  }
  .t-class-row {
    display:flex; align-items:center; gap:10px;
    padding:10px 12px; border-radius:12px;
    cursor:pointer; transition:background .15s;
    border:1px solid transparent;
  }
  .t-class-row:hover { background:rgba(37,99,235,0.05); border-color:rgba(37,99,235,0.12); }
  .t-sem-pill {
    white-space:nowrap; padding:6px 14px; border-radius:20px;
    font-size:.78rem; font-weight:600; cursor:pointer;
    border:1px solid rgba(37,99,235,0.2);
    transition:all .15s;
  }
  .t-sem-pill:hover { background:rgba(37,99,235,0.08); }
  .t-notif { padding:11px 0; border-bottom:1px solid rgba(37,99,235,0.07); cursor:pointer; transition:padding .15s; border-radius:8px; }
  .t-notif:hover { background:rgba(37,99,235,0.04); padding-left:6px; }
  .t-notif:last-child { border-bottom:none; }
  .t-book {
    cursor:pointer;
    transition: transform .25s cubic-bezier(.34,1.56,.64,1), box-shadow .25s ease;
    transform-origin: bottom center;
    position: relative;
  }
  .t-book:hover { transform: translateY(-14px) rotate(-1deg); }
  .t-book.t-book-open { transform: translateY(-18px) rotate(0deg) !important; }
  .t-book-detail { animation: t-expand .28s cubic-bezier(.34,1.56,.64,1) both; }
  .t-view-btn { padding:5px 14px; border-radius:10px; font-size:.75rem; font-weight:700; cursor:pointer; border:none; transition:all .18s; }
  .t-nav-btn {
    display:flex; align-items:center; justify-content:center;
    width:32px; height:32px; border-radius:8px;
    border:1px solid rgba(0,0,0,0.08); background:transparent;
    color:#64748b; cursor:pointer;
    transition: background .15s, color .15s;
  }
  .t-nav-btn:hover { background:rgba(0,0,0,0.05); color:#0f172a; }
  .t-nav-user {
    display:flex; align-items:center; gap:8px;
    padding:4px 10px 4px 4px; border-radius:999px;
    border:1px solid rgba(0,0,0,0.08); background:transparent;
    cursor:pointer; transition: background .15s;
  }
  .t-nav-user:hover { background:rgba(0,0,0,0.04); }
  .t-nav-logout {
    display:flex; align-items:center; gap:5px;
    padding:5px 10px; border-radius:8px;
    border:1px solid rgba(0,0,0,0.08); background:transparent;
    color:#64748b; font-size:.8rem; font-weight:500; cursor:pointer;
    transition: background .15s, color .15s;
  }
  .t-nav-logout:hover { background:rgba(220,38,38,0.06); color:#dc2626; border-color:rgba(220,38,38,0.2); }

  /* ── Responsive layouts ── */
  .t-hero      { padding: 1.75rem 1.5rem; }
  .t-main      { max-width:1280px; margin:0 auto; padding:1.25rem 1.5rem; display:grid; grid-template-columns:280px 1fr; gap:1.25rem; }
  .t-nav-title { font-size:.825rem; font-weight:700; color:#0f172a; letter-spacing:-.01em; white-space:nowrap; }
  .t-nav-name  { font-size:.8rem; font-weight:500; color:#1e293b; max-width:140px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .t-shelf-scroll { overflow-x:auto; -webkit-overflow-scrolling:touch; padding-bottom:4px; }
  .t-drawer-panel { width:420px; }

  @media (max-width:1024px) {
    .t-main { grid-template-columns: 1fr; }
  }
  @media (max-width:640px) {
    .t-hero  { padding: 1.25rem 1rem; }
    .t-main  { padding: 1rem; gap: .875rem; }
    .t-nav-title { display: none; }
    .t-nav-name  { display: none; }
    .t-drawer-panel { width: 100vw; }
  }
`;

// ── Static notifications ──────────────────────────────
const NOTIFICATIONS = [
  { id: 1, tag: 'Thông báo', color: '#2563eb', date: '17/06/2026', title: 'Kế hoạch thi kết thúc học phần HK3 năm 2025–2026', unread: true },
  { id: 2, tag: 'Học vụ',   color: '#059669', date: '15/06/2026', title: 'Nhập điểm quá trình học kỳ 3 trước ngày 20/06/2026', unread: true },
  { id: 3, tag: 'Sự kiện',  color: '#7c3aed', date: '10/06/2026', title: 'Hội nghị tổng kết năm học 2025–2026', unread: false },
  { id: 4, tag: 'Thông báo',color: '#2563eb', date: '05/06/2026', title: 'Lịch họp Hội đồng khoa học tháng 6', unread: false },
];

// ── Status badge ──────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const isDone    = status.includes('hoàn thành') || status.includes('Hoàn thành');
  const isCurrent = status.includes('đang') || status.includes('Đang');
  const bg    = isDone ? '#f0fdf4' : isCurrent ? '#eff6ff' : '#f8fafc';
  const color = isDone ? '#16a34a' : isCurrent ? '#2563eb' : '#64748b';
  const border= isDone ? '#bbf7d0' : isCurrent ? '#bfdbfe' : '#e2e8f0';
  return (
    <span style={{ background: bg, color, border: `1px solid ${border}`, borderRadius: 20, padding: '2px 9px', fontSize: '0.68rem', fontWeight: 700, flexShrink: 0 }}>
      {status}
    </span>
  );
}

// ── Skeleton row ─────────────────────────────────────
const Sk: FC<{ w?: string; h?: string }> = ({ w = '100%', h = '14px' }) => (
  <div style={{ width: w, height: h, borderRadius: 6, background: 'linear-gradient(90deg,#e0eaff 25%,#c7d9fe 50%,#e0eaff 75%)', backgroundSize: '200%', animation: 't-pulse 1.4s ease infinite' }} />
);

// ── Book palette ──────────────────────────────────────
const BOOK_COLORS = [
  { grad: 'linear-gradient(180deg,#1e3a8a,#2563eb)', glow: 'rgba(37,99,235,0.35)',  accent: '#93c5fd' },
  { grad: 'linear-gradient(180deg,#6d28d9,#7c3aed)', glow: 'rgba(124,58,237,0.35)', accent: '#c4b5fd' },
  { grad: 'linear-gradient(180deg,#065f46,#059669)', glow: 'rgba(5,150,105,0.35)',  accent: '#6ee7b7' },
  { grad: 'linear-gradient(180deg,#9a3412,#ea580c)', glow: 'rgba(234,88,12,0.35)',  accent: '#fdba74' },
  { grad: 'linear-gradient(180deg,#1e40af,#0891b2)', glow: 'rgba(8,145,178,0.35)',  accent: '#67e8f9' },
  { grad: 'linear-gradient(180deg,#831843,#db2777)', glow: 'rgba(219,39,119,0.35)', accent: '#f9a8d4' },
  { grad: 'linear-gradient(180deg,#78350f,#d97706)', glow: 'rgba(217,119,6,0.35)',  accent: '#fde68a' },
  { grad: 'linear-gradient(180deg,#1e3a8a,#4f46e5)', glow: 'rgba(79,70,229,0.35)',  accent: '#a5b4fc' },
];

// ── List view ─────────────────────────────────────────
const CourseListView: FC<{ courses: ITeacherSubjectWithClasses[]; onNavigate: (url: string) => void; onDocuments: (s: { ma_mon: string; ten_mon: string }) => void; onAiDocuments: (s: { ma_mon: string; ten_mon: string }) => void; onExams: (s: { ma_mon: string; ten_mon: string }) => void }> = ({ courses, onNavigate, onDocuments, onAiDocuments, onExams }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
    {courses.map(({ subject, classes }, idx) => {
      const color = BOOK_COLORS[idx % BOOK_COLORS.length];
      return (
        <div key={subject.ma_mon} className="t-card" style={{ padding: '1.1rem 1.25rem', animationDelay: `${idx * 0.06}s`, animation: 't-list-in .32s ease both' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '0.75rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: color.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 12px ${color.glow}` }}>
              <BookOpen size={18} color="white" strokeWidth={1.8} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>{subject.ten_mon}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                <span style={{ background: 'rgba(37,99,235,0.08)', color: '#2563eb', borderRadius: 20, padding: '1px 8px', fontSize: '0.67rem', fontWeight: 700 }}>{subject.ma_mon}</span>
                {subject.so_tc !== '0' && <span style={{ background: 'rgba(5,150,105,0.08)', color: '#059669', borderRadius: 20, padding: '1px 8px', fontSize: '0.67rem', fontWeight: 700 }}>{subject.so_tc} TC</span>}
                <span style={{ background: 'rgba(100,116,139,0.08)', color: '#64748b', borderRadius: 20, padding: '1px 8px', fontSize: '0.67rem', fontWeight: 600 }}>{classes.length} lớp</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button
                onClick={() => onDocuments({ ma_mon: subject.ma_mon, ten_mon: subject.ten_mon })}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 9, background: 'rgba(37,99,235,0.07)', border: '1px solid rgba(37,99,235,0.15)', color: '#2563eb', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                <FileText size={13} /> Tài liệu
              </button>
              <button
                onClick={() => onAiDocuments({ ma_mon: subject.ma_mon, ten_mon: subject.ten_mon })}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 9, background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.2)', color: '#7c3aed', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                <Sparkles size={13} /> Train AI
              </button>
              <button
                onClick={() => onExams({ ma_mon: subject.ma_mon, ten_mon: subject.ten_mon })}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 9, background: 'rgba(30,58,138,0.07)', border: '1px solid rgba(30,58,138,0.15)', color: '#1e3a8a', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                <ClipboardList size={13} /> Bài kiểm tra
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {classes.map(cls => (
              <div key={cls.id_to_hoc} className="t-class-row" onClick={() => onNavigate(`/teacher/courses/${encodeURIComponent(cls.id_to_hoc)}/students`)}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(37,99,235,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Users size={13} color="#2563eb" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1e293b' }}>{cls.nhom_to}</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{cls.ten_lop}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 2, flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.68rem', color: '#94a3b8' }}><MapPin size={9} />{cls.phong}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.68rem', color: '#94a3b8' }}><Clock size={9} />{cls.thoi_gian_hoc}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.68rem', color: '#94a3b8' }}><Users size={9} />{cls.sl_dk} SV</span>
                  </div>
                </div>
                <StatusBadge status={cls.status} />
                <ChevronRight size={13} color="#94a3b8" style={{ flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </div>
      );
    })}
  </div>
);

// ── Bookshelf view ────────────────────────────────────
const CourseBookshelfView: FC<{ courses: ITeacherSubjectWithClasses[]; onNavigate: (url: string) => void; onDocuments: (s: { ma_mon: string; ten_mon: string }) => void; onAiDocuments: (s: { ma_mon: string; ten_mon: string }) => void; onExams: (s: { ma_mon: string; ten_mon: string }) => void }> = ({ courses, onNavigate, onDocuments, onAiDocuments, onExams }) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const openCourse = courses.find(c => c.subject.ma_mon === openId);
  const openColor  = openCourse ? BOOK_COLORS[courses.indexOf(openCourse) % BOOK_COLORS.length] : null;

  useEffect(() => {
    if (openId && detailRef.current) {
      setTimeout(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
    }
  }, [openId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* ── Shelf ── */}
      <div style={{ position: 'relative', paddingBottom: 18 }}>
        {/* Books row */}
        <div className="t-shelf-scroll">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end', paddingBottom: 6, minWidth: 'max-content' }}>
          {courses.map(({ subject, classes }, idx) => {
            const color   = BOOK_COLORS[idx % BOOK_COLORS.length];
            const isOpen  = openId === subject.ma_mon;
            const bookH   = 140 + (subject.ten_mon.length > 20 ? 20 : 0);
            return (
              <div
                key={subject.ma_mon}
                className={`t-book${isOpen ? ' t-book-open' : ''}`}
                onClick={() => setOpenId(isOpen ? null : subject.ma_mon)}
                style={{ width: 72, height: bookH, borderRadius: '4px 10px 10px 4px', background: color.grad, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '10px 6px', boxShadow: isOpen ? `0 12px 32px ${color.glow}, inset -3px 0 8px rgba(0,0,0,0.15)` : `0 6px 18px ${color.glow}, inset -3px 0 8px rgba(0,0,0,0.1)`, border: isOpen ? `2px solid ${color.accent}` : '2px solid rgba(255,255,255,0.15)' }}
              >
                {/* Page edge lines (left side illusion) */}
                <div style={{ position: 'absolute', left: 0, top: 4, bottom: 4, width: 6, borderRadius: '4px 0 0 4px', background: 'rgba(255,255,255,0.08)', borderRight: '1px solid rgba(255,255,255,0.12)' }} />

                {/* Class count badge */}
                <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: '2px 6px', fontSize: '0.6rem', fontWeight: 800, color: 'white', alignSelf: 'flex-end' }}>
                  {classes.length}
                </div>

                {/* Subject name vertical */}
                <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: '0.68rem', fontWeight: 800, color: 'white', textAlign: 'center', lineHeight: 1.3, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', maxHeight: bookH - 60, overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '0.03em' }}>
                  {subject.ten_mon}
                </div>

                {/* Code badge */}
                <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 6, padding: '2px 5px', fontSize: '0.55rem', fontWeight: 700, color: color.accent, alignSelf: 'stretch', textAlign: 'center' }}>
                  {subject.ma_mon}
                </div>

                {/* Open indicator dot */}
                {isOpen && <div style={{ position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)', width: 8, height: 8, borderRadius: '50%', background: color.accent, boxShadow: `0 0 8px ${color.glow}` }} />}
              </div>
            );
          })}
        </div>
        </div>{/* /t-shelf-scroll */}

        {/* Shelf board */}
        <div style={{ position: 'absolute', bottom: 0, left: -8, right: -8, height: 14, background: 'linear-gradient(180deg,#c8a97a,#a67c52)', borderRadius: '0 0 6px 6px', boxShadow: '0 4px 10px rgba(0,0,0,0.18)' }} />
        <div style={{ position: 'absolute', bottom: -3, left: 0, right: 0, height: 4, background: 'rgba(0,0,0,0.12)', borderRadius: 2 }} />
      </div>

      {/* ── Expanded detail ── */}
      {openCourse && openColor && (
        <div ref={detailRef} key={openId} className="t-card t-book-detail" style={{ border: `1.5px solid ${openColor.accent}40`, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '14px 16px 12px', background: openColor.grad, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <BookOpen size={20} color="white" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'white' }}>{openCourse.subject.ten_mon}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', borderRadius: 20, padding: '1px 8px', fontSize: '0.67rem', fontWeight: 700 }}>{openCourse.subject.ma_mon}</span>
                {openCourse.subject.so_tc !== '0' && <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', borderRadius: 20, padding: '1px 8px', fontSize: '0.67rem', fontWeight: 700 }}>{openCourse.subject.so_tc} tín chỉ</span>}
                <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', borderRadius: 20, padding: '1px 8px', fontSize: '0.67rem', fontWeight: 700 }}>{openCourse.classes.length} lớp</span>
              </div>
            </div>
            <button onClick={() => onDocuments({ ma_mon: openCourse.subject.ma_mon, ten_mon: openCourse.subject.ten_mon })} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.35)', borderRadius: 8, padding: '5px 11px', color: 'white', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
              <FileText size={13} /> Tài liệu
            </button>
            <button onClick={() => onAiDocuments({ ma_mon: openCourse.subject.ma_mon, ten_mon: openCourse.subject.ten_mon })} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(167,139,250,0.25)', border: '1px solid rgba(196,181,253,0.5)', borderRadius: 8, padding: '5px 11px', color: 'white', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
              <Sparkles size={13} /> Train AI
            </button>
            <button onClick={() => onExams({ ma_mon: openCourse.subject.ma_mon, ten_mon: openCourse.subject.ten_mon })} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, padding: '5px 11px', color: 'white', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
              <ClipboardList size={13} /> Bài kiểm tra
            </button>
            <button onClick={() => setOpenId(null)} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, padding: '4px 10px', color: 'white', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>
              Đóng ✕
            </button>
          </div>

          {/* Class rows */}
          <div style={{ padding: '8px 12px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {openCourse.classes.map((cls, i) => (
              <div
                key={cls.id_to_hoc}
                className="t-class-row"
                onClick={() => onNavigate(`/teacher/courses/${encodeURIComponent(cls.id_to_hoc)}/students`)}
                style={{ animation: `t-expand .2s ease ${i * 0.05}s both` }}
              >
                <div style={{ width: 32, height: 32, borderRadius: 9, background: openColor.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: 0.85 }}>
                  <Users size={14} color="white" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.83rem', color: '#1e293b' }}>{cls.nhom_to}</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{cls.ten_lop}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 3, flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.68rem', color: '#94a3b8' }}><MapPin size={9} />{cls.phong}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.68rem', color: '#94a3b8' }}><Clock size={9} />{cls.thoi_gian_hoc}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.68rem', color: '#94a3b8' }}><Users size={9} />{cls.sl_dk} SV</span>
                  </div>
                </div>
                <StatusBadge status={cls.status} />
                <ChevronRight size={13} color="#94a3b8" style={{ flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {!openId && (
        <div style={{ textAlign: 'center', fontSize: '0.78rem', color: '#94a3b8', marginTop: -4 }}>
          ☝️ Chọn một cuốn sách để xem danh sách lớp
        </div>
      )}
    </div>
  );
};

// ── Helpers ───────────────────────────────────────────
const FILE_TYPES: { value: IFileType; label: string }[] = [
  { value: 'de_cuong',          label: 'Đề cương' },
  { value: 'ly_thuyet',         label: 'Lý thuyết' },
  { value: 'ma_tran_cau_hoi',   label: 'Ma trận câu hỏi' },
  { value: 'ngan_hang_cau_hoi', label: 'Ngân hàng câu hỏi' },
  { value: 'khac',              label: 'Khác' },
];

const fmtSize = (b: number | null) => {
  if (!b) return '';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
};

const fmtFileDate = (iso: string | null) => {
  if (!iso) return '';
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso));
};

// ── SubjectFilesDrawer ────────────────────────────────
const SubjectFilesDrawer: FC<{
  subject: { ma_mon: string; ten_mon: string };
  onClose: () => void;
}> = ({ subject, onClose }) => {
  const [files,        setFiles]        = useState<ISubjectFile[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [showUpload,   setShowUpload]   = useState(false);
  const [uploading,    setUploading]    = useState(false);
  const [uploadFile,   setUploadFile]   = useState<File | null>(null);
  const [uploadType,   setUploadType]   = useState<IFileType>('de_cuong');
  const [uploadPrivate,setUploadPrivate]= useState(false);
  const [editId,       setEditId]       = useState<string | null>(null);
  const [editData,     setEditData]     = useState<{ type: IFileType; is_private: string; original_name: string }>({ type: 'de_cuong', is_private: '0', original_name: '' });
  const [saving,       setSaving]       = useState(false);
  const [deleting,     setDeleting]     = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    setLoading(true);
    TeacherApi.getSubjectFiles(subject.ma_mon)
      .then(r => setFiles(r.data))
      .catch(() => toast.error('Không thể tải danh sách tài liệu.'))
      .finally(() => setLoading(false));
  }, [subject.ma_mon]);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    try {
      const r = await TeacherApi.uploadSubjectFile(subject.ma_mon, uploadFile, uploadType, uploadPrivate);
      setFiles(prev => [r.data, ...prev]);
      setShowUpload(false);
      setUploadFile(null);
      setUploadType('de_cuong');
      setUploadPrivate(false);
      toast.success('Tải lên tài liệu thành công!');
    } catch {
      toast.error('Tải lên thất bại. Vui lòng thử lại.');
    } finally {
      setUploading(false);
    }
  };

  const startEdit = (f: ISubjectFile) => {
    setEditId(f.id);
    setEditData({ type: f.type, is_private: f.is_private ? '1' : '0', original_name: f.original_name ?? '' });
  };

  const handleSave = async () => {
    if (!editId) return;
    setSaving(true);
    try {
      const r = await TeacherApi.updateSubjectFile(subject.ma_mon, editId, editData);
      setFiles(prev => prev.map(f => f.id === editId ? { ...f, ...r.data } : f));
      setEditId(null);
      toast.success('Cập nhật tài liệu thành công!');
    } catch {
      toast.error('Cập nhật thất bại. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm('Xóa tài liệu này?')) return;
    setDeleting(fileId);
    try {
      await TeacherApi.deleteSubjectFile(subject.ma_mon, fileId);
      setFiles(prev => prev.filter(f => f.id !== fileId));
      toast.success('Đã xóa tài liệu.');
    } catch {
      toast.error('Xóa thất bại. Vui lòng thử lại.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 99, background: 'rgba(15,23,42,0.32)', backdropFilter: 'blur(3px)', animation: 't-backdrop-in .2s ease both' }} />

      {/* Panel */}
      <div className="t-drawer-panel" style={{ position: 'fixed', right: 0, top: 0, bottom: 0, zIndex: 100, background: '#f8faff', display: 'flex', flexDirection: 'column', animation: 't-drawer-in .28s cubic-bezier(.34,1.2,.64,1) both', boxShadow: '-4px 0 32px rgba(15,23,42,0.15)' }}>

        {/* Header */}
        <div style={{ padding: '18px 20px 14px', background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                <FileText size={14} color="#93c5fd" />
                <span style={{ fontSize: '0.68rem', color: '#93c5fd', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Tài liệu môn học</span>
              </div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: 'white', lineHeight: 1.3 }}>{subject.ten_mon}</div>
              <span style={{ marginTop: 5, display: 'inline-block', background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '1px 9px', fontSize: '0.67rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{subject.ma_mon}</span>
            </div>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1rem' }}>✕</button>
          </div>
        </div>

        {/* Upload toggle */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(37,99,235,0.08)', background: 'white', flexShrink: 0 }}>
          <button
            onClick={() => setShowUpload(v => !v)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '8px 0', borderRadius: 10, background: showUpload ? 'rgba(37,99,235,0.06)' : 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.18)', color: '#2563eb', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
          >
            <FileText size={14} /> {showUpload ? 'Hủy tải lên' : '+ Tải lên tài liệu'}
          </button>

          {showUpload && (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* File picker */}
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{ border: '1.5px dashed rgba(37,99,235,0.3)', borderRadius: 10, padding: '12px', textAlign: 'center', cursor: 'pointer', background: uploadFile ? 'rgba(37,99,235,0.04)' : 'white' }}
              >
                <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={e => setUploadFile(e.target.files?.[0] ?? null)} />
                {uploadFile
                  ? <div style={{ fontSize: '0.8rem', color: '#1e3a8a', fontWeight: 600 }}>📎 {uploadFile.name}<br /><span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 400 }}>{fmtSize(uploadFile.size)}</span></div>
                  : <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Bấm để chọn file</div>
                }
              </div>

              {/* Type */}
              <select value={uploadType} onChange={e => setUploadType(e.target.value as IFileType)}
                style={{ padding: '7px 10px', borderRadius: 9, border: '1px solid rgba(37,99,235,0.2)', fontSize: '0.8rem', color: '#1e293b', background: 'white', outline: 'none' }}
              >
                {FILE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>

              {/* Private toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.8rem', color: '#475569' }}>
                <input type="checkbox" checked={uploadPrivate} onChange={e => setUploadPrivate(e.target.checked)} style={{ width: 15, height: 15, accentColor: '#2563eb' }} />
                Chỉ mình tôi thấy (riêng tư)
              </label>

              <button onClick={handleUpload} disabled={!uploadFile || uploading}
                style={{ padding: '8px', borderRadius: 9, background: uploadFile ? 'linear-gradient(135deg,#1e3a8a,#2563eb)' : 'rgba(37,99,235,0.08)', border: 'none', color: uploadFile ? 'white' : '#94a3b8', fontSize: '0.82rem', fontWeight: 700, cursor: uploadFile ? 'pointer' : 'not-allowed' }}
              >
                {uploading ? 'Đang tải lên...' : 'Xác nhận tải lên'}
              </button>
            </div>
          )}
        </div>

        {/* File list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loading ? (
            [1,2,3].map(i => <div key={i} style={{ height: 64, borderRadius: 12, background: 'linear-gradient(90deg,#e0eaff 25%,#c7d9fe 50%,#e0eaff 75%)', backgroundSize: '200%', animation: 't-pulse 1.4s ease infinite' }} />)
          ) : files.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
              <FileText size={36} color="#bfdbfe" style={{ margin: '0 auto 10px' }} />
              <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Chưa có tài liệu nào.</div>
            </div>
          ) : files.map(f => (
            <div key={f.id} style={{ background: 'white', borderRadius: 13, border: '1px solid rgba(37,99,235,0.08)', overflow: 'hidden' }}>
              {editId === f.id ? (
                /* ── Edit mode ── */
                <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input
                    value={editData.original_name}
                    onChange={e => setEditData(d => ({ ...d, original_name: e.target.value }))}
                    style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(37,99,235,0.25)', fontSize: '0.8rem', outline: 'none' }}
                    placeholder="Tên tài liệu"
                  />
                  <select value={editData.type} onChange={e => setEditData(d => ({ ...d, type: e.target.value as IFileType }))}
                    style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(37,99,235,0.2)', fontSize: '0.8rem', outline: 'none' }}
                  >
                    {FILE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.78rem', color: '#475569', cursor: 'pointer' }}>
                    <input type="checkbox" checked={editData.is_private === '1'} onChange={e => setEditData(d => ({ ...d, is_private: e.target.checked ? '1' : '0' }))} style={{ accentColor: '#2563eb' }} />
                    Riêng tư
                  </label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={handleSave} disabled={saving}
                      style={{ flex: 1, padding: '6px', borderRadius: 8, background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', border: 'none', color: 'white', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                    >{saving ? 'Đang lưu...' : 'Lưu'}</button>
                    <button onClick={() => setEditId(null)}
                      style={{ flex: 1, padding: '6px', borderRadius: 8, background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', color: '#64748b' }}
                    >Hủy</button>
                  </div>
                </div>
              ) : (
                /* ── View mode ── */
                <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(37,99,235,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileText size={16} color="#2563eb" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.original_name ?? 'Không tên'}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ background: 'rgba(37,99,235,0.08)', color: '#2563eb', borderRadius: 20, padding: '1px 7px', fontSize: '0.62rem', fontWeight: 700 }}>{f.type_label}</span>
                      {f.is_private && <span style={{ background: 'rgba(220,38,38,0.07)', color: '#dc2626', borderRadius: 20, padding: '1px 7px', fontSize: '0.62rem', fontWeight: 700 }}>Riêng tư</span>}
                      {f.file_size && <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>{fmtSize(f.file_size)}</span>}
                      {f.created_at && <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>{fmtFileDate(f.created_at)}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <a href={f.download_url} target="_blank" rel="noreferrer"
                      style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', textDecoration: 'none' }}
                      title="Tải về"
                    >↓</a>
                    <button onClick={() => startEdit(f)}
                      style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(37,99,235,0.07)', border: '1px solid rgba(37,99,235,0.15)', cursor: 'pointer', color: '#2563eb', fontSize: '0.75rem' }}
                      title="Sửa"
                    >✎</button>
                    <button onClick={() => handleDelete(f.id)} disabled={deleting === f.id}
                      style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)', cursor: 'pointer', color: '#dc2626', fontSize: '0.75rem' }}
                      title="Xóa"
                    >{deleting === f.id ? '…' : '✕'}</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(37,99,235,0.07)', background: 'white', fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center', flexShrink: 0 }}>
          {files.length} tài liệu · {subject.ma_mon}
        </div>
      </div>
    </>
  );
};

// ── SubjectAiFilesDrawer ──────────────────────────────
// Chỉ giữ lại các loại phù hợp với mô hình RAG (đưa vào knowledge base)
const AI_FILE_TYPES = [
  { value: 'de_cuong',          label: 'Đề cương môn học' },
  { value: 'ly_thuyet',         label: 'Tài liệu lý thuyết' },
  { value: 'ngan_hang_cau_hoi', label: 'Ngân hàng câu hỏi' },
] as const;

type AiFileType = typeof AI_FILE_TYPES[number]['value'];

const SubjectAiFilesDrawer: FC<{
  subject: { ma_mon: string; ten_mon: string };
  onClose: () => void;
}> = ({ subject, onClose }) => {
  const [files,        setFiles]        = useState<IAiFile[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [subjectFiles, setSubjectFiles] = useState<ISubjectFile[]>([]);
  const [loadingSF,    setLoadingSF]    = useState(true);
  const [showSend,     setShowSend]     = useState(false);
  const [sending,      setSending]      = useState(false);
  const [sendFile,     setSendFile]     = useState<File | null>(null);
  const [selectedIds,  setSelectedIds]  = useState<Set<string>>(new Set());
  const [sendType,     setSendType]     = useState<AiFileType>('de_cuong');
  const [deleting,     setDeleting]     = useState<string | null>(null);
  const [resending,    setResending]    = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadAi = useCallback(() => {
    setLoading(true);
    TeacherApi.getAiFiles(subject.ma_mon)
      .then(r => setFiles(r.data))
      .catch(() => toast.error('Không thể tải danh sách tài liệu AI.'))
      .finally(() => setLoading(false));
  }, [subject.ma_mon]);

  useEffect(() => {
    loadAi();
    setLoadingSF(true);
    TeacherApi.getSubjectFiles(subject.ma_mon)
      .then(r => setSubjectFiles(r.data))
      .catch(() => {})
      .finally(() => setLoadingSF(false));
  }, [subject.ma_mon, loadAi]);

  // Subject files not yet in AI list
  const sentIds       = useMemo(() => new Set(files.map(f => f.id)), [files]);
  const availableFiles = useMemo(() => subjectFiles.filter(f => !sentIds.has(f.id)), [subjectFiles, sentIds]);

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const canSend = !!(sendFile || selectedIds.size > 0);

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    try {
      const r = await TeacherApi.sendFileToAi(subject.ma_mon, sendType, {
        file: sendFile ?? undefined,
        fileIds: selectedIds.size > 0 ? [...selectedIds] : undefined,
      });
      if (r.success) {
        toast.success('Đã gửi tài liệu đến API AI!');
        setShowSend(false);
        setSendFile(null);
        setSelectedIds(new Set());
        loadAi();
      } else {
        toast.error(r.message ?? 'Gửi thất bại.');
      }
    } catch {
      toast.error('Gửi thất bại. Vui lòng thử lại.');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm('Xóa liên kết tài liệu này với API AI?')) return;
    setDeleting(fileId);
    try {
      await TeacherApi.deleteAiFileLink(subject.ma_mon, fileId);
      setFiles(prev => prev.filter(f => f.id !== fileId));
      toast.success('Đã xóa liên kết.');
    } catch {
      toast.error('Xóa thất bại. Vui lòng thử lại.');
    } finally {
      setDeleting(null);
    }
  };

  const handleResend = async (fileId: string) => {
    setResending(fileId);
    try {
      const r = await TeacherApi.resendFileToAi(subject.ma_mon, fileId);
      if (r.success) {
        toast.success('Đã gửi lại tài liệu đến API AI!');
        loadAi();
      } else {
        toast.error(r.message ?? 'Gửi lại thất bại.');
      }
    } catch {
      toast.error('Gửi lại thất bại. Vui lòng thử lại.');
    } finally {
      setResending(null);
    }
  };

  const statusColor = (s: string) => {
    if (s === 'success') return { bg: 'rgba(5,150,105,0.08)', color: '#059669' };
    if (s === 'error' || s === 'failed') return { bg: 'rgba(220,38,38,0.07)', color: '#dc2626' };
    return { bg: 'rgba(245,158,11,0.08)', color: '#d97706' };
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 99, background: 'rgba(15,23,42,0.32)', backdropFilter: 'blur(3px)', animation: 't-backdrop-in .2s ease both' }} />

      <div className="t-drawer-panel" style={{ position: 'fixed', right: 0, top: 0, bottom: 0, zIndex: 100, background: '#faf8ff', display: 'flex', flexDirection: 'column', animation: 't-drawer-in .28s cubic-bezier(.34,1.2,.64,1) both', boxShadow: '-4px 0 32px rgba(15,23,42,0.15)' }}>

        {/* Header */}
        <div style={{ padding: '18px 20px 14px', background: 'linear-gradient(135deg,#4c1d95,#7c3aed)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                <Sparkles size={14} color="#c4b5fd" />
                <span style={{ fontSize: '0.68rem', color: '#c4b5fd', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Tài liệu Model Train AI</span>
              </div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: 'white', lineHeight: 1.3 }}>{subject.ten_mon}</div>
              <span style={{ marginTop: 5, display: 'inline-block', background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '1px 9px', fontSize: '0.67rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{subject.ma_mon}</span>
            </div>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1rem' }}>✕</button>
          </div>
        </div>

        {/* Send toggle */}
        <div style={{ borderBottom: '1px solid rgba(124,58,237,0.08)', background: 'white', flexShrink: 0 }}>
          <div style={{ padding: '12px 16px' }}>
            <button
              onClick={() => setShowSend(v => !v)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '8px 0', borderRadius: 10, background: showSend ? 'rgba(124,58,237,0.06)' : 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', color: '#7c3aed', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
            >
              <Sparkles size={14} /> {showSend ? 'Hủy' : '+ Gửi tài liệu đến AI'}
            </button>
          </div>

          {showSend && (
            <div style={{ padding: '0 16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>

              {/* ── Upload file mới ── */}
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#7c3aed', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Upload file mới</div>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{ border: '1.5px dashed rgba(124,58,237,0.3)', borderRadius: 10, padding: '10px 12px', textAlign: 'center', cursor: 'pointer', background: sendFile ? 'rgba(124,58,237,0.04)' : 'transparent' }}
                >
                  <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={e => setSendFile(e.target.files?.[0] ?? null)} />
                  {sendFile
                    ? <div style={{ fontSize: '0.78rem', color: '#4c1d95', fontWeight: 600 }}>📎 {sendFile.name}
                        <button onClick={e => { e.stopPropagation(); setSendFile(null); }} style={{ marginLeft: 8, background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.75rem' }}>✕</button>
                      </div>
                    : <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Bấm để chọn file</div>
                  }
                </div>
              </div>

              {/* ── Chọn từ tài liệu đã có ── */}
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#7c3aed', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Chọn từ tài liệu môn học {selectedIds.size > 0 && <span style={{ background: '#7c3aed', color: 'white', borderRadius: 20, padding: '1px 7px', fontSize: '0.62rem', marginLeft: 5 }}>{selectedIds.size}</span>}
                </div>
                {loadingSF ? (
                  <div style={{ fontSize: '0.75rem', color: '#a78bfa', padding: '6px 0' }}>Đang tải...</div>
                ) : availableFiles.length === 0 ? (
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', padding: '6px 0' }}>
                    {subjectFiles.length === 0 ? 'Chưa có tài liệu môn học nào.' : 'Tất cả tài liệu đã được gửi đến AI.'}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 180, overflowY: 'auto' }}>
                    {availableFiles.map(f => {
                      const selected = selectedIds.has(f.id);
                      return (
                        <div
                          key={f.id}
                          onClick={() => toggleSelect(f.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', borderRadius: 9, border: `1.5px solid ${selected ? 'rgba(124,58,237,0.5)' : 'rgba(124,58,237,0.12)'}`, background: selected ? 'rgba(124,58,237,0.06)' : 'rgba(255,255,255,0.7)', cursor: 'pointer', transition: 'border .15s, background .15s' }}
                        >
                          <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${selected ? '#7c3aed' : '#cbd5e1'}`, background: selected ? '#7c3aed' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .15s' }}>
                            {selected && <span style={{ color: 'white', fontSize: '0.6rem', lineHeight: 1 }}>✓</span>}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.original_name ?? 'Không tên'}</div>
                            <div style={{ display: 'flex', gap: 5, marginTop: 2 }}>
                              <span style={{ background: 'rgba(37,99,235,0.08)', color: '#2563eb', borderRadius: 20, padding: '0 6px', fontSize: '0.6rem', fontWeight: 700 }}>{f.type_label}</span>
                              {f.file_size && <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>{fmtSize(f.file_size)}</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── Type + Submit ── */}
              <select value={sendType} onChange={e => setSendType(e.target.value as AiFileType)}
                style={{ padding: '7px 10px', borderRadius: 9, border: '1px solid rgba(124,58,237,0.2)', fontSize: '0.8rem', color: '#1e293b', background: 'white', outline: 'none' }}
              >
                {AI_FILE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>

              <button onClick={handleSend} disabled={!canSend || sending}
                style={{ padding: '8px', borderRadius: 9, background: canSend ? 'linear-gradient(135deg,#4c1d95,#7c3aed)' : 'rgba(124,58,237,0.08)', border: 'none', color: canSend ? 'white' : '#94a3b8', fontSize: '0.82rem', fontWeight: 700, cursor: canSend ? 'pointer' : 'not-allowed' }}
              >
                {sending ? 'Đang gửi...' : `Gửi đến AI${selectedIds.size > 0 ? ` (${selectedIds.size} file)` : ''}${sendFile ? ' + file mới' : ''}`}
              </button>
            </div>
          )}
        </div>

        {/* AI file list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loading ? (
            [1,2,3].map(i => <div key={i} style={{ height: 72, borderRadius: 12, background: 'linear-gradient(90deg,#ede9fe 25%,#ddd6fe 50%,#ede9fe 75%)', backgroundSize: '200%', animation: 't-pulse 1.4s ease infinite' }} />)
          ) : files.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
              <Sparkles size={36} color="#ddd6fe" style={{ margin: '0 auto 10px' }} />
              <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Chưa có tài liệu nào được gửi đến AI.</div>
            </div>
          ) : files.map(f => {
            const extStatus = typeof f.external_status === 'string' ? f.external_status : '';
            const sc = statusColor(extStatus);
            return (
              <div key={f.id} style={{ background: 'white', borderRadius: 13, border: '1px solid rgba(124,58,237,0.08)', padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(124,58,237,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <Sparkles size={16} color="#7c3aed" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.original_name ?? 'Không tên'}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ background: 'rgba(124,58,237,0.08)', color: '#7c3aed', borderRadius: 20, padding: '1px 7px', fontSize: '0.62rem', fontWeight: 700 }}>{f.type_label || f.type}</span>
                    <span style={{ background: sc.bg, color: sc.color, borderRadius: 20, padding: '1px 7px', fontSize: '0.62rem', fontWeight: 700 }}>{extStatus || 'pending'}</span>
                    {f.created_at && <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>{fmtFileDate(f.created_at)}</span>}
                  </div>
                  {f.external_response && (
                    <div style={{ marginTop: 5, fontSize: '0.7rem', color: '#64748b', background: 'rgba(124,58,237,0.04)', borderRadius: 7, padding: '4px 8px', border: '1px solid rgba(124,58,237,0.08)' }}>
                      {typeof f.external_response === 'string' ? f.external_response : JSON.stringify(f.external_response)}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0, alignItems: 'center' }}>
                  {f.download_url && (
                    <a href={f.download_url} target="_blank" rel="noreferrer"
                      style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', textDecoration: 'none' }}
                      title="Tải về"
                    >↓</a>
                  )}
                  <button
                    onClick={() => handleResend(f.id)}
                    disabled={resending === f.id || deleting === f.id}
                    style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(37,99,235,0.07)', border: '1px solid rgba(37,99,235,0.2)', cursor: 'pointer', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Gửi lại đến API AI"
                  >
                    {resending === f.id
                      ? <Loader2 size={13} style={{ animation: 't-spin 0.8s linear infinite' }} />
                      : <RefreshCw size={13} />
                    }
                  </button>
                  <button onClick={() => handleDelete(f.id)} disabled={deleting === f.id || resending === f.id}
                    style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)', cursor: 'pointer', color: '#dc2626', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Xóa liên kết"
                  >{deleting === f.id ? <Loader2 size={13} style={{ animation: 't-spin 0.8s linear infinite' }} /> : <X size={13} />}</button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(124,58,237,0.07)', background: 'white', fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center', flexShrink: 0 }}>
          {files.length} tài liệu AI · {subject.ma_mon}
        </div>
      </div>
    </>
  );
};

// ── SubjectExamsDrawer ────────────────────────────────
const SubjectExamsDrawer: FC<{ subject: { ma_mon: string; ten_mon: string }; onClose: () => void }> = ({ subject, onClose }) => {
  const [exams,        setExams]        = useState<ISavedExam[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [detail,       setDetail]       = useState<(ISavedExam & { questions?: IExamQuestion[]; session_id?: string | null; teacher_id?: string | null; updated_at?: string | null }) | null>(null);
  const [loadingDetail,setLoadingDetail] = useState(false);
  const [deletingId,   setDeletingId]   = useState<string | null>(null);
  const [assigningExam,setAssigningExam]= useState<ISavedExam | null>(null);

  useEffect(() => {
    setLoading(true);
    ChatApi.getExams(subject.ma_mon)
      .then(r => setExams(r.data ?? []))
      .catch(() => setExams([]))
      .finally(() => setLoading(false));
  }, [subject.ma_mon]);

  const handleDeleteExam = async (id: string) => {
    if (!confirm('Xóa đề kiểm tra này?')) return;
    setDeletingId(id);
    try {
      const r = await ChatApi.deleteExam(id);
      if (r.success) {
        toast.success('Đã xóa đề kiểm tra.');
        setExams(prev => prev.filter(e => e.id !== id));
      } else {
        toast.error(r.message ?? 'Xóa thất bại.');
      }
    } catch {
      toast.error('Xóa thất bại. Vui lòng thử lại.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleViewDetail = async (id: string) => {
    setLoadingDetail(true);
    try {
      const r = await ChatApi.getExamDetail(id);
      setDetail(r.data ?? null);
    } catch {
      toast.error('Không thể tải chi tiết đề.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const fmtDate = (iso?: string | null) => {
    if (!iso) return '—';
    return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso));
  };

  const statusBadge = (status?: string | null) => {
    if (!status) return { label: 'Không rõ', bg: 'rgba(100,116,139,0.1)', color: '#64748b' };
    if (status === 'confirmed') return { label: 'Đã xác nhận', bg: 'rgba(5,150,105,0.1)', color: '#059669' };
    if (status === 'draft') return { label: 'Nháp', bg: 'rgba(217,119,6,0.1)', color: '#d97706' };
    return { label: status, bg: 'rgba(37,99,235,0.08)', color: '#2563eb' };
  };

  const OPT_COLORS: Record<string, { bg: string; color: string }> = {
    A: { bg: 'rgba(37,99,235,0.06)',  color: '#2563eb' },
    B: { bg: 'rgba(124,58,237,0.06)', color: '#7c3aed' },
    C: { bg: 'rgba(5,150,105,0.06)',  color: '#059669' },
    D: { bg: 'rgba(217,119,6,0.06)',  color: '#d97706' },
  };

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15,23,42,0.35)', backdropFilter: 'blur(3px)', animation: 't-overlay-in .2s ease both' }} />

      {/* Drawer */}
      <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, zIndex: 101, width: 'min(520px,100vw)', background: 'white', display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 32px rgba(15,23,42,0.15)', animation: 't-drawer-in .28s cubic-bezier(.34,1.2,.64,1) both' }}>

        {/* Header */}
        <div style={{ flexShrink: 0, padding: '16px 20px 14px', background: 'linear-gradient(135deg,#0f172a,#1e3a8a)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                <ClipboardList size={13} color="#93c5fd" />
                <span style={{ fontSize: '0.65rem', color: '#93c5fd', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Danh sách đề kiểm tra</span>
              </div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'white' }}>{subject.ten_mon}</div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{subject.ma_mon}</div>
            </div>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Detail panel (when open) */}
        {detail ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ flexShrink: 0, padding: '10px 16px', background: '#f8faff', borderBottom: '1px solid rgba(37,99,235,0.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => setDetail(null)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 8, background: 'rgba(37,99,235,0.07)', border: '1px solid rgba(37,99,235,0.15)', color: '#2563eb', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                ← Quay lại
              </button>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b' }}>Chi tiết đề</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Meta info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Mã môn', value: detail.ma_mon },
                  { label: 'Số câu', value: detail.question_count ?? '—' },
                  { label: 'Thời gian', value: detail.time_limit ? `${detail.time_limit} phút` : '—' },
                  { label: 'Trạng thái', value: statusBadge(detail.status).label },
                  { label: 'Ngày tạo', value: fmtDate(detail.created_at) },
                  { label: 'Xác nhận lúc', value: fmtDate(detail.confirmed_at) },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: '#f8faff', borderRadius: 10, padding: '8px 12px', border: '1px solid rgba(37,99,235,0.07)' }}>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e293b' }}>{String(value)}</div>
                  </div>
                ))}
              </div>

              {/* Chapters */}
              {(detail.chapters ?? []).length > 0 && (
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: 6 }}>Chương</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {(detail.chapters as IExamChapter[]).map(ch => (
                      <span key={ch.id} style={{ fontSize: '0.72rem', fontWeight: 600, color: '#1e3a8a', background: 'rgba(30,58,138,0.07)', borderRadius: 20, padding: '2px 10px', border: '1px solid rgba(30,58,138,0.1)' }}>{ch.title}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Questions */}
              {(detail.questions ?? []).length > 0 && (
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: 8 }}>Câu hỏi ({(detail.questions ?? []).length})</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(detail.questions as IExamQuestion[]).map((q, i) => (
                      <div key={i} style={{ background: 'white', borderRadius: 11, border: '1px solid rgba(37,99,235,0.1)', overflow: 'hidden' }}>
                        {/* Question header */}
                        <div style={{ padding: '5px 12px', background: 'linear-gradient(135deg,rgba(30,58,138,0.06),rgba(37,99,235,0.04))', borderBottom: '1px solid rgba(37,99,235,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#1e3a8a' }}>Câu {i + 1}</span>
                          {q.chapter_title && <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>{q.chapter_title}</span>}
                        </div>
                        {/* Question text */}
                        <div style={{ padding: '8px 12px', fontSize: '0.82rem', color: '#1e293b', lineHeight: 1.55, borderBottom: q.options ? '1px solid rgba(37,99,235,0.06)' : 'none' }}>
                          {q.question}
                        </div>
                        {/* Options A/B/C/D */}
                        {q.options && (
                          <div style={{ padding: '8px 12px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                            {Object.entries(q.options).map(([key, val]) => {
                              const isAnswer = key === q.answer;
                              const col = OPT_COLORS[key] ?? OPT_COLORS.A;
                              return (
                                <div key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, padding: '5px 8px', borderRadius: 7, background: isAnswer ? 'rgba(5,150,105,0.07)' : col.bg, border: `1px solid ${isAnswer ? 'rgba(5,150,105,0.2)' : 'transparent'}` }}>
                                  <span style={{ flexShrink: 0, width: 18, height: 18, borderRadius: '50%', background: isAnswer ? '#059669' : col.color, color: 'white', fontSize: '0.62rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{key}</span>
                                  <span style={{ fontSize: '0.78rem', color: isAnswer ? '#059669' : '#334155', fontWeight: isAnswer ? 700 : 400, lineHeight: 1.4, flex: 1 }}>{val}</span>
                                  {isAnswer && <span style={{ fontSize: '0.6rem', color: '#059669', fontWeight: 800, whiteSpace: 'nowrap' }}>✓ Đáp án</span>}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Exam list */
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center' }}>
                <Loader2 size={24} color="#1e3a8a" style={{ margin: '0 auto 8px', display: 'block', animation: 't-spin 1s linear infinite' }} />
                <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Đang tải...</div>
              </div>
            ) : exams.length === 0 ? (
              <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
                <ClipboardList size={36} color="#bfdbfe" style={{ margin: '0 auto 10px', display: 'block' }} />
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>Chưa có đề kiểm tra nào</div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 4 }}>Dùng chatbot TAI để tạo đề mới</div>
              </div>
            ) : exams.map(exam => {
              const isConfirmed = exam.status === 'confirmed';
              const ribbon = isConfirmed
                ? { bg: 'linear-gradient(135deg,#059669,#10b981)', text: 'Đã xác nhận', shadow: 'rgba(5,150,105,0.35)' }
                : { bg: 'linear-gradient(135deg,#d97706,#f59e0b)', text: 'Nháp',        shadow: 'rgba(217,119,6,0.35)'  };
              return (
                <div key={exam.id} style={{ position: 'relative', overflow: 'hidden', background: 'white', borderRadius: 14, border: `1px solid ${isConfirmed ? 'rgba(5,150,105,0.15)' : 'rgba(37,99,235,0.1)'}`, boxShadow: `0 2px 12px ${isConfirmed ? 'rgba(5,150,105,0.06)' : 'rgba(37,99,235,0.05)'}` }}>

                  {/* ── Diagonal ribbon ── */}
                  <div style={{ position: 'absolute', top: 14, right: -26, width: 96, background: ribbon.bg, boxShadow: `0 2px 6px ${ribbon.shadow}`, transform: 'rotate(45deg)', textAlign: 'center', padding: '4px 0', zIndex: 1, pointerEvents: 'none' }}>
                    <span style={{ fontSize: '0.52rem', fontWeight: 900, color: 'white', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{ribbon.text}</span>
                  </div>

                  {/* ── Info section ── */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '13px 14px 10px' }}>
                    {/* Icon */}
                    <div style={{ flexShrink: 0, width: 42, height: 42, borderRadius: 12, background: isConfirmed ? 'linear-gradient(135deg,rgba(5,150,105,0.12),rgba(16,185,129,0.07))' : 'linear-gradient(135deg,rgba(30,58,138,0.09),rgba(37,99,235,0.06))', border: `1px solid ${isConfirmed ? 'rgba(5,150,105,0.18)' : 'rgba(37,99,235,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                      <ClipboardList size={18} color={isConfirmed ? '#059669' : '#1e3a8a'} />
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0, paddingRight: 48 }}>
                      <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#1e293b', lineHeight: 1.3, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {exam.ten_mon || exam.ma_mon || '—'}
                      </div>
                      {/* Meta chips */}
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {exam.question_count != null && (
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#1e3a8a', background: 'rgba(30,58,138,0.07)', borderRadius: 20, padding: '2px 8px' }}>
                            {exam.question_count} câu
                          </span>
                        )}
                        {exam.time_limit != null && (
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#7c3aed', background: 'rgba(124,58,237,0.07)', borderRadius: 20, padding: '2px 8px' }}>
                            {exam.time_limit} phút
                          </span>
                        )}
                        {(exam.chapters ?? []).length > 0 && (
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#0369a1', background: 'rgba(3,105,161,0.07)', borderRadius: 20, padding: '2px 8px' }}>
                            {exam.chapters!.length} chương
                          </span>
                        )}
                        <span style={{ fontSize: '0.65rem', color: '#94a3b8', padding: '2px 0' }}>{fmtDate(exam.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* ── Action row ── */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px 11px', borderTop: '1px solid rgba(37,99,235,0.05)' }}>
                    {isConfirmed && (
                      <button
                        onClick={() => setAssigningExam(exam)}
                        disabled={!!loadingDetail || !!deletingId}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 13px', borderRadius: 9, background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', border: 'none', color: 'white', fontSize: '0.73rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.25)' }}
                      >
                        <Send size={11} /> Giao bài
                      </button>
                    )}
                    <div style={{ flex: 1 }} />
                    <button
                      onClick={() => handleViewDetail(exam.id)}
                      disabled={!!loadingDetail || !!deletingId}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 11px', borderRadius: 9, background: 'rgba(30,58,138,0.06)', border: '1px solid rgba(30,58,138,0.12)', color: '#1e3a8a', fontSize: '0.73rem', fontWeight: 700, cursor: (loadingDetail || deletingId) ? 'not-allowed' : 'pointer' }}
                    >
                      {loadingDetail ? <Loader2 size={11} style={{ animation: 't-spin 1s linear infinite' }} /> : <Eye size={11} />}
                      Xem
                    </button>
                    <button
                      onClick={() => handleDeleteExam(exam.id)}
                      disabled={deletingId === exam.id || !!loadingDetail}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 11px', borderRadius: 9, background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.13)', color: '#dc2626', fontSize: '0.73rem', fontWeight: 700, cursor: (deletingId === exam.id || loadingDetail) ? 'not-allowed' : 'pointer', opacity: deletingId === exam.id ? 0.5 : 1 }}
                    >
                      {deletingId === exam.id ? <Loader2 size={11} style={{ animation: 't-spin 1s linear infinite' }} /> : <Trash2 size={11} />}
                      Xóa
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        {!detail && (
          <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(37,99,235,0.07)', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{exams.length} đề kiểm tra · {subject.ma_mon}</span>
          </div>
        )}
      </div>

      {/* Assign modal */}
      {assigningExam && (
        <AssignModal
          exam={assigningExam}
          subject={subject}
          onClose={() => setAssigningExam(null)}
          onSuccess={() => setAssigningExam(null)}
        />
      )}
    </>
  );
};

// ── Main component ────────────────────────────────────
const TeacherAspx: FC = () => {
  const navigate     = useNavigate();
  const notifRef     = useRef<HTMLDivElement>(null);
  const user         = useAuthStore(s => s.user);
  const logout       = useAuthStore(s => s.logout);
  const [semesters, setSemesters]         = useState<ISemester[]>([]);
  const [currentHocKy, setCurrentHocKy]  = useState<number | null>(null);
  const [selectedHocKy, setSelectedHocKy]= useState<number | null>(null);
  const [courses, setCourses]             = useState<ITeacherSubjectWithClasses[]>([]);
  const [loadingSem, setLoadingSem]       = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [showAllSem, setShowAllSem]       = useState(false);
  const [courseView, setCourseView]       = useState<'list' | 'book'>('list');
  const [drawerSubject,   setDrawerSubject]   = useState<{ ma_mon: string; ten_mon: string } | null>(null);
  const [aiDrawerSubject, setAiDrawerSubject] = useState<{ ma_mon: string; ten_mon: string } | null>(null);
  const [examDrawerSubject, setExamDrawerSubject] = useState<{ ma_mon: string; ten_mon: string } | null>(null);

  // Load semesters
  useEffect(() => {
    setLoadingSem(true);
    TeacherApi.getSemesters()
      .then(res => {
        setSemesters(res.data.ds_hoc_ky);
        setCurrentHocKy(res.data.hoc_ky_hien_tai);
        setSelectedHocKy(res.data.hoc_ky_hien_tai);
      })
      .finally(() => setLoadingSem(false));
  }, []);

  // Load courses when semester changes
  useEffect(() => {
    if (!selectedHocKy) return;
    setLoadingCourses(true);
    TeacherApi.getSemesterCourses(selectedHocKy)
      .then(res => setCourses(res.data))
      .finally(() => setLoadingCourses(false));
  }, [selectedHocKy]);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

     const [isScrolled, setIsScrolled] = useState(false);

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Stats
  const totalClasses  = courses.reduce((s, c) => s + c.classes.length, 0);
  const totalStudents = courses.reduce((s, c) => s + c.classes.reduce((a, cl) => a + cl.sl_dk, 0), 0);
  // const selectedSem   = semesters.find(s => s.hoc_ky === selectedHocKy);
  const visibleSems   = showAllSem ? semesters : semesters.slice(0, 6);
  const unread        = NOTIFICATIONS.filter(n => n.unread).length;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#eef4ff,#e0eaff)', fontFamily: "'Be Vietnam Pro',system-ui,sans-serif" }}>
      <style>{CSS}</style>

      {/* ══ NAVBAR ══ */}
      <div 
       className={`
          sticky top-0 
          z-30 border-border border-b-none border-x backdrop-blur-md
          transition-[background-color,box-shadow] duration-300 ease-in-out 
          ${isScrolled ? "bg-background/40 shadow-md" : "bg-background"}
        `}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', gap: 12, height: 56 }}>
          {/* Brand */}
          <img src={logoTNUT} alt="TNUT" style={{ width: 30, height: 30, objectFit: 'contain', flexShrink: 0 }} />
          <div style={{ width: 1, height: 20, background: 'rgba(0,0,0,0.1)', flexShrink: 0 }} />
          <span className="t-nav-title">Cổng giảng viên</span>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Bell */}
          <button className="t-nav-btn" style={{ position: 'relative' }} onClick={() => notifRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
            <Bell size={15} />
            {unread > 0 && <span style={{ position: 'absolute', top: 7, right: 7, width: 5, height: 5, borderRadius: '50%', background: '#ef4444' }} />}
          </button>

          {/* Divider */}
          <div style={{ width: 1, height: 20, background: 'rgba(0,0,0,0.08)', flexShrink: 0 }} />

          {/* User pill */}
          {/* <button className="t-nav-user" onClick={() => navigate('/teacher/profile')}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#1e3a8a,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: 800, color: 'white', flexShrink: 0, boxShadow: '0 1px 4px rgba(37,99,235,0.3)' }}>
              {user?.name?.split(' ').map((w: string) => w[0]).slice(-2).join('').toUpperCase() ?? 'GV'}
            </div>
            <span className="t-nav-name">{user?.name ?? user?.username}</span>
          </button> */}

          {/* Logout */}
          <button className="t-nav-logout" onClick={handleLogout}>
            <LogOut size={13} />
            Đăng xuất
          </button>
        </div>
      </div>

      {/* ══ HERO ══ */}
      <div className="t-hero" style={{ background: 'linear-gradient(135deg,#1e3a8a 0%,#1d4ed8 60%,#3b82f6 100%)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -50, right: -50, width: 240, height: 240, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: -30, left: '35%', width: 160, height: 160, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)' }} />
        <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <GraduationCap size={16} color="#93c5fd" />
            <span style={{ fontSize: '0.75rem', color: '#93c5fd', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Cổng giảng viên TNUT</span>
          </div>
          <h1 style={{ margin: '0 0 4px', fontSize: '1.4rem', fontWeight: 800, color: 'white' }}>
            Xin chào, {user?.name?.split(' ').pop() ?? 'Giảng viên'}! 👨‍🏫
          </h1>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)' }}>
            {user?.username} &nbsp;·&nbsp; {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* ══ MAIN ══ */}
      <div className="t-main">

        {/* ── LEFT: THÔNG BÁO ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div ref={notifRef} className="t-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(37,99,235,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Bell size={15} color="#2563eb" />
                <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e3a8a' }}>Thông báo</span>
                {unread > 0 && <span style={{ background: '#2563eb', color: 'white', borderRadius: 20, padding: '1px 7px', fontSize: '0.67rem', fontWeight: 700 }}>{unread}</span>}
              </div>
              <span style={{ fontSize: '0.72rem', color: '#2563eb', cursor: 'pointer', fontWeight: 600 }}>Xem tất cả</span>
            </div>
            <div style={{ padding: '4px 12px 8px' }}>
              {NOTIFICATIONS.map(n => (
                <div key={n.id} className="t-notif">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ background: `${n.color}18`, color: n.color, border: `1px solid ${n.color}30`, borderRadius: 20, padding: '1px 7px', fontSize: '0.62rem', fontWeight: 700 }}>{n.tag}</span>
                    <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{n.date}</span>
                    {n.unread && <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#2563eb', flexShrink: 0 }} />}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#1e293b', lineHeight: 1.45, fontWeight: n.unread ? 600 : 400 }}>{n.title}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Profile shortcut */}
          <div onClick={() => navigate('/teacher/profile')} className="t-card" style={{ padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'transform .18s' }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
          >
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#1e3a8a,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <User size={18} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1e3a8a' }}>Hồ sơ giảng viên</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>Xem thông tin tài khoản</div>
            </div>
            <ChevronRight size={15} color="#2563eb" />
          </div>

          {/* AI Chatbot shortcut */}
          <div onClick={() => navigate('/teacher/chat')} className="t-card" style={{ padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'transform .18s' }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
          >
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#4c1d95,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MessageSquare size={18} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#4c1d95' }}>TAI - TNUT</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>Trợ lý AI tạo đề kiểm tra</div>
            </div>
            <ChevronRight size={15} color="#7c3aed" />
          </div>

          {/* Assignments shortcut */}
          <div onClick={() => navigate('/teacher/assignments')} className="t-card" style={{ padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'transform .18s' }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
          >
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#0f172a,#1e3a8a)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Send size={18} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1e3a8a' }}>Bài đã giao</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>Theo dõi tiến độ nộp bài</div>
            </div>
            <ChevronRight size={15} color="#1e3a8a" />
          </div>
        </div>

        {/* ── RIGHT: TEACHING MANAGEMENT ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Semester selector */}
          <div className="t-card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={16} color="#2563eb" />
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e3a8a' }}>Chọn học kỳ</span>
              </div>
              {loadingSem && <RefreshCw size={14} color="#2563eb" style={{ animation: 't-spin .8s linear infinite' }} />}
            </div>

            {loadingSem ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[1,2,3,4].map(i => <div key={i} style={{ width: 160, height: 32, borderRadius: 20, background: 'linear-gradient(90deg,#e0eaff 25%,#c7d9fe 50%,#e0eaff 75%)', animation: 't-pulse 1.4s ease infinite' }} />)}
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {visibleSems.map(sem => {
                    const isSel = sem.hoc_ky === selectedHocKy;
                    const isCur = sem.hoc_ky === currentHocKy;
                    return (
                      <button
                        key={sem.id}
                        className="t-sem-pill"
                        onClick={() => setSelectedHocKy(sem.hoc_ky)}
                        style={{
                          background: isSel ? 'linear-gradient(135deg,#1e3a8a,#2563eb)' : 'rgba(255,255,255,0.7)',
                          color: isSel ? 'white' : '#334155',
                          borderColor: isSel ? 'transparent' : isCur ? '#2563eb' : 'rgba(37,99,235,0.2)',
                          boxShadow: isSel ? '0 4px 14px rgba(37,99,235,0.3)' : 'none',
                        }}
                      >
                        {isCur && !isSel && <span style={{ marginRight: 4, fontSize: '0.6rem', color: '#2563eb' }}>●</span>}
                        {sem.ten_hoc_ky}
                      </button>
                    );
                  })}
                </div>
                {semesters.length > 6 && (
                  <button onClick={() => setShowAllSem(v => !v)} style={{ marginTop: 8, background: 'none', border: 'none', color: '#2563eb', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
                    {showAllSem ? '▲ Thu gọn' : `▼ Xem thêm ${semesters.length - 6} học kỳ`}
                  </button>
                )}
              </>
            )}
          </div>
          {/* Stats bar */}
          {!loadingCourses && courses.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem' }}>
              {[
                { icon: <Layers size={18} color="#2563eb" />, label: 'Môn học', value: courses.length, bg: 'rgba(37,99,235,0.07)' },
                { icon: <BookOpen size={18} color="#059669" />, label: 'Lớp/Tổ', value: totalClasses, bg: 'rgba(5,150,105,0.07)' },
                { icon: <Users size={18} color="#7c3aed" />, label: 'Sinh viên', value: totalStudents, bg: 'rgba(124,58,237,0.07)' },
              ].map(({ icon, label, value, bg }) => (
                <div key={label} className="t-card" style={{ padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 35, height: 35, borderRadius: 11, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
                  <div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1e3a8a', lineHeight: 1 }}>{value}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 3 }}>{label}</div>
                    
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Course cards */} 
          {loadingCourses ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[1,2,3].map(i => (
                <div key={i} className="t-card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}><Sk w="180px" h="18px" /><Sk w="60px" h="18px" /></div>
                  <Sk w="100%" h="48px" />
                </div>
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="t-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
              <Sparkles size={32} color="#94a3b8" style={{ margin: '0 auto 12px', display: 'block' }} />
              <div style={{ fontWeight: 700, color: '#64748b' }}>Không có dữ liệu học kỳ này</div>
            </div>
          ) : (
            <>
              {/* View toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>{courses.length} môn học</span>
                <div style={{ display: 'flex', gap: 3, background: 'rgba(37,99,235,0.07)', borderRadius: 12, padding: 3 }}>
                  {([['list', '☰ Danh sách'], ['book', '📚 Kệ sách']] as const).map(([mode, label]) => (
                    <button key={mode} onClick={() => setCourseView(mode)} className="t-view-btn"
                      style={{ background: courseView === mode ? 'white' : 'transparent', color: courseView === mode ? '#1e3a8a' : '#94a3b8', boxShadow: courseView === mode ? '0 1px 6px rgba(37,99,235,0.14)' : 'none' }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {courseView === 'list'
                ? <CourseListView courses={courses} onNavigate={url => navigate(url)} onDocuments={setDrawerSubject} onAiDocuments={setAiDrawerSubject} onExams={setExamDrawerSubject} />
                : <CourseBookshelfView courses={courses} onNavigate={url => navigate(url)} onDocuments={setDrawerSubject} onAiDocuments={setAiDrawerSubject} onExams={setExamDrawerSubject} />
              }
            </>
          )}
        </div>
      </div>

      {/* ══ DRAWER: TÀI LIỆU ══ */}
      {drawerSubject && (
        <SubjectFilesDrawer subject={drawerSubject} onClose={() => setDrawerSubject(null)} />
      )}

      {/* ══ DRAWER: TÀI LIỆU MODEL TRAIN AI ══ */}
      {aiDrawerSubject && (
        <SubjectAiFilesDrawer subject={aiDrawerSubject} onClose={() => setAiDrawerSubject(null)} />
      )}

      {/* ══ DRAWER: BÀI KIỂM TRA ══ */}
      {examDrawerSubject && (
        <SubjectExamsDrawer subject={examDrawerSubject} onClose={() => setExamDrawerSubject(null)} />
      )}

      {/* ══ FOOTER ══ */}
      <div style={{ borderTop: '1px solid rgba(37,99,235,0.1)', padding: '10px 1.5rem', textAlign: 'center', fontSize: '0.72rem', color: '#94a3b8' }}>
        © 2026 Thai Nguyen University of Technology &nbsp;·&nbsp; hotro@tnut.edu.vn &nbsp;·&nbsp; (0208) 384.6145
      </div>
    </div>
  );
};

export default TeacherAspx;
