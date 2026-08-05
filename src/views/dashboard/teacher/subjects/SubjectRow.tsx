import { type FC, useState } from 'react';
import { BookOpen, Users, MapPin, Calendar, ChevronDown, FileText, ClipboardList, Info, Sparkles, AlertTriangle, MessageCircle } from 'lucide-react';
import type { ITeacherSubjectWithClasses, ISubjectAnalyticsEmbed } from '@/infra/api/interfaces/ITeacher';
import type { IAnalyticsSummary } from '@/infra/api/interfaces/IChat';

type Cls = ITeacherSubjectWithClasses['classes'][number];

const COLORS = [
  { grad:'linear-gradient(135deg,#1e3a8a,#2563eb)', glow:'rgba(37,99,235,0.25)', light:'#eff6ff', accent:'#2563eb' },
  { grad:'linear-gradient(135deg,#6d28d9,#7c3aed)', glow:'rgba(124,58,237,0.25)', light:'#f5f3ff', accent:'#7c3aed' },
  { grad:'linear-gradient(135deg,#065f46,#059669)', glow:'rgba(5,150,105,0.25)', light:'#f0fdf4', accent:'#059669' },
  { grad:'linear-gradient(135deg,#9a3412,#ea580c)', glow:'rgba(234,88,12,0.25)', light:'#fff7ed', accent:'#ea580c' },
  { grad:'linear-gradient(135deg,#1e40af,#0891b2)', glow:'rgba(8,145,178,0.25)', light:'#f0f9ff', accent:'#0891b2' },
  { grad:'linear-gradient(135deg,#831843,#db2777)', glow:'rgba(219,39,119,0.25)', light:'#fdf2f8', accent:'#db2777' },
  { grad:'linear-gradient(135deg,#78350f,#d97706)', glow:'rgba(217,119,6,0.25)', light:'#fffbeb', accent:'#d97706' },
  { grad:'linear-gradient(135deg,#1e3a8a,#4f46e5)', glow:'rgba(79,70,229,0.25)', light:'#eef2ff', accent:'#4f46e5' },
];

interface Props {
  course:     ITeacherSubjectWithClasses;
  colorIdx:   number;
  analytics?: ISubjectAnalyticsEmbed;
  analyticsLoading?: boolean;
  chatSummary?: IAnalyticsSummary;
  onDetail:   () => void;
  onFiles:    () => void;
  onExams:    () => void;
  onClsDetail: (cls: Cls) => void;
  onStudents:  (cls: Cls) => void;
  onClsExams:  (cls: Cls) => void;
}

