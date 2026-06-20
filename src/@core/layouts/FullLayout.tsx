import { type FC, type ReactNode, useEffect, useState, cloneElement, isValidElement } from 'react';
import { useLocation } from 'react-router';

interface FullLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  navbar?: ReactNode;
  footer?: ReactNode;
  sidebarCollapsed?: boolean;
  onMenuVisibilityChange?: (visible: boolean) => void;
}

const FullLayout: FC<FullLayoutProps> = ({ 
  children, 
  sidebar,
  navbar,
  footer,
  sidebarCollapsed = false,
  onMenuVisibilityChange
}) => {
  const location = useLocation();

  // ** States
  const [isMounted, setIsMounted] = useState(false);
  const [menuVisibility, setMenuVisibility] = useState(false);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  // ** Update Window Width
  const handleWindowWidth = () => {
    setWindowWidth(window.innerWidth);
  };

  // ** Handle menu visibility change
  const handleMenuVisibility = (visible: boolean) => {
    setMenuVisibility(visible);
    onMenuVisibilityChange?.(visible);
  };

  // ** Handle window resize
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleWindowWidth);
      return () => window.removeEventListener('resize', handleWindowWidth);
    }
  }, []);

  // ** Close menu on route change (mobile)
  useEffect(() => {
    if (menuVisibility && windowWidth < 1024) {
      handleMenuVisibility(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // ** ComponentDidMount
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // ** Don't render until mounted (prevent hydration issues)
  if (!isMounted) {
    return null;
  }

  const isMobile = windowWidth < 1024;
  const showOverlay = menuVisibility && isMobile;
  
  // Dynamic sidebar width based on collapsed state
  const sidebarWidth = sidebarCollapsed ? 'w-20' : 'w-64';
  const contentMargin = sidebarCollapsed ? 'ml-20' : 'ml-64';

  // ** Props to inject into navbar
  const navbarProps = {
    setMenuVisibility: handleMenuVisibility,
    isMobile,
    menuVisibility
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-primary-dark via-primary-light to-secondary">
      {/* Sidebar - Glass Effect */}
      {sidebar && (
        <>
          <aside 
            className={`
              fixed left-0 top-0 h-screen ${sidebarWidth}
              backdrop-blur-xl bg-white/10 
              border-r border-white/20 shadow-2xl 
              transition-all duration-300 ease-in-out
              ${isMobile && !menuVisibility ? '-translate-x-full' : 'translate-x-0'}
              z-50
            `}
          >
            <div className="h-full overflow-y-auto">
              {sidebar}
            </div>
          </aside>

          {/* Mobile Overlay */}
          {showOverlay && (
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => handleMenuVisibility(false)}
            />
          )}
        </>
      )}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col ${sidebar && !isMobile ? contentMargin : ''} transition-all duration-300`}>
        {/* Navbar - Glass Effect */}
        {navbar && (
          <header className="sticky top-0 backdrop-blur-xl bg-white/10 border-b border-white/20 shadow-lg z-30">
            {/* Clone navbar element and inject props if it's a valid React element */}
            {isValidElement(navbar) ? cloneElement(navbar, navbarProps as any) : navbar}
          </header>
        )}

        {/* Content */}
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>

        {/* Footer - Glass Effect */}
        {footer && (
          <footer className="backdrop-blur-xl bg-white/10 border-t border-white/20 shadow-lg">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
};

export default FullLayout;