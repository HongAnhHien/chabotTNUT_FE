import { useCallback, useEffect, useRef, useState } from 'react';
import StudentApi from '@/infra/student/student_api';
import TeacherApi from '@/infra/teacher/teacher_api';
import AdminApi from '@/infra/admin/admin_api';
import type { INotification } from '@/infra/api/interfaces/INotification';

const ACTIVE_INTERVAL_MS     = 30_000;
const BACKGROUND_INTERVAL_MS = 120_000;

export type NotificationRole = 'student' | 'teacher' | 'admin';

const apiFor = (role: NotificationRole) =>
  role === 'student' ? StudentApi : role === 'teacher' ? TeacherApi : AdminApi;

export const useNotifications = (role: NotificationRole) => {
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await apiFor(role).getNotifications({ per_page: 20 });
      setNotifications(res.data ?? []);
      setUnreadCount(res.unread_count ?? 0);
    } catch {
      // Bỏ qua lỗi polling nền — không làm phiền user bằng toast mỗi 30s
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    let cancelled = false;

    const schedule = () => {
      const delay = document.hidden ? BACKGROUND_INTERVAL_MS : ACTIVE_INTERVAL_MS;
      timerRef.current = setTimeout(async () => {
        if (cancelled) return;
        await fetchNotifications();
        if (!cancelled) schedule();
      }, delay);
    };

    fetchNotifications().then(() => { if (!cancelled) schedule(); });

    const handleVisibility = () => {
      if (document.hidden) return;
      // Tab active trở lại → fetch ngay thay vì chờ tới nhịp poll chậm còn lại
      if (timerRef.current) clearTimeout(timerRef.current);
      fetchNotifications().then(() => { if (!cancelled) schedule(); });
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchNotifications]);

  const markRead = useCallback(async (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id && !n.read_at) ? { ...n, read_at: new Date().toISOString() } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      await apiFor(role).markNotificationRead(id);
    } catch {
      // giữ optimistic update — lần poll kế tiếp sẽ tự đồng bộ lại nếu request thật sự thất bại
    }
  }, [role]);

  const markAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => n.read_at ? n : { ...n, read_at: new Date().toISOString() }));
    setUnreadCount(0);
    try {
      await apiFor(role).markAllNotificationsRead();
    } catch {
      // no-op — sync lại ở lần poll kế tiếp
    }
  }, [role]);

  return { notifications, unreadCount, loading, refresh: fetchNotifications, markRead, markAllRead };
};
