import { type FC, useEffect, useRef, useState } from "react";
import { PanelLeft, Bell, LogOut } from "lucide-react";
import NotificationPanel from "@/components/common/NotificationPanel";
import type { INotification } from "@/infra/api/interfaces/INotification";

interface NavbarProps {
  // mobile drawer
  setMenuVisibility?: (visible: boolean) => void;
  menuVisibility?: boolean;
  isMobile?: boolean;
  // notifications
  notifications?: INotification[];
  unreadCount?: number;
  notifLoading?: boolean;
  onMarkRead?: (id: string) => void;
  onMarkAllRead?: () => void;
  // other
  onLogout?: () => void;
}

export const Navbar: FC<NavbarProps> = ({
  setMenuVisibility,
  menuVisibility,
  isMobile,
  notifications = [],
  unreadCount = 0,
  notifLoading = false,
  onMarkRead,
  onMarkAllRead,
  onLogout,
}) => {
  const [panelOpen, setPanelOpen] = useState(false);
  const bellWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!panelOpen) return;
    const handler = (e: MouseEvent) => {
      if (!bellWrapRef.current?.contains(e.target as Node)) setPanelOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [panelOpen]);

  return (
    <div className="flex h-14 items-center gap-3 px-4">
      {/* Sidebar toggle — mobile only, desktop dùng nút thu gọn trong Sidebar */}
      {isMobile && (
        <>
          <button
            onClick={() => setMenuVisibility?.(!menuVisibility)}
            className="flex items-center justify-center w-8 h-8 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
            aria-label="Toggle sidebar"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
          <div className="h-5 w-px bg-border" />
        </>
      )}

      {/* Right side */}
      <div className="flex items-center gap-1 ml-auto">
        {/* Bell */}
        <div ref={bellWrapRef} className="relative">
          <button
            onClick={() => setPanelOpen((v) => !v)}
            className="relative flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500" />
            )}
          </button>

          {panelOpen && (
            <NotificationPanel
              notifications={notifications}
              unreadCount={unreadCount}
              loading={notifLoading}
              onMarkRead={(id) => onMarkRead?.(id)}
              onMarkAllRead={() => onMarkAllRead?.()}
              onItemClick={() => setPanelOpen(false)}
            />
          )}
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-600/20 bg-red-500/5 text-red-600 text-xs font-semibold hover:bg-red-500/10 transition-colors ml-1"
        >
          <LogOut className="w-3.5 h-3.5" />
          Đăng xuất
        </button>
      </div>
    </div>
  );
};