const SubjectRow: FC<Props> = ({ course, colorIdx, analytics, analyticsLoading, chatSummary, onDetail, onFiles, onExams, onClsDetail, onStudents, onClsExams }) => {
  const [expanded, setExpanded] = useState(true);
  const { subject, classes } = course;
  const color = COLORS[colorIdx % COLORS.length];

  const completionPct = analytics ? Math.round(analytics.completion_rate) : null;
  const aiPct = analytics && analytics.total_students > 0
    ? Math.round(analytics.ai_users / analytics.total_students * 100)
    : null;

  return (
    <div className="sl-card sl-subject-row" style={{ overflow:'hidden', borderLeft:`4px solid ${color.accent}` }}>

      {/* ── Subject header (always visible) ── */}
      <div
        className="sl-subject-header"
        style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:14, padding:'14px 18px', cursor:'pointer', userSelect:'none' }}
        onClick={() => setExpanded(v => !v)}
      >
        {/* Icon */}
        <div style={{ width:40, height:40, borderRadius:10, background:color.grad, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:`0 3px 8px ${color.glow}` }}>
          <BookOpen size={18} color="white" strokeWidth={1.8} />
        </div>

        {/* Name + badges */}
        <div style={{ flex:'1 1 160px', minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:7, flexWrap:'wrap', marginBottom:6 }}>
            <span style={{ fontWeight:700, fontSize:'0.95rem', color:'#0f172a' }}>{subject.ten_mon}</span>
            <span style={{ background:color.light, color:color.accent, borderRadius:6, padding:'1px 8px', fontSize:'0.7rem', fontWeight:700 }}>{subject.ma_mon}</span>
            {subject.so_tc !== '0' && (
              <span style={{ background:'#f0fdf4', color:'#16a34a', borderRadius:6, padding:'1px 8px', fontSize:'0.7rem', fontWeight:700 }}>{subject.so_tc} TC</span>
            )}
            <span style={{ fontSize:'0.7rem', color:'#94a3b8' }}>{classes.length} lớp</span>
          </div>

          {/* Mini metrics */}
          {analyticsLoading ? (
            <div style={{ height:12, width:'min(220px,70%)', borderRadius:6, background:'#eef2f7', animation:'sl-pulse 1.4s ease infinite' }} />
          ) : analytics && (
            <div style={{ display:'flex', alignItems:'center', gap:18, flexWrap:'wrap' }}>
              <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.72rem', color:'#64748b' }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:color.accent, flexShrink:0 }} /> {analytics.total_students} sinh viên
              </span>
              <span style={{ display:'flex', alignItems:'center', gap:8, fontSize:'0.72rem', color:'#64748b' }}>
                Hoàn thành
                <span style={{ width:80, height:6, borderRadius:6, background:'#eef2f7', overflow:'hidden', display:'inline-block' }}>
                  <span style={{ display:'block', height:'100%', width:`${completionPct}%`, borderRadius:6, background:color.accent }} />
                </span>
                <b style={{ color:color.accent }}>{completionPct}%</b>
              </span>
              <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.72rem', color:'#64748b' }}>
                <Sparkles size={11} color="#7c3aed" /> {aiPct}% dùng AI
              </span>
              {analytics.attention_count > 0 && (
                <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.72rem', fontWeight:600, color:'#ea580c' }}>
                  <AlertTriangle size={11} /> {analytics.attention_count} cần chú ý
                </span>
              )}
              {chatSummary && (
                <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.72rem', color:'#64748b' }}>
                  <MessageCircle size={11} color="#2563eb" /> {chatSummary.total_messages} tin nhắn{chatSummary.helpful_rate ? ` · ${chatSummary.helpful_rate.rate}% hữu ích` : ''}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Subject action buttons */}
        <div className="sl-subject-actions" style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:6, flexShrink:0 }} onClick={e => e.stopPropagation()}>
          <button onClick={onDetail} className="sl-btn" style={{ background:'rgba(37,99,235,0.07)', border:'1px solid rgba(37,99,235,0.18)', color:'#2563eb' }}>
            <Info size={13} /> Thông kê môn
          </button>
          <button onClick={onFiles} className="sl-btn" style={{ background:'rgba(37,99,235,0.07)', border:'1px solid rgba(37,99,235,0.18)', color:'#2563eb' }}>
            <FileText size={13} /> Tài liệu
          </button>
          <button onClick={onExams} className="sl-btn" style={{ background:'rgba(37,99,235,0.07)', border:'1px solid rgba(37,99,235,0.18)', color:'#2563eb' }}>
            <ClipboardList size={13} /> Bài kiểm tra
          </button>
        </div>

        {/* Expand chevron */}
        <ChevronDown
          size={16} color="#94a3b8"
          style={{ flexShrink:0, transition:'transform .22s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </div>

      {/* ── Expanded: class list ── */}
      {expanded && (
        <div style={{ borderTop:`1px solid ${color.light}`, background:'#f8fafc', animation:'sl-expand .22s ease both', padding:'10px 16px', display:'flex', flexDirection:'column', gap:8 }}>
          {classes.map(cls => (
            <div
              key={cls.id_to_hoc}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:'white', borderRadius:10, border:'1px solid #e8edf3', boxShadow:'0 1px 3px rgba(15,23,42,0.04)', flexWrap:'wrap' }}
            >
              {/* Class indicator */}
              <div style={{ width:6, height:6, borderRadius:'50%', background:color.accent, flexShrink:0 }} />

              {/* Class info */}
              <div style={{ flex:1, minWidth:0, display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                <span style={{ fontWeight:700, fontSize:'0.84rem', color:'#0f172a', whiteSpace:'nowrap' }}>{cls.nhom_to}</span>
                {cls.ten_lop && (
                  <span style={{ fontSize:'0.78rem', color:'#475569', whiteSpace:'nowrap' }}>{cls.ten_lop}</span>
                )}
                {cls.phong && (
                  <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:'0.74rem', color:'#64748b', background:'#f1f5f9', borderRadius:5, padding:'1px 7px' }}>
                    <MapPin size={10} />{cls.phong}
                  </span>
                )}
                {cls.thoi_gian_hoc && (
                  <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:'0.74rem', color:'#64748b', background:'#f1f5f9', borderRadius:5, padding:'1px 7px' }}>
                    <Calendar size={10} />{cls.thoi_gian_hoc}
                  </span>
                )}
                {cls.sl_dk > 0 && (
                  <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:'0.74rem', fontWeight:600, color:'#2563eb', background:'rgba(37,99,235,0.07)', borderRadius:5, padding:'1px 7px' }}>
                    <Users size={10} />{cls.sl_dk} SV
                  </span>
                )}
              </div>

              {/* Class action buttons */}
              <div className="sl-class-actions" style={{ display:'flex', flexWrap:'wrap', gap:6, flexShrink:0 }}>
                <button onClick={() => onClsDetail(cls)} className="sl-btn" style={{ background:'#f8fafc', border:'1px solid #e2e8f0', color:'#475569' }}>
                  <Info size={12} /> Thống kê lớp
                </button>
                <button onClick={() => onStudents(cls)} className="sl-btn" style={{ background:'#f8fafc', border:'1px solid #e2e8f0', color:'#475569' }}>
                  <Users size={12} /> Học sinh
                </button>
                <button onClick={() => onClsExams(cls)} className="sl-btn" style={{ background:'#f8fafc', border:'1px solid #e2e8f0', color:'#475569' }}>
                  <ClipboardList size={12} /> Bài kiểm tra
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubjectRow;
