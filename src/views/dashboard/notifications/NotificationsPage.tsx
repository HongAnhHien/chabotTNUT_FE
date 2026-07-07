import { type FC, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { ArrowLeft, ClipboardList, Bell, Clock, Calendar, Loader2, CheckCheck, BellOff } from 'lucide-react';
import toast from 'react-hot-toast';
import StudentApi from '@/infra/student/student_api';
import TeacherApi from '@/infra/teacher/teacher_api';
import type { INotification, NotificationType, INotificationsMeta } from '@/infra/api/interfaces/INotification';

const TYPE_META: Record<NotificationType, { icon: typeof Bell; color: string; bg: string }> = {
  assignment_assigned:          { icon: ClipboardList, color: '#2563eb', bg: '#eff5ff' },
  assignment_reminder:          { icon: Bell,           color: '#b45309', bg: '#fffbeb' },
  assignment_due_soon:          { icon: Clock,          color: '#dc2626', bg: '#fef2f2' },
  assignment_due_soon_teacher:  { icon: Clock,          color: '#dc2626', bg: '#fef2f2' },
  exam_schedule_reminder:       { icon: Calendar,       color: '#7c3aed', bg: '#f5f3ff' },
};

const timeAgo = (iso: string) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1)  return 'Vừa xong';
  if (min < 60) return `${min} phút trước`;
  const hr = Math.floor(min / 60);
  if (hr < 24)  return `${hr} giờ trước`;
  const day = Math.floor(hr / 24);
  if (day < 7)  return `${day} ngày trước`;
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso));
};

const CSS = `@keyframes np-spin { to { transform: rotate(360deg); } }`;

const NotificationsPage: FC = () => {
  const location = useLocation();
  const navigate  = useNavigate();
  const role: 'student' | 'teacher' = location.pathname.startsWith('/teacher') ? 'teacher' : 'student';
  const api  = role === 'student' ? StudentApi : TeacherApi;
  const home = role === 'student' ? '/student/dashboard' : '/teacher/dashboard';
  const perPage = 20;

  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [meta,          setMeta]          = useState<INotificationsMeta | null>(null);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [page,          setPage]          = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.getNotifications({ page, per_page: perPage })
      .then(res => {
        if (cancelled) return;
        setNotifications(res.data ?? []);
        setMeta(res.meta ?? null);
        setUnreadCount(res.unread_count ?? 0);
      })
      .catch(() => { if (!cancelled) toast.error('Không thể tải thông báo.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, role]);

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id && !n.read_at) ? { ...n, read_at: new Date().toISOString() } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    api.markNotificationRead(id).catch(() => {});
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => n.read_at ? n : { ...n, read_at: new Date().toISOString() }));
    setUnreadCount(0);
    api.markAllNotificationsRead()
      .then(r => toast.success(r.message || 'Đã đánh dấu tất cả đã đọc.'))
      .catch(() => toast.error('Không thể đánh dấu đã đọc.'));
  };

  const handleItemClick = (n: INotification) => {
    if (!n.read_at) markRead(n.id);
    const assignmentId = (n.data as { assignment_id?: string })?.assignment_id;
    const maMon        = (n.data as { ma_mon?: string })?.ma_mon;
    if (n.type === 'exam_schedule_reminder' && maMon) {
      navigate(role === 'student' ? `/student/subjects/${maMon}` : `/teacher/subjects/${maMon}/exams`);
    } else if (assignmentId) {
      navigate(role === 'student' ? `/student/assignments/${assignmentId}` : `/teacher/assignments/${assignmentId}`);
    }
  };

  return (
    <div style={{ minHeight: '100%', background: '#f4f6fb' }}>
      <style>{CSS}</style>

      <div style={{ background: 'white', borderBottom: '1px solid #eef0f5', position: 'sticky', top: 0, zIndex: 20, boxShadow: '0 2px 8px rgba(30,58,138,0.05)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(home)}
            style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 10, background: 'rgba(37,99,235,0.06)', border: '1.5px solid rgba(37,99,235,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#2563eb' }}>
            <ArrowLeft size={15} />
          </button>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Thông báo</h1>
            {unreadCount > 0 && (
              <span style={{ fontSize: 12, fontWeight: 800, color: 'white', background: '#ef4444', borderRadius: 999, padding: '1px 8px' }}>{unreadCount}</span>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead}
              style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', fontSize: 13, fontWeight: 700, padding: '6px 4px' }}>
              <CheckCheck size={14} /> Đọc tất cả
            </button>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <Loader2 size={26} color="#2563eb" style={{ animation: 'np-spin 1s linear infinite' }} />
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(37,99,235,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <BellOff size={32} color="#93c5fd" />
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>Không có thông báo nào</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {notifications.map(n => {
              const meta_ = TYPE_META[n.type] ?? { icon: Bell, color: '#64748b', bg: '#f1f5f9' };
              const Icon = meta_.icon;
              const unread = !n.read_at;
              return (
                <div key={n.id} onClick={() => handleItemClick(n)}
                  style={{
                    display: 'flex', gap: 12, padding: '14px 16px', borderRadius: 14,
                    background: unread ? '#f8fbff' : 'white', border: `1px solid ${unread ? 'rgba(37,99,235,0.16)' : '#eef0f5'}`,
                    cursor: 'pointer', transition: 'box-shadow .15s',
                  }}
                >
                  <span style={{ width: 38, height: 38, borderRadius: 10, background: meta_.bg, color: meta_.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={17} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: unread ? 700 : 600, color: '#0f172a', flex: 1, minWidth: 0 }}>{n.title}</span>
                      {unread && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563eb', flexShrink: 0 }} />}
                    </div>
                    <div style={{ fontSize: 13, color: '#475569', marginTop: 3, lineHeight: 1.5 }}>{n.body}</div>
                    <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 6 }}>{timeAgo(n.created_at)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {meta && meta.last_page > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 20 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              style={{ height: 36, padding: '0 16px', borderRadius: 9, border: '1px solid #e2e8f0', background: 'white', color: page <= 1 ? '#cbd5e1' : '#2563eb', fontWeight: 700, fontSize: 13, cursor: page <= 1 ? 'not-allowed' : 'pointer' }}>
              Trước
            </button>
            <span style={{ fontSize: 13, color: '#64748b' }}>Trang {meta.current_page}/{meta.last_page}</span>
            <button onClick={() => setPage(p => Math.min(meta.last_page, p + 1))} disabled={page >= meta.last_page}
              style={{ height: 36, padding: '0 16px', borderRadius: 9, border: '1px solid #e2e8f0', background: 'white', color: page >= meta.last_page ? '#cbd5e1' : '#2563eb', fontWeight: 700, fontSize: 13, cursor: page >= meta.last_page ? 'not-allowed' : 'pointer' }}>
              Sau
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
