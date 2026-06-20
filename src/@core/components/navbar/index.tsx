import { type FC, useState } from 'react';
import { useNavigate } from 'react-router';
import { PanelLeft,  Moon, Sun,  } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// import i18n, { type Language } from '@/provider/i18n/config';
import { useUser } from '@/hooks/useUser';

interface NavbarProps {
  // mobile drawer
  setMenuVisibility?: (visible: boolean) => void;
  menuVisibility?: boolean;
  isMobile?: boolean;
  // desktop sidebar collapse
  isCollapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  // other
  notificationCount?: number;
  onNotificationClick?: () => void;
  onSettingsClick?: () => void;
}

export const Navbar: FC<NavbarProps> = ({
  setMenuVisibility,
  menuVisibility,
  isMobile,
  isCollapsed,
  onCollapse,
  // notificationCount = 1,
  // onNotificationClick,
}) => {
  const navigate = useNavigate();
  const { profile, avatarUrl } = useUser();
  const userName = profile?.name ?? profile?.username ?? 'User';
  const [isDark, setIsDark] = useState(
    () => document.documentElement.classList.contains('dark')
  );

// const [lang, setLang] = useState<Language>(() => i18n.language as Language);

  // const toggleLang = () => {
  //   const next: Language = lang === 'vi' ? 'en' : 'vi';
  //   i18n.changeLanguage(next);
  //   setLang(next);
  // };

  const toggleDark = () => {
    const root = document.documentElement;
    if (root.classList.contains('dark')) {
      root.classList.remove('dark');
      setIsDark(false);
    } else {
      root.classList.add('dark');
      setIsDark(true);
    }
  };

  return (
    <div className="flex h-14 items-center gap-3 px-4 ">
      {/* Sidebar toggle — mobile: drawer, desktop: collapse */}
      <button
        onClick={() => {
          if (isMobile) setMenuVisibility?.(!menuVisibility);
          else onCollapse?.(!isCollapsed);
        }}
        className="flex items-center justify-center w-8 h-8 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
        aria-label="Toggle sidebar"
      >
        <PanelLeft className="w-4 h-4" />
      </button>

      {/* Divider */}
      <div className="h-5 w-px bg-border" />

      {/* Search */}
      {/* <button
        onClick={() => {}}
        className="flex items-center gap-2.5 flex-1 max-w-xs h-9 px-3 rounded-lg border border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-sm"
        aria-label="Search"
      >
        <Search className="w-3.5 h-3.5 shrink-0" />
        <span className="flex-1 text-left text-sm">Search...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-border bg-background text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button> */}

      {/* Right side */}
      <div className="flex items-center gap-1 ml-auto">

        {/* Bell */}
        {/* <button
          onClick={onNotificationClick}
          className="relative flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          {notificationCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500" />
          )}
        </button> */}

        {/* Language toggle */}
        {/* <button
          onClick={toggleLang}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-xs font-semibold"
          aria-label="Toggle language"
        >
          {lang === 'vi' ? '🇻🇳' : '🇺🇸'}
        </button> */}

        {/* Dark mode toggle */}
        <button
          onClick={toggleDark}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label="Toggle dark mode"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Settings / emoji */}
        {/* <button
          className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label="Settings"
        >
          <Smile className="w-4 h-4" />
        </button> */}

        {/* Avatar */}
        <button
          onClick={() => navigate('/me/profile')}
          className="ml-1 rounded-full ring-2 ring-border hover:ring-primary/30 transition-all"
          aria-label="User menu"
        >
          <Avatar size="default">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="text-xs font-semibold">
              {userName.split(' ').map(n => n[0]).slice(-2).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </button>
      </div>
    </div>
  );
};
