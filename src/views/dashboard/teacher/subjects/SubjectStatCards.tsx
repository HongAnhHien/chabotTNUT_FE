import { type FC } from 'react';
import { BookOpen, Users, GraduationCap } from 'lucide-react';

interface Props { subjects: number; classes: number; students: number; }

const SubjectStatCards: FC<Props> = ({ subjects, classes, students }) => (
  <div className="sl-stats-grid">
    {[
      { icon: BookOpen,       bg:'#eff6ff', color:'#2563eb', value: subjects, label:'Môn học'   },
      { icon: Users,          bg:'#f0fdf4', color:'#16a34a', value: classes,  label:'Lớp / Tổ'  },
      { icon: GraduationCap,  bg:'#fdf4ff', color:'#7c3aed', value: students, label:'Sinh viên' },
    ].map(({ icon: Icon, bg, color, value, label }) => (
      <div key={label} className="sl-stat-card">
        <div style={{ width:44, height:44, borderRadius:12, background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Icon size={22} color={color} />
        </div>
        <div>
          <div style={{ fontSize:'1.6rem', fontWeight:800, color:'#0f172a', lineHeight:1 }}>{value}</div>
          <div style={{ fontSize:'0.75rem', color:'#64748b', marginTop:3 }}>{label}</div>
        </div>
      </div>
    ))}
  </div>
);

export default SubjectStatCards;
