import { type FC } from 'react';
import toast from 'react-hot-toast';
import { BookOpenCheck, PlayCircle } from 'lucide-react';

interface Props { subjectName?: string | null }

// Khung MẪU "Tóm tắt bài giảng / Video tóm tắt chương" ở màn chào mừng.
// Nội dung tóm tắt/video sẽ do giảng viên nạp qua CMS học liệu — hiện đánh dấu "Sắp có".
const LectureSummary: FC<Props> = ({ subjectName }) => {
  const soon = (loai: string) =>
    toast(`Sắp có — ${loai} sẽ hiển thị khi giảng viên nạp học liệu tóm tắt qua CMS.`, { icon: '📚' });

  const CARDS = [
    { icon: BookOpenCheck, title: 'Tóm tắt bài giảng', desc: 'Điểm chính từng chương dạng thẻ lật, dễ ôn nhanh.', color: '#0e7c8a', bg: 'rgba(14,124,138,0.07)', on: () => soon('bản tóm tắt bài giảng') },
    { icon: PlayCircle, title: 'Video tóm tắt chương', desc: 'Video ngắn tóm tắt nội dung chính của chương.', color: '#6d28d9', bg: 'rgba(109,40,217,0.07)', on: () => soon('video tóm tắt chương') },
  ];

  return (
    <div style={{ flexShrink: 0, padding: '14px 16px 4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 8 }}>
        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155' }}>
          Học nhanh{subjectName ? ` · ${subjectName}` : ''}
        </span>
        <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#b4661a', background: '#f7ece0', border: '1px solid #e8c9a6', borderRadius: 20, padding: '2px 9px' }}>Sắp có</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10 }}>
        {CARDS.map((c, i) => (
          <button key={i} onClick={c.on}
            style={{ textAlign: 'left', cursor: 'pointer', background: 'white', border: '1px dashed #cbd5e1', borderRadius: 14, padding: '13px 14px', display: 'flex', gap: 11, alignItems: 'flex-start' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = c.color)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#cbd5e1')}>
            <span style={{ width: 38, height: 38, borderRadius: 11, background: c.bg, color: c.color, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <c.icon size={19} />
            </span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>{c.title}</span>
              <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', marginTop: 2, lineHeight: 1.45 }}>{c.desc}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LectureSummary;
