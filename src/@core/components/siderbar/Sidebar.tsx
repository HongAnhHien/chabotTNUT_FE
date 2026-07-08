import { type FC, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { ChevronRight, ChevronLeft, ChevronDown, PanelLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { type SidebarProps } from "./INavProps";
import { getNavGroupsByRole } from "./nav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@/hooks/useUser";
import logoTNUT from "@/assets/logo_tnut/logo_tnut.png";

const Sidebar: FC<SidebarProps> = ({
  isCollapsed,
  onCollapse,
  onClose,
  userRole = "user",
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
  const { profile, avatarUrl } = useUser();

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const groups = getNavGroupsByRole(userRole);

  const toggleMenu = (title: string) =>
    setOpenMenus((prev) => ({ ...prev, [title]: !prev[title] }));

  const isActive = (href?: string) => !!href && location.pathname === href;
  const isParentActive = (children?: { path: string }[]) =>
    children?.some((c) => location.pathname === c.path) ?? false;

  // flatten tất cả items để dùng ở collapsed mode
  const allItems = groups.flatMap((g) => g.items);

  return (
    <div
      className={`
      flex flex-col h-full 
      transition-all duration-300 ease-in-out
      ${isCollapsed ? 'w-16 ' : 'w-64'}
    `}
    >
      {/* ── Brand ─────────────────────────────────── */}
      <div
        className={`
        flex items-center h-20 shrink-0 
        ${isCollapsed ? "justify-center px-0" : "justify-between px-4"}
      `}
      >
        {/* Logo */}
        <div
          className={`flex items-center gap-2.5 ${isCollapsed ? "" : ""}`}
          onClick={() => isCollapsed && onCollapse?.(false)}
        >
          <img
            src={logoTNUT}
            alt="TNUT"
            className={`shrink-0 cursor-pointer object-contain ${isCollapsed ? "w-10 h-10" : "w-8 h-8"}`}
          />

          {!isCollapsed && (
            <div>
              <p className="text-sm font-bold text-sidebar-primary leading-none">
                TNUT Learning
              </p>
              <p className="text-[10px] text-sidebar-foreground mt-0.5">
                {t(`role.${userRole}`)}
              </p>
            </div>
          )}
        </div>

        {/* Collapse toggle — chỉ hiện khi expanded và không phải mobile */}
        {!isCollapsed && isMobile && (
          <button
            onClick={() => onClose?.()}
            className="flex items-center justify-center w-8 h-8 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Nav ───────────────────────────────────── */}
      <nav
        className="flex-1 overflow-y-auto py-2 space-y-0.5"
        style={{ scrollbarWidth: "none" }}
      >
        {/* COLLAPSED: chỉ icon, không section */}
        {isCollapsed && (
          <div className="flex flex-col items-center gap-0.5 px-2 py-1">
            {allItems.map((link) => {
              const active =
                isActive(link.href) || isParentActive(link.children);
              return (
                <button
                  key={link.title}
                  title={t(link.title)}
                  onClick={() => {
                    if (link.children?.length) {
                      // navigate tới child đầu tiên
                      navigate(link.children[0].path);
                    } else if (link.href) {
                      navigate(link.href);
                    }
                  }}
                  className={`
                    w-10 h-10 rounded-lg flex items-center justify-center transition-colors
                    ${
                      active
                        ? "text-sidebar-accent bg-sidebar-primary"
                        : "text-sidebar-foreground hover:bg-sidebar-primary hover:text-sidebar-accent"
                    }
                  `}
                >
                  <link.icon className="w-4 h-4 shrink-0" />
                </button>
              );
            })}
          </div>
        )}

        {/* EXPANDED: grouped by section */}
        {!isCollapsed && (
          <div className="px-2 space-y-4">
            {groups.map(({ section, label, items }) => (
              <div key={section}>
                {/* Section label */}
                <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/50 px-2 mb-1">
                  {t(label)}
                </p>

                <div className="space-y-0.5">
                  {items.map((link) => {
                    const active = isActive(link.href);
                    const parentActive = isParentActive(link.children);
                    const hasChildren = !!link.children?.length;
                    const isOpen = openMenus[link.title] ?? parentActive;

                    return (
                      <div key={link.title}>
                        <button
                          onClick={() => {
                            if (hasChildren) toggleMenu(link.title);
                            else if (link.href) navigate(link.href);
                          }}
                          className={`
                            w-full flex items-center justify-between gap-2.5 px-2 py-2 rounded-lg text-sm
                            transition-colors
                            ${
                              active || parentActive
                               ? "text-sidebar-accent bg-sidebar-primary"
                        : "text-sidebar-foreground hover:bg-sidebar-primary hover:text-sidebar-accent"
                            }
                          `}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <link.icon
                              className={`w-4 h-4 shrink-0 ${active || parentActive ? "text-sidebar-primary-foreground" : ""}`}
                            />
                            <span className="truncate">{t(link.title)}</span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {link.badge && (
                              <span className="px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold leading-none">
                                {link.badge}
                              </span>
                            )}
                            {hasChildren &&
                              (isOpen ? (
                                active || parentActive ? (
                                  <ChevronDown className="w-3.5 h-3.5 text-sidebar-primary-foreground" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5 text-sidebar-foreground" />
                                )
                              ) : (
                                active || parentActive ? (
                                  <ChevronRight className="w-3.5 h-3.5 text-sidebar-primary-foreground" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5 text-sidebar-foreground" />
                                )
                              ))}
                          </div>
                        </button>

                        {/* Sub-menu */}
                        {hasChildren && isOpen && (
                          <div className="mt-0.5 ml-4 pl-3 border-l border-sidebar-border space-y-0.5">
                            {link.children!.map((child) => (
                              <button
                                key={child.path}
                                onClick={() => navigate(child.path)}
                                className={`
                                  w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors
                                  ${
                                    location.pathname === child.path
                                    ? "text-sidebar-accent bg-sidebar-primary/70"
                        : "text-sidebar-foreground hover:bg-sidebar-primary hover:text-sidebar-accent"
                                  }
                                `}
                              >
                                {t(child.label)}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </nav>

      {/* ── Collapse toggle — desktop only ───────── */}
      {!isMobile && onCollapse && (
        <div className={`shrink-0 border-t border-sidebar-border ${isCollapsed ? "p-2" : "p-2.5"}`}>
          <button
            onClick={() => onCollapse(!isCollapsed)}
            title={isCollapsed ? "Mở rộng" : "Thu gọn"}
            className={`w-full flex items-center rounded-lg px-2 py-1.5 text-xs text-sidebar-foreground hover:bg-sidebar-primary transition-colors ${isCollapsed ? "justify-center" : "justify-between"}`}
          >
            {!isCollapsed && <span>Thu gọn</span>}
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}

      {/* ── User profile ──────────────────────────── */}
      <div className={`shrink-0  ${isCollapsed ? "p-2" : "p-3"}`}>
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-1.5">
            <button onClick={() => navigate('/me/profile')} className="rounded-full">
              <Avatar size="default">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="text-xs font-semibold">
                  {profile?.name?.charAt(0).toUpperCase() ?? 'U'}
                </AvatarFallback>
              </Avatar>
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate('/me/profile')}
            className="w-full flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-sidebar-primary transition-colors group"
          >
            <Avatar size="default">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="text-xs font-semibold">
                {profile?.name?.charAt(0).toUpperCase() ?? 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-sidebar-primary truncate group-hover:text-sidebar-accent">
                {profile?.name ?? '—'}
              </p>
              <p className="text-[11px] text-sidebar-foreground truncate group-hover:text-sidebar-accent">
                {profile?.email ?? t(`role.${userRole}`)}
              </p>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
