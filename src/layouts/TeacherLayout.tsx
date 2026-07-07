import { type FC, useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router';
import { useAuthStore } from '@/views/pages/stores/auth_store';
import TeacherSidebar from '@/components/teacher/TeacherSidebar';
import StudentHeader from '@/components/student/StudentHeader';
import { useNotifications } from '@/hooks/useNotifications';
import type { INotification } from '@/infra/api/interfaces/INotification';

const MOBILE_BP = 768;

const TeacherLayout: FC = () => {
  const navigate = useNavigate();
  const user    = useAuthStore(s => s.user);
  const logout  = useAuthStore(s => s.logout);
  const { notifications, unreadCount, loading: notifLoading, markRead, markAllRead } = useNotifications('teacher');

  const [collapsed,  setCollapsed]  = useState(false);
  const [isMobile,   setIsMobile]   = useState(() => window.innerWidth < MOBILE_BP);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BP - 1}px)`);
    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
      if (!e.matches) setMobileOpen(false);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  const initials = user?.name
    ?.split(' ').map((w: string) => w[0]).slice(-2).join('').toUpperCase() ?? 'GV';

  const handleNotificationClick = (n: INotification) => {
    const assignmentId = (n.data as { assignment_id?: string })?.assignment_id;
    if (assignmentId) navigate(`/teacher/assignments/${assignmentId}`);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f8fafc' }}>
      <TeacherSidebar
        userName={user?.name}
        userCode={user?.username}
        userInitials={initials}
        userAvatar={user?.avatar}
        onLogout={handleLogout}
        collapsed={collapsed}
        onToggle={() => setCollapsed(v => !v)}
        isMobile={isMobile}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <StudentHeader
          notifications={notifications}
          unreadCount={unreadCount}
          notifLoading={notifLoading}
          onMarkRead={markRead}
          onMarkAllRead={markAllRead}
          onNotificationClick={handleNotificationClick}
          onLogout={handleLogout}
          onMenuClick={isMobile ? () => setMobileOpen(true) : undefined}
          isMobile={isMobile}
          notificationsPath="/teacher/notifications"
        />
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default TeacherLayout;
