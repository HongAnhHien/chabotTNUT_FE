import { type FC } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { BookOpen, GraduationCap } from 'lucide-react';

interface Props {
  basePath: string; // e.g. "/student/chat" or "/teacher/chat"
  chatLabel: string; // label của tab chat theo môn (khác nhau theo role)
}

// Mỗi chế độ có màu + mô tả riêng để không lẫn: tím = hỏi bài theo môn,
// xanh = cố vấn học tập (dữ liệu Portal). Màu này khớp với accent của từng trang.
const SUBJECT_COLOR = '#6d28d9';
const ADVISOR_COLOR = '#2563eb';

const ChatModeLayout: FC<Props> = ({ basePath, chatLabel }) => {
  const { pathname } = useLocation();
  const onAdvisor = pathname.startsWith(`${basePath}/advisor`);

  const TABS = [
    {
      path: basePath, label: chatLabel, icon: BookOpen, color: SUBJECT_COLOR, end: true,
      desc: 'Hỏi kiến thức, giải bài, luyện tập theo từng môn học.',
    },
    {
      path: `${basePath}/advisor`, label: 'Cố vấn học tập', icon: GraduationCap, color: ADVISOR_COLOR, end: false,
      desc: 'Hỏi về điểm, thời khóa biểu, lịch thi, tư vấn ngành nghề.',
    },
  ];

  const active = onAdvisor ? TABS[1] : TABS[0];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 4, padding: '8px 14px 0', background: 'white', flexShrink: 0 }}>
        {TABS.map(tab => (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={tab.end}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px',
              borderRadius: '8px 8px 0 0',
              fontSize: '0.82rem', fontWeight: 700,
              color: isActive ? tab.color : '#64748b',
              background: isActive ? `${tab.color}12` : 'transparent',
              borderBottom: isActive ? `2px solid ${tab.color}` : '2px solid transparent',
              textDecoration: 'none',
              transition: 'background .14s,color .14s',
            })}
          >
            <tab.icon size={15} />
            {tab.label}
          </NavLink>
        ))}
      </div>
      {/* Dòng mô tả mục đích của tab đang mở — đổi màu theo chế độ để chống nhầm */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '7px 18px', background: `${active.color}0a`,
        borderBottom: `1px solid ${active.color}1f`, flexShrink: 0,
        fontSize: '0.74rem', fontWeight: 600, color: active.color,
      }}>
        <active.icon size={13} />
        <span>{active.desc}</span>
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Outlet />
      </div>
    </div>
  );
};

export default ChatModeLayout;
