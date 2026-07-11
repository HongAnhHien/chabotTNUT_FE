import { type FC } from 'react';
import { NavLink, Outlet } from 'react-router';
import { BookOpen, GraduationCap } from 'lucide-react';

interface Props {
  basePath: string; // e.g. "/student/chat" or "/teacher/chat"
  chatLabel: string; // label của tab chat theo môn (khác nhau theo role)
}

const ChatModeLayout: FC<Props> = ({ basePath, chatLabel }) => {
  const TABS = [
    { path: basePath,              label: chatLabel,         icon: BookOpen },
    { path: `${basePath}/advisor`, label: 'Cố vấn học tập',  icon: GraduationCap },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 4, padding: '8px 14px 0', background: 'white', borderBottom: '1px solid #eef0f5', flexShrink: 0 }}>
        {TABS.map(tab => (
          <NavLink
            key={tab.path}
            to={tab.path}
            end
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px',
              borderRadius: '8px 8px 0 0',
              fontSize: '0.82rem', fontWeight: 700,
              color: isActive ? '#2563eb' : '#64748b',
              background: isActive ? 'rgba(37,99,235,0.07)' : 'transparent',
              borderBottom: isActive ? '2px solid #2563eb' : '2px solid transparent',
              textDecoration: 'none',
              transition: 'background .14s,color .14s',
            })}
          >
            <tab.icon size={15} />
            {tab.label}
          </NavLink>
        ))}
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Outlet />
      </div>
    </div>
  );
};

export default ChatModeLayout;
