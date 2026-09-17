import { type FC } from 'react';
import toast from 'react-hot-toast';
import { Route, RefreshCcw, FileText, UserCheck, Lightbulb } from 'lucide-react';
import type { IStudentSubject } from '@/infra/api/interfaces/IStudent';
import type { ISubjectMastery } from '@/infra/student/student_api';

interface Props {
  subjects: IStudentSubject[];
  mastery: Record<string, ISubjectMastery>;
  onNewChat: () => void;
}

const StudentTools: FC<Props> = ({ subjects, mastery, onNewChat }) => {
  // Mẹo học hôm nay — chọn từ mức thành thạo thật.
  const rows = subjects.map(s => ({ ten: s.ten_mon, info: mastery[s.ma_mon] }));
  const canOn = rows.filter(r => r.info?.trang_thai === 'can_on').sort((a, b) => (a.info?.mastery ?? 0) - (b.info?.mastery ?? 0));
  const chuaHoc = rows.filter(r => !r.info || r.info.trang_thai === 'chua_hoc');
  const tip = canOn[0]
    ? <>Ưu tiên ôn <b>{canOn[0].ten}</b> — đang yếu ({canOn[0].info?.mastery}%).</>
    : chuaHoc[0]
      ? <>Bắt đầu với <b>{chuaHoc[0].ten}</b> để không dồn cuối kỳ.</>
      : <>Giữ nhịp học đều mỗi ngày để giữ streak nhé!</>;

  const TOOLS = [
    { icon: Route, label: 'Lộ trình của em', on: () => toast('Xem "Lộ trình hôm nay" ở panel bên phải →', { icon: '🧭' }) },
    { icon: RefreshCcw, label: 'Ôn lại chỗ hay sai', on: () => toast('Sắp có — đang tổng hợp câu bạn hay sai.', { icon: '📌' }) },
    { icon: FileText, label: 'Đề thi thử', on: onNewChat },
    { icon: UserCheck, label: 'Gặp giảng viên thật', on: () => toast('Dùng tab "Cố vấn học tập" để kết nối giảng viên.', { icon: '🎓' }) },
  ];

  return (
    <div style={{ flexShrink: 0, borderTop: '1px solid #eef0f5', padding: '12px 12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#94a3b8' }}>Công cụ</div>
      {TOOLS.map((t, i) => (
        <button key={i} onClick={t.on}
          style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 6px', borderRadius: 9, color: '#334155', fontSize: '0.82rem', fontWeight: 500 }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(37,99,235,0.05)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
          <span style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(37,99,235,0.07)', color: '#2563eb', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <t.icon size={15} />
          </span>
          {t.label}
        </button>
      ))}

      <div style={{ marginTop: 4, background: '#fffbeb', border: '1px solid #f6e7c4', borderRadius: 12, padding: '10px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', fontWeight: 700, color: '#b4661a', marginBottom: 3 }}>
          <Lightbulb size={13} /> Mẹo học hôm nay
        </div>
        <div style={{ fontSize: '0.74rem', color: '#78716c', lineHeight: 1.5 }}>{tip}</div>
      </div>
    </div>
  );
};

export default StudentTools;
